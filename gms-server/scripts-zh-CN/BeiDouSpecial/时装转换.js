/* =========================================================
 * 时装同部位属性转移（无反射、无锁、仅同部位）
 * ========================================================= */

var status = -1;
var sourceSlot = -1;

/* ===== 只认 cash + 用 id 区间判部位 ===== */
function isFashion(item) {
    if (!item) return false;
    var ii = Java.type("org.gms.server.ItemInformationProvider").getInstance();
    return ii.isCash(item.getItemId());
}

/* 判断时装是否已被升星（owner 包含 ★ 或其他标记） */
function isStarred(item) {
    if (!item) return false;
    try {
        var owner = item.getOwner ? item.getOwner() : "";
        if (!owner) return false;
        if (owner.indexOf('★') !== -1 || owner.indexOf('\u2605') !== -1 || owner.indexOf('*') !== -1) return true;
        if (owner.indexOf('星') !== -1) return true;
        if (/★\d+/.test(owner) || /\*\d+/.test(owner)) return true;
        return false;
    } catch (e) {
        return false;
    }
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
            cm.sendSimple("请选择操作\r\n#L0#我要同部位转移时装属性#l");
            break;

        case 1: // 源时装列表
            if (selection !== 0) { cm.dispose(); return; }
            var txt = "#e选择要提取属性的时装#n\r\n", found = false;
            for (var i = 0; i <= 96; i++) {
                var it = cm.getInventory(1).getItem(i);
                // 仅列出未升星的时装作为源
                if (isFashion(it) && !isStarred(it)) {
                    found = true;
                    txt += `#L${i}##v${it.getItemId()}##z${it.getItemId()}##k\r\n`;
                }
            }
            if (!found) { cm.sendOk("装备栏里没有时装！"); cm.dispose(); return; }
            cm.sendSimple(txt);
            break;

        case 2: // 同部位目标列表（id 区间版）
            sourceSlot = selection;
            const srcItem = cm.getInventory(1).getItem(sourceSlot);
            const srcPart = getBodyPart(srcItem);

            let txt2 = "#e选择要获得属性的时装#n\r\n", found2 = false;
            for (let i = 0; i <= 96; i++) {
                if (i === sourceSlot) continue;
                const it = cm.getInventory(1).getItem(i);
                if (!it || !isFashion(it)) continue;
                // 目标也不能为已升星的时装
                if (getBodyPart(it) === srcPart && !isStarred(it)) {
                    found2 = true;
                    txt2 += `#L${i}##v${it.getItemId()}##z${it.getItemId()}##k\r\n`;
                }
            }
            if (!found2) { cm.sendOk("没有同部位的时装可转化！"); cm.dispose(); return; }
            cm.sendSimple(txt2);
            break;

        case 3: // 属性复制
            const targetSlot = selection;
            const inv = cm.getInventory(1);
            const sourceItem = inv.getItem(sourceSlot);
            const targetItem = inv.getItem(targetSlot);

            if (!sourceItem || !targetItem) {
                cm.sendOk("位置异常，请重新操作！");
                cm.dispose();
                return;
            }

            // 禁止对已升星的时装进行转移
            if (isStarred(sourceItem) || isStarred(targetItem)) {
                cm.sendOk("已升星的时装不能进行属性转化。");
                cm.dispose();
                return;
            }

            /* 复制属性 */
            targetItem.setStr(sourceItem.getStr());
            targetItem.setDex(sourceItem.getDex());
            targetItem.setInt(sourceItem.getInt());
            targetItem.setLuk(sourceItem.getLuk());
            targetItem.setWatk(sourceItem.getWatk());
            targetItem.setMatk(sourceItem.getMatk());

            sourceItem.setStr(0);
            sourceItem.setDex(0);
            sourceItem.setInt(0);
            sourceItem.setLuk(0);
            sourceItem.setWatk(0);
            sourceItem.setMatk(0);

            /* 永久化 */
            sourceItem.setExpiration(-1);
            targetItem.setExpiration(-1);

            /* 刷新客户端 */
            cm.getPlayer().forceUpdateItem(sourceItem);
            cm.getPlayer().forceUpdateItem(targetItem);

            cm.sendOk("转移完成！\r\n" +
                "#v" + targetItem.getItemId() + "# 已获得属性并变为永久，\r\n" +
                "#v" + sourceItem.getItemId() + "# 已清空并变为永久！");
            cm.dispose();
            break;

        default:
            cm.dispose();
    }
}