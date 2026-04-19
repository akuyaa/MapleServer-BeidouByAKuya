/* =========================================================
 * 时装同部位属性转移（支持已升星时装，保留星级）
 * ========================================================= */

var status = -1;
var sourceSlot = -1;

/* ===== 只认 cash + 用 id 区间判部位 ===== */
function isFashion(item) {
    if (!item) return false;
    var ii = Java.type("org.gms.server.ItemInformationProvider").getInstance();
    return ii.isCash(item.getItemId());
}

/* 从owner字段解析星级 */
function parseStarFromOwner(owner) {
    if (!owner) return 0;
    // 尝试匹配末尾的 ★n 或者 包含 ★n（如 "玩家 | ★3"）
    var m = owner.match(/★(\d+)$/);
    if (m && m.length >= 2) return parseInt(m[1], 10);
    m = owner.match(/★(\d+)/);
    if (m && m.length >= 2) return parseInt(m[1], 10);
    return 0;
}

/* 构建带星级的owner字段 */
function buildOwnerWithStar(originalOwner, star) {
    // 保留原 owner（如果为空则仅写 ★n），如果原 owner 已含 ★x，则替换为新值
    var base = originalOwner || "";
    if (base.match(/★(\d+)/)) {
        return base.replace(/★(\d+)/, "★" + star);
    }
    base = base.trim();
    if (base.length === 0) return "★" + star;
    return base + " | ★" + star;
}

/* 提取owner中的非星级部分（基础名称） */
function getBaseOwner(owner) {
    if (!owner) return "";
    // 移除星级标记部分
    return owner.replace(/[|｜]?\s*★\d+/g, "").trim();
}

function getBodyPart(item) {
    var id = item.getItemId();
    if (Math.floor(id / 1000000) !== 1) return -1;
    var p = Math.floor(id / 1000);
    /* 常见现金部位区间 */
    if (p >= 1000 && p < 1010) return 1;   // Cap
    if (p >= 1102 && p < 1110) return 2;   // Cape
    if (p >= 1040 && p < 1050) return 3;   // Coat
    if (p >= 1050 && p < 1060) return 4;   // Longcoat
    if (p >= 1060 && p < 1070) return 5;   // Pants
    if (p >= 1070 && p < 1080) return 6;   // Shoes
    if (p >= 1080 && p < 1090) return 7;   // Glove
    if (p >= 1092 && p < 1100) return 8;   // Shield
    if ((p >= 1013 && p < 1040) || (p >= 1122 && p < 1123)) return 9; // Accessory
    if (p >= 1112 && p < 1120) return 10;  // Ring
    if (p >= 1012 && p < 1013) return 11;  // Face
    if (p >= 1011 && p < 1012) return 12;  // Hair
    return -1;
}

