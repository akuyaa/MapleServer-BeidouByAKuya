var status;
var text;
var sel = 1; // 固定为装备栏=1
var totalPrice = 0;
var itemList = [];
var limitSlot = 0; // 用户输入的N格

function start() {
    status = -1;
    text = "#e#r【一键出售装备】#k#n\r\n\r\n";
    text += "当前功能：出售#b装备栏#k指定格子之后的道具。\r\n";
    text += "请输入数字 #bN#k (只会出售第 #rN#k 格之后的装备)：";
    
    // 弹出输入框让玩家输入数字N
    cm.sendGetNumber(text, 1, 1, 96);
}

// 接收输入的数字N
function action(mode, type, selection) {
    if (mode == 1) { // 玩家点击确定
        limitSlot = selection;
        scanAndShow();
    } else {
        cm.dispose();
    }
}

function scanAndShow() {
    let inventory = cm.getInventory(sel);
    if (!inventory) {
        cm.sendOk("无法访问装备栏！");
        cm.dispose();
        return;
    }
    
    totalPrice = 0;
    itemList = [];
    
    // 获取 ItemInformationProvider 实例
    let ii = Java.type('org.gms.server.ItemInformationProvider').getInstance();
    
    // 冒险岛背包格子通常从 1 到 96
    for (let i = 1; i <= 96; i++) {
        // 核心修改：只处理大于用户输入的格子 N 的道具
        if (i <= limitSlot) {
            continue;
        }
        
        let item = inventory.getItem(i);
        if (item != null) {
            let itemId = item.getItemId();
            let quantity = item.getQuantity();
            
            let price = 0;
            try {
                price = ii.getPrice(itemId, quantity);
            } catch (e) {
                price = 0;
            }
            
            // 只添加价格大于0的道具
            if (price > 0) {
                totalPrice += price;
                itemList.push({
                    position: i,
                    itemId: itemId,
                    price: price,
                    quantity: quantity
                });
            }
        }
    }
    
    if (itemList.length === 0) {
        cm.sendOk("#r第 " + limitSlot + " 格之后没有可出售的道具！#k");
        cm.dispose();
        return;
    }
    
    text = "#e#b【出售预览】#k#n\r\n";
    text += "出售范围：第 #r" + limitSlot + "#k 格之后的装备\r\n";
    text += "待售数量：#r" + itemList.length + "#k 件\r\n";
    text += "预计获得：#r" + totalPrice + "#k 金币\r\n\r\n";
    
    // 显示前5件详情核对价格
    let displayCount = Math.min(itemList.length, 5);
    text += "#e价格核对（前5件）：#n\r\n";
    for (let i = 0; i < displayCount; i++) {
        let item = itemList[i];
        text += "#i" + item.itemId + "# #t" + item.itemId + "# - #r" + item.price + "#k金币\r\n";
    }
    if (itemList.length > 5) {
        text += "... 还有 " + (itemList.length - 5) + " 件\r\n";
    }
    
    text += "\r\n#L1##g确认出售(获得" + totalPrice + "金币)#l\r\n";
    text += "#L2##r取消#l";
    
    cm.sendNextSelectLevel("ConfirmSell", text);
}

function levelConfirmSell(selection) {
    if (selection === 2) {
        cm.sendOk("已取消出售。");
        cm.dispose();
        return;
    }
    doSell();
}

function doSell() {
    let soldCount = 0;
    let actualGain = 0;
    let ii = Java.type('org.gms.server.ItemInformationProvider').getInstance();
    
    // 按照格子位置从大到小排序，防止删格后位置错乱（虽然cm.removeAllByInventorySlot通常不影响后面的格子，但这是好习惯）
    let sortedItems = itemList.slice().sort(function(a, b) {
        return b.position - a.position;
    });
    
    for (let i = 0; i < sortedItems.length; i++) {
        let item = sortedItems[i];
        try {
            let checkItem = cm.getInventory(sel).getItem(item.position);
            if (checkItem != null && checkItem.getItemId() === item.itemId) {
                let currentPrice = ii.getPrice(item.itemId, checkItem.getQuantity());
                
                // 执行删除
                cm.removeAllByInventorySlot(sel, item.position);
                actualGain += currentPrice;
                soldCount++;
            }
        } catch (e) {
            // 忽略单件出售失败的异常
        }
    }
    
    if (actualGain > 0) {
        cm.gainMeso(actualGain);
    }
    
    text = "#e#b【出售完成】#k#n\r\n\r\n";
    text += "成功出售：#r" + soldCount + "#k / " + itemList.length + " 件\r\n";
    text += "获得金币：#r" + actualGain + "#k\r\n\r\n";
    text += "#L1#继续出售#l\r\n#L2#结束#l";
    
    cm.sendNextSelectLevel("EndOrContinue", text);
}

function levelEndOrContinue(selection) {
    if (selection === 1) {
        start();
    } else {
        cm.sendOk("感谢使用！");
        cm.dispose();
    }
}