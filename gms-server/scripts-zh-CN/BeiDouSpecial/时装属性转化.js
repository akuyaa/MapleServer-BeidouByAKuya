/* =========================================================
 *  时装同部位属性转移（无金币、不删道具）
 * ========================================================= */
var status = -1;
var sourceSlot = -1;

/* ===== 时装判断 ===== */
// function isFashion(item) {
//     if (!item) return false;
//     const id = item.getItemId();
//     const prefix = Math.floor(id / 1000);
//     const ori = [1003, 1042, 1073, 1082, 1102, 1112, 1122].includes(prefix);
//     const cst = [2000001, 2000002, 3000100, 9001001];          // 自制ID
//     return ori || cst.includes(id);
// }


/* ===== 时装判断：只看 isCash ===== */
function isFashion(item) {
    if (!item) return false;
    var ii = Java.type("org.gms.server.ItemInformationProvider").getInstance();
    return ii.isCash(item.getItemId());
}


/* ===== 获取 bodyPart：不调用 getEquipmentSlot ===== */
function getBodyPart(item) {
    var ii = Java.type("org.gms.server.ItemInformationProvider").getInstance();
    var stats = ii.getEquipStats(item.getItemId());
    if (stats == null) return -1;

    // 现金道具的 info/islot 或 info/bslot 里就是部位字符串
    var iiCls = Java.type("org.gms.server.ItemInformationProvider");
    var itemData = ii.getItemData(item.getItemId());
    if (itemData == null) return -1;

    var info = itemData.getChildByPath("info");
    if (info == null) return -1;

    // 优先取 islot，没有就取 bslot
    var slot = info.getChildByPath("islot");
    if (slot == null) slot = info.getChildByPath("bslot");
    if (slot == null) return -1;

    var slotStr = slot.getData().toString(); // 如 "Cap", "Cape", "Glove" ...

    // 把字符串映射成数字编号（与客户端一致）
    switch (slotStr) {
        case "Cap":      return 1;
        case "Cape":     return 2;
        case "Coat":     return 3;
        case "Longcoat": return 4;
        case "Pants":    return 5;
        case "Shoes":    return 6;
        case "Glove":    return 7;
        case "Shield":   return 8;
        case "Accessory":return 9;
        case "Ring":     return 10;
        case "Face":     return 11;
        case "Hair":     return 12;
        default:         return -1;
    }
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
            let txt = "#e选择要提取属性的时装#n\r\n", found = false;
            for (let i = 0; i <= 96; i++) {
                const it = cm.getInventory(1).getItem(i);
                if (isFashion(it)) {
                    found = true;
                    txt += `#L${i}##v${it.getItemId()}##z${it.getItemId()}##k\r\n`;
                }
            }
            if (!found) { cm.sendOk("装备栏里没有时装！"); cm.dispose(); return; }
            cm.sendSimple(txt);
            break;

        case 2: // 同部位目标列表（bodyPart 版本）
            sourceSlot = selection;
            const srcItem = cm.getInventory(1).getItem(sourceSlot);
            const srcPart = getBodyPart(srcItem);

            let txt2 = "#e选择要获得属性的时装#n\r\n", found2 = false;
            for (let i = 0; i <= 96; i++) {
                if (i === sourceSlot) continue;
                const it = cm.getInventory(1).getItem(i);
                if (!it || !isFashion(it)) continue;
                if (getBodyPart(it) === srcPart) {   // 真正同部位
                    found2 = true;
                    txt2 += `#L${i}##v${it.getItemId()}##z${it.getItemId()}##k\r\n`;
                }
            }
            if (!found2) {
                cm.sendOk("没有同部位的时装可转化！");
                cm.dispose();
                return;
            }
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

            if (typeof sourceItem.getStr === 'function') {
                /* 属性复制（你的原代码） */
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

                /* ===== 设为永久 ===== */
                sourceItem.setExpiration(-1);
                targetItem.setExpiration(-1);

                /* 刷新背包 */
                cm.getPlayer().forceUpdateItem(targetItem);
                cm.getPlayer().forceUpdateItem(sourceItem);

                cm.sendOk("转移完成！\r\n" +
                    "#v" + targetItem.getItemId() + "# 已获得属性并变为永久，\r\n" +
                    "#v" + sourceItem.getItemId() + "# 已清空并变为永久！");
            } else {
                cm.sendOk("当前核心不支持属性读写，转移失败！");
            }
            cm.dispose();
            break;

        default:
            cm.dispose();
    }
}