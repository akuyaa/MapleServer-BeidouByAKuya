// 物品兑换配置：[目标物品ID, 消耗材料ID, 单个消耗数量]
var itemSet = [
    [2340000, 4001006, 1],            //混沌祝福
    [2049100, 4001006, 1], 
    [2340000, 4001126, 1],
    [2049100, 4001126, 1],
    [2049115, 2049100, 10],
    [2049115, 4000313, 20],            //正向混沌50%
    [1022211, 4002004, 10],            //漩涡眼镜   
    [1032224, 4002004, 20],            //漩涡耳环
    [1122269, 4002004, 20],            //漩涡吊坠

    //[1022226, 4000313, 50],            //120 独眼巨人
    //[1032223, 4000313, 50],            //150 最高贝勒德耳环
    //[1122267, 4000313, 50],            //150 最高贝勒德吊坠
    //[1113075, 4000313, 50],            //150 最高贝勒德戒指
    //[1132246, 4000313, 50],            //150 最高贝勒德腰带
    //[1113211, 4000313, 50],            //150 天堂
    //[1102481, 4000313, 50],            //150 暴君战士披风
    //[1102482, 4000313, 50],            //150 暴君魔法师披风
    //[1102483, 4000313, 50],            //150 暴君弓箭手披风
    //[1102484, 4000313, 50],            //150 暴君飞侠披风
    //[1102485, 4000313, 50],            //150 暴君海盗披风
    //[1072743, 4000313, 50],            //150 暴君战士鞋
    //[1072744, 4000313, 50],            //150 暴君魔法师鞋
    //[1072745, 4000313, 50],            //150 暴君弓箭手鞋
    //[1072746, 4000313, 50],            //150 暴君飞侠鞋
    //[1072747, 4000313, 50],            //150 暴君海盗鞋
    //[1052526, 4000313, 50],            //135 混沌品克缤大衣
    [1003209, 4000313, 50],            //30 圣诞鹿变身帽
    //[1012174, 4000313, 50],            //180 伤口
    //[1012171, 4000313, 30],            //100 伤口
    //[1112734, 4000313, 50],            //30 龙魂
    //[1112763, 4000313, 30],            //10 力量戒指
    //[1112775, 4000313, 30],            //10 敏捷戒指
    //[1112771, 4000313, 30],            //10 智慧戒指
    //[1112767, 4000313, 30],            //10 运气戒指
    //[1142660, 4000313, 30],            //0 首席设计师
    //[2022282, 4000313, 3],             //药剂
    //[2022179, 4000313, 3],             //苹果
    //[2022283, 4000313, 3],             //煮锅
    [1902021, 4002003, 5],            //坐骑 钢铁变形侠
    [1912014, 4002003, 5],            //坐骑 钢铁变形侠马鞍
    [1902008, 4002003, 5],            //坐骑 青蛙
    [1912003, 4002003, 5],            //坐骑 青蛙皮鞍子
    [1902011, 4002003, 5],            //坐骑 乌龟
    [1912007, 4002003, 5],            //坐骑 乌龟鞍
    [1902020, 4002003, 5],            //坐骑 热气球
    [1912013, 4002003, 5],            //坐骑 热气球鞍
    [1902036, 4002003, 5],            //坐骑 枫叶车
    [1912029, 4002003, 5],            //坐骑 枫叶车鞍
    [1902038, 4002003, 5],            //坐骑 女女机车
    [1912031, 4002003, 5],            //坐骑 女女机车钥匙
    [1902039, 4002003, 5],            //坐骑 男男机车
    [1912032, 4002003, 5],            //坐骑 男男机车钥匙
    [1902013, 4002003, 5],            //坐骑 水牛
    [1912009, 4002003, 5],            //坐骑 水牛马鞍
    [1902014, 4002003, 5],            //坐骑 玩具坦克
    [1912010, 4002003, 5],            //坐骑 玩具坦克鞍子
    [1902024, 4002003, 5],            //坐骑 天马
    [1912017, 4002003, 5],            //坐骑 天马连心石
    [1902004, 4002003, 5],            //坐骑 玩具木马
    [1912002, 4002003, 5],            //坐骑 木马鞍子
    [1902028, 4002003, 5],            //坐骑 筋斗云
    [1912021, 4002003, 5],            //坐骑 筋斗云鞍子
    [1902061, 4002003, 5],            //坐骑 兔子车夫
    [1912054, 4002003, 5],            //坐骑 兔子车夫鞍子
    [1902059, 4002003, 5],            //坐骑 巨无霸兔子
    [1912052, 4002003, 5],            //坐骑 巨无霸兔子鞍子
    [1902060, 4002003, 5],            //坐骑 兔兔加油
    [1912053, 4002003, 5],            //坐骑 兔兔加油鞍子
    [1902012, 4002003, 5],            //坐骑 雪吉拉騎寵
    [1912008, 4002003, 5],            //坐骑 雪吉拉鞍

    [3010099, 4002003, 5],            //椅子 北极熊
    [3010014, 4002003, 5],            //
    [3010058, 4002003, 5],            //
    [3010085, 4002003, 5],            //
    [3010043, 4002003, 5],            //
    [3010045, 4002003, 5],            //

	
    [5150040, 4030012, 100]           //皇家理发 普通
];
// 全局变量
var status = 0;
var selectedItemIdx; // 选中的物品索引
var targetItemId;    // 目标物品ID
var costItemId;      // 消耗材料ID
var singleCostCount; // 单个目标物品消耗材料数量
var exchangeCount;   // 兑换数量
// 分页配置（每页30个物品，集中管理）
var pageConfig = {
    currentPage: 1,
    itemsPerPage: 12,
    getTotalPages: function() {
        return Math.max(1, Math.ceil(itemSet.length / this.itemsPerPage));
    },
    prevPageMark: itemSet.length,    
    nextPageMark: itemSet.length + 1 
};
function start() {
    action(1, 0, 0);
}
function action(mode, type, selection) {
    if (mode === -1 || mode === 0) {
        cm.dispose();
        return;
    }
    status++;
    if (status === 1) {
        var pageContent = buildItemPageContent();
        cm.sendSimple(pageContent);
        return;
    }
    if (status === 2) {
        if (handlePageAction(selection)) {
            return;
        }
        selectedItemIdx = selection;
        targetItemId = itemSet[selectedItemIdx][0];
        costItemId = itemSet[selectedItemIdx][1];
        singleCostCount = itemSet[selectedItemIdx][2];
        let confirmContent = `你选择兑换：\r\n#i${targetItemId}# #t${targetItemId}#\r\n\r\n`;
        confirmContent += `单个消耗：#v${costItemId}#x#b${singleCostCount}#k\r\n\r\n`;
        confirmContent += "请输入兑换个数（#b1#k-#b100#k）：";
        cm.sendGetNumber(confirmContent, 1, 1, 100);
        return;
    }
    if (status === 3) {
        exchangeCount = parseInt(selection);
        if (isNaN(exchangeCount) || exchangeCount < 1 || exchangeCount > 100) {
            cm.sendOk("兑换数量不合法，请重新操作！");
            cm.dispose();
            return;
        }
        const totalCostCount = singleCostCount * exchangeCount;
        if (!cm.haveItem(costItemId, totalCostCount)) {
            cm.sendOk(`材料不足！兑换 #b${exchangeCount}#k 个 #t${targetItemId}# 需要 #v${costItemId}#x#b${totalCostCount}#k，你当前的数量不足。`);
            cm.dispose();
            return;
        }
        if (!cm.canHold(targetItemId, exchangeCount)) {
            cm.sendOk(`背包空间不足！无法容纳 #b${exchangeCount}#k 个 #t${targetItemId}#，请清理背包后重试。`);
            cm.dispose();
            return;
        }
        cm.gainItem(costItemId, -totalCostCount);
        for (let i = 0; i < exchangeCount; i++) {
            cm.gainItem(targetItemId, 1);
        }
        cm.sendOk(`兑换成功！已为你发放 #b${exchangeCount}#k 个 #t${targetItemId}#，并扣除 #v${costItemId}#x#b${totalCostCount}#k。`);
        cm.dispose();
        return;
    }
}