function start() {
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode === -1) { cm.dispose(); return; }
    if (mode === 0) { cm.sendOk("已取消。"); cm.dispose(); return; }
    if (mode === 1) status++;

    switch (status) {
        case 0:
            cm.sendSimple("请选择操作\r\n#L0#我要同部位转移时装属性（支持已升星时装）#l");
            break;

        case 1: // 源时装列表（现在包含所有升星时装）
            if (selection !== 0) { cm.dispose(); return; }
            var txt = "#e选择要提取属性的时装#n\r\n#b（已升星时装也可作为源）#k\r\n", found = false;
            for (var i = 0; i <= 96; i++) {
                var it = cm.getInventory(1).getItem(i);
                // 列出所有时装（包括已升星的）
                if (isFashion(it)) {
                    found = true;
                    var owner = it.getOwner ? it.getOwner() : "";
                    var star = parseStarFromOwner(owner);
                    var starDisplay = star > 0 ? " #r(★" + star + ")#k" : "";
                    txt += `#L${i}##v${it.getItemId()}##z${it.getItemId()}#${starDisplay}#k\r\n`;
                }
            }
            if (!found) { cm.sendOk("装备栏里没有时装！"); cm.dispose(); return; }
            cm.sendSimple(txt);
            break;

        case 2: // 同部位目标列表（支持已升星时装）
            sourceSlot = selection;
            const srcItem = cm.getInventory(1).getItem(sourceSlot);
            const srcPart = getBodyPart(srcItem);

            let txt2 = "#e选择要获得属性的时装#n\r\n#b（星级将随属性一同转移）#k\r\n", found2 = false;
            for (let i = 0; i <= 96; i++) {
                if (i === sourceSlot) continue;
                const it = cm.getInventory(1).getItem(i);
                if (!it || !isFashion(it)) continue;
                // 同部位即可，不再限制是否已升星
                if (getBodyPart(it) === srcPart) {
                    found2 = true;
                    var owner = it.getOwner ? it.getOwner() : "";
                    var star = parseStarFromOwner(owner);
                    var starDisplay = star > 0 ? " #r(★" + star + ")#k" : "";
                    txt2 += `#L${i}##v${it.getItemId()}##z${it.getItemId()}#${starDisplay}#k\r\n`;
                }
            }
            if (!found2) { cm.sendOk("没有同部位的时装可转化！"); cm.dispose(); return; }
            cm.sendSimple(txt2);
            break;

        case 3: // 属性复制（包含星级转移）
            const targetSlot = selection;
            const inv = cm.getInventory(1);
            const sourceItem = inv.getItem(sourceSlot);
            const targetItem = inv.getItem(targetSlot);

            if (!sourceItem || !targetItem) {
                cm.sendOk("位置异常，请重新操作！");
                cm.dispose();
                return;
            }

            // 获取源装备的星级
            var srcOwner = sourceItem.getOwner ? sourceItem.getOwner() : "";
            var srcStar = parseStarFromOwner(srcOwner);
            
            // 获取目标装备的基础owner（去除星级部分）
            var targetOwner = targetItem.getOwner ? targetItem.getOwner() : "";
            var targetBaseOwner = getBaseOwner(targetOwner);

            /* 复制属性 */
            targetItem.setStr(sourceItem.getStr());
            targetItem.setDex(sourceItem.getDex());
            targetItem.setInt(sourceItem.getInt());
            targetItem.setLuk(sourceItem.getLuk());
            targetItem.setWatk(sourceItem.getWatk());
            targetItem.setMatk(sourceItem.getMatk());

            // 转移星级到目标装备（保留目标的基础owner名称，加上源的星级）
            var newTargetOwner = buildOwnerWithStar(targetBaseOwner, srcStar);
            targetItem.setOwner(newTargetOwner);

            // 清空源装备属性，但保留其星级标记（可选：也可以清空星级）
            sourceItem.setStr(0);
            sourceItem.setDex(0);
            sourceItem.setInt(0);
            sourceItem.setLuk(0);
            sourceItem.setWatk(0);
            sourceItem.setMatk(0);
            
            // 源装备保留原星级或设为0星，这里选择保留原星级（玩家可能还想继续用它）
            // 如果想清空源装备的星级，注释掉下面这行并取消注释 setOwner("")
            // sourceItem.setOwner(getBaseOwner(srcOwner)); // 清空星级版本

            /* 永久化 */
            sourceItem.setExpiration(-1);
            targetItem.setExpiration(-1);

            /* 刷新客户端 */
            cm.getPlayer().forceUpdateItem(sourceItem);
            cm.getPlayer().forceUpdateItem(targetItem);

            var newStarDisplay = srcStar > 0 ? " #r★" + srcStar + "#k" : "";

            cm.sendOk("转移完成！\r\n" +
                "#v" + targetItem.getItemId() + "# 已获得属性并变为永久" + newStarDisplay + "\r\n" +
                "#v" + sourceItem.getItemId() + "# 已清空属性并变为永久！\r\n\r\n" +
                "#b提示：#k星级已随属性一同转移到目标装备。");
            cm.dispose();
            break;

        default:
            cm.dispose();
    }
}