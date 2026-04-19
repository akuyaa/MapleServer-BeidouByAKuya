



/* =========================================================
 * 时装升星脚本
 * 说明：
 * - 适用范围：现金时装（同原时装转换脚本的判定方式）
 * - 等级：0 ~ 5（5为满星）
 * - 消耗：每次升星消耗 5000 点券（直接从点券余额扣除）
 * - 成功：增加 0~2 的全属性（STR/DEX/INT/LUK/WATK/MATK），并将装备的“owner”字段添加/更新★后缀以表示当前星级
 * - 失败：装备直接消失
 * 
 * 说明/假设：脚本未提供具体成功率，这里使用 50% 成功率作为合理默认值（可按需调整 successRate 变量）。
 * 因为 Equip 对象没有直接允许修改显示名称（name）的方法，脚本使用 item.setOwner(...) 将星级信息写入 Owner 字段来作为显示后缀（保留原有 owner 文本）。
 * ========================================================= */

var status = -1;
var selectedSlot = -1;
var selectedMode = 0; // 0: 普通升星, 1: 必成升星
var SUCCESS_COST = 5000; // 每次升星消耗点券
var MAX_STAR = 5;
var successRate = 0.5; // 成功率（可修改）
var GUARANTEE_COST = 100000; // 必成升星消耗点券



function isFashion(item) {
    if (!item) return false;
    var id = item.getItemId();
    var ii = Java.type("org.gms.server.ItemInformationProvider").getInstance();

    // 1. 首先必须是点券物品
    if (!ii.isCash(id)) return false;

    // 2. 限制 ID 范围在装备类 (1xxxxxx)
    var category = Math.floor(id / 1000000);
    if (category !== 1) return false;

    // 3. 细分过滤：排除掉戒指(111)、项链/脸饰/眼饰等(101, 102, 103, 112)
    // 这里的逻辑是：只保留 武器、帽子、衣服、裤子、套装、手套、鞋子、披风
    var type = Math.floor(id / 10000);

    // 常见防具/武器类型代码：
    // 100: 帽子, 104: 上衣, 105: 套装, 106: 裤子, 107: 鞋子, 108: 手套, 110: 披风
    // 13x, 14x, 170: 武器/点券武器
    var allowedTypes = [
        100, 104, 105, 106, 107, 108, 110, // 防具
        130, 131, 132, 133, 137, 138, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 170 // 武器类
    ];

    for (var i = 0; i < allowedTypes.length; i++) {
        if (type === allowedTypes[i]) return true;
    }

    return false; // 其余（如戒指、吊坠、耳环、脸饰、眼饰、徽章等）全部排除
}

function getBodyPart(item) {
    if (!item) return -1;
    var id = item.getItemId();
    if (Math.floor(id / 1000000) !== 1) return -1;
    var p = Math.floor(id / 1000);
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

function parseStarFromOwner(owner) {
    if (!owner) return 0;
    // 尝试匹配末尾的 ★n 或者 包含 ★n（如 "玩家 | ★3"）
    var m = owner.match(/★(\d+)$/);
    if (m && m.length >= 2) return parseInt(m[1], 10);
    m = owner.match(/★(\d+)/);
    if (m && m.length >= 2) return parseInt(m[1], 10);
    return 0;
}

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

function start() {
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode === -1) { cm.dispose(); return; }
    if (mode === 0) { cm.sendOk("已取消。"); cm.dispose(); return; }
    if (mode === 1) status++;

    switch (status) {
        case 0:
            selectedMode = 0;
            cm.sendSimple("#e时装升星#n\r\n请选择：\r\n#L0#我要为时装升星（消耗 5000 点券/次）#l\r\n#L1#我要花费 " + GUARANTEE_COST + " 点券直接必成#l");
            break;

        case 1:
            if (selection !== 0 && selection !== 1) { cm.dispose(); return; }
            selectedMode = selection;
            var txt = "#e选择要升星的时装#n\r\n", found = false;
            for (var i = 0; i <= 96; i++) {
                var it = cm.getInventory(1).getItem(i);
                if (isFashion(it)) {
                    found = true;
                    var owner = it.getOwner ? it.getOwner() : "";
                    var star = parseStarFromOwner(owner);
                    txt += "#L" + i + "##v" + it.getItemId() + "##z" + it.getItemId() + "#  （星级: " + star + "）#k\r\n";
                }
            }
            if (!found) { cm.sendOk("装备栏中没有可升星的时装！"); cm.dispose(); return; }
            cm.sendSimple(txt);
            break;

        case 2:
            selectedSlot = selection;
            var inv = cm.getInventory(1);
            var item = inv.getItem(selectedSlot);
            if (!item || !isFashion(item)) { cm.sendOk("所选物品无效，请重试。"); cm.dispose(); return; }

            var owner = item.getOwner ? item.getOwner() : "";
            var curStar = parseStarFromOwner(owner);
            if (curStar >= MAX_STAR) { cm.sendOk("该时装已达到最高星级（" + MAX_STAR + "）！"); cm.dispose(); return; }

            var currentCost = selectedMode === 1 ? GUARANTEE_COST : SUCCESS_COST;
            var playerCash = cm.getPlayer().getCashShop().getCash(1);
            if (playerCash < currentCost) { cm.sendOk("点券不足，升星需要 " + currentCost + " 点券。"); cm.dispose(); return; }

            if (selectedMode === 1) {
                cm.sendYesNo("确定要对 #v" + item.getItemId() + "##z" + item.getItemId() + "# 进行必成升星吗？将消耗 " + currentCost + " 点券，必定成功。当前星级：" + curStar + "\r\n确定要继续？");
            } else {
                cm.sendYesNo("确定要对 #v" + item.getItemId() + "##z" + item.getItemId() + "# 进行升星吗？将消耗 " + currentCost + " 点券，失败装备将消失。当前星级：" + curStar + "\r\n确定要继续？");
            }
            break;

        case 3:
            var inv2 = cm.getInventory(1);
            var target = inv2.getItem(selectedSlot);
            if (!target || !isFashion(target)) { cm.sendOk("位置异常或物品发生变化，请重新操作。"); cm.dispose(); return; }

            var cost = selectedMode === 1 ? GUARANTEE_COST : SUCCESS_COST;
            // 扣除点券
            cm.getPlayer().getCashShop().gainCash(1, -cost);

            // 判定成功/失败
            var success = selectedMode === 1 ? true : (Math.random() < successRate);

            if (success) {
                // 随机 0~2 加到 全属性 (STR/DEX/INT/LUK/WATK/MATK)
                // 每次成功属性增加 2 ~ 4
                var incStr = Math.floor(Math.random() * 3) + 2;
                var incDex = Math.floor(Math.random() * 3) + 2;
                var incInt = Math.floor(Math.random() * 3) + 2;
                var incLuk = Math.floor(Math.random() * 3) + 2;
                var incWatk = Math.floor(Math.random() * 3) + 2;
                var incMatk = Math.floor(Math.random() * 3) + 2;

                target.setStr(target.getStr() + incStr);
                target.setDex(target.getDex() + incDex);
                target.setInt(target.getInt() + incInt);
                target.setLuk(target.getLuk() + incLuk);
                target.setWatk(target.getWatk() + incWatk);
                target.setMatk(target.getMatk() + incMatk);

                // 更新星级 owner
                var oldOwner = target.getOwner ? target.getOwner() : "";
                var oldStar = parseStarFromOwner(oldOwner);
                var newStar = Math.min(MAX_STAR, oldStar + 1);
                var newOwner = buildOwnerWithStar(oldOwner, newStar);
                target.setOwner(newOwner);

                // 永久化（如果需要将装备设置为永久）
                target.setExpiration(-1);

                cm.getPlayer().forceUpdateItem(target);

                cm.sendOk("升星成功！\r\n#v" + target.getItemId() + "# 当前获得属性：STR+" + incStr + " DEX+" + incDex + " INT+" + incInt + " LUK+" + incLuk + " WATK+" + incWatk + " MATK+" + incMatk + "\r\n当前星级：" + newStar);
                cm.dispose();
                return;
            } else {
                // 失败，使用 InventoryManipulator 立即从对应栏位移除（并通知客户端）
                const InventoryManipulator = Java.type('org.gms.client.inventory.manipulator.InventoryManipulator');
                const InventoryType = Java.type('org.gms.client.inventory.InventoryType');
                try {
                    InventoryManipulator.removeFromSlot(cm.getClient(), InventoryType.EQUIP, target.getPosition(), 1, false);
                } catch (e) {
                    // 兜底：若发生异常再尝试直接移除并刷新
                    try { inv2.removeItem(selectedSlot); } catch (e2) { }
                }
                cm.sendOk("很遗憾，升星失败，装备已消失。");
                cm.dispose();
                return;
            }

        default:
            cm.dispose();
    }
}