/**
 * 核心修改：让上一页和下一页在同一水平线显示
 */
function buildItemPageContent() {
    var config = pageConfig;
    var totalPages = config.getTotalPages();
    config.currentPage = Math.max(1, Math.min(config.currentPage, totalPages));
    var startIndex = (config.currentPage - 1) * config.itemsPerPage;
    var endIndex = Math.min(startIndex + config.itemsPerPage, itemSet.length);

    // 标题部分：请选择你想兑换的物品（当前第 X/Y 页）
    var content = `请选择你想兑换的物品（当前第 #b${config.currentPage}#k / #b${totalPages}#k 页）`;

    // 翻页按钮拼接：上一页和下一页用空格分隔，无换行，确保同一水平线
    if (totalPages > 1) {
        content += "  "; // 标题与按钮之间的空格
        // 上一页按钮（存在时显示）
        if (config.currentPage > 1) {
            content += `#L${config.prevPageMark}#【上一页】#l    `; // 按钮间用4个空格分隔，间距均匀
        }
        // 下一页按钮（存在时显示）
        if (config.currentPage < totalPages) {
            content += `#L${config.nextPageMark}#【下一页】#l`;
        }
    }

    // 标题+按钮后，换行一次，与下方物品列表隔一行行距
    content += "\r\n\r\n";

    // 拼接物品列表
    if (itemSet.length === 0) {
        content += "#b暂无可兑换物品#k";
    } else {
        for (let i = startIndex; i < endIndex; i++) {
            const [itemId, costId, costCnt] = itemSet[i];
            content += `#L${i}# #v${itemId}# #z${itemId}# - #v${costId}#x#b${costCnt}#k#l\r\n`;
        }
    }

    return content;
}

function handlePageAction(selection) {
    var config = pageConfig;
    switch (selection) {
        case config.prevPageMark:
            config.currentPage--;
            break;
        case config.nextPageMark:
            config.currentPage++;
            break;
        default:
            return false;
    }
    status = 0;
    action(1, 0, 0);
    return true;
}