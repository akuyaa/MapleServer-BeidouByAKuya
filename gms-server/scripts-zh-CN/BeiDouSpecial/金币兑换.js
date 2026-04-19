﻿﻿var itemSet = Array(
    Array(4000313, 1000000), 
    Array(4001006, 2000000),
    Array(4001126, 2000000),
    //Array(1042254, 50000000),
    //Array(1042255, 50000000),
    //Array(1042256, 50000000),
    //Array(1042257, 50000000),
    //Array(1042258, 50000000),
    //Array(1062165, 50000000),
    //Array(1062166, 50000000),
    //Array(1062167, 50000000),
    //Array(1062168, 50000000),
    //Array(1062169, 50000000),
    //Array(4031179, 3000000),
    Array(4032246, 3000000),
    Array(4001086, 20000000),
    Array(1902001, 50000000)
);

// 核心分页配置（修改为每页10个物品）
var pageConfig = {
    itemsPerPage: 11, // 关键修改：从11改为10
    currentPage: 1,   // 当前页码（1开始）
    getTotalPages: function() {
        return Math.max(1, Math.ceil(itemSet.length / this.itemsPerPage));
    },
    prevPageMark: itemSet.length,    // 上一页标记（无冲突正数）
    nextPageMark: itemSet.length + 1 // 下一页标记（无冲突正数）
};

// 全局变量
var status = 0;
var selectedItemIdx; // 选中物品真实索引
var targetItemId;    // 目标物品ID
var singleCost;      // 单个物品金币成本
var exchangeCount;   // 兑换数量
var totalCost;       // 总金币成本

function start() {
    action(1, 0, 0);
}

function action(mode, type, selection) {
    // 处理取消/关闭操作
    if (mode === -1 || mode === 0) {
        cm.dispose();
        return;
    }

    status++;

    // 第一步：显示分页物品列表
    if (status === 1) {
        var pageContent = buildItemPageContent();
        cm.sendSimple(pageContent);
        return;
    }

    // 第二步：处理翻页/选择物品 → 输入数量
    if (status === 2) {
        // 优先处理翻页
        if (handlePageAction(selection)) {
            return;
        }

        // 计算选中物品真实索引
        var config = pageConfig;
        var startIndex = (config.currentPage - 1) * config.itemsPerPage;
        selectedItemIdx = startIndex + selection;

        // 索引有效性校验
        if (selectedItemIdx < 0 || selectedItemIdx >= itemSet.length) {
            cm.sendOk("无效选择，请重新操作！");
            cm.dispose();
            return;
        }

        // 记录物品信息
        targetItemId = itemSet[selectedItemIdx][0];
        singleCost = itemSet[selectedItemIdx][1];

        // 生成确认窗口（金币以“万”为单位）
        var confirmContent = "你想要兑换：\r\n\r\n";
        confirmContent += `#i${targetItemId}# #t${targetItemId}#\r\n\r\n`;
        confirmContent += `单个所需金币：#r${singleCost / 10000}万#k\r\n\r\n`;
        confirmContent += "请输入购买个数（1-100）：";
        cm.sendGetNumber(confirmContent, 1, 1, 100);
        return;
    }

    // 第三步：执行兑换逻辑（无无效方法调用）
    if (status === 3) {
        // 兑换数量容错处理
        exchangeCount = Math.abs(parseInt(selection)) || 1;
        exchangeCount = Math.min(exchangeCount, 100); // 限制最大100个
        totalCost = singleCost * exchangeCount;

        // 1. 金币充足性校验
        if (cm.getMeso() < totalCost) {
            cm.sendOk(`金币不足！\r\n需要：#r${totalCost / 10000}万#k\r\n当前：#b${cm.getMeso() / 10000}万#k`);
            cm.dispose();
            return;
        }

        // 2. 执行兑换（循环逐个发放，彻底防吞物品）
        try {
            // 扣除金币
            cm.gainMeso(-totalCost);

            // 循环发放（装备/消耗品通用，无叠加问题）
            for (var i = 0; i < exchangeCount; i++) {
                cm.gainItem(targetItemId, 1);
            }

            cm.sendOk(`兑换成功！\r\n已获得：#b${exchangeCount}个#t${targetItemId}#\r\n扣除金币：#r${totalCost / 10000}万#k`);
        } catch (e) {
            // 异常回滚：发放失败返还金币
            cm.gainMeso(totalCost);
            cm.sendOk("兑换失败！物品发放异常，请联系管理员。");
        }

        cm.dispose();
        return;
    }
}

/**
 * 构建分页列表（翻页按钮同一行，紧贴标题）
 */
function buildItemPageContent() {
    var config = pageConfig;
    var totalPages = config.getTotalPages();

    // 页码兜底防越界
    config.currentPage = Math.max(1, Math.min(config.currentPage, totalPages));

    var startIndex = (config.currentPage - 1) * config.itemsPerPage;
    var endIndex = Math.min(startIndex + config.itemsPerPage, itemSet.length);

    // 头部内容（标题+金币余额+翻页按钮）
    var content = `请选择你想购买的物品（当前第 #b${config.currentPage}#k / #b${totalPages}#k 页）`;
    content += `  #d金币余额：#b${cm.getMeso() / 10000}万#k  `;

    // 翻页按钮（同一水平线，空格分隔）
    if (totalPages > 1) {
        if (config.currentPage > 1) {
            content += `#L${config.prevPageMark}#【上一页】#l    `;
        }
        if (config.currentPage < totalPages) {
            content += `#L${config.nextPageMark}#【下一页】#l`;
        }
    }

    // 与物品列表隔一行行距
    content += "\r\n\r\n";

    // 拼接物品列表
    if (itemSet.length === 0) {
        content += "#r暂无可兑换物品#k";
    } else {
        for (let i = startIndex; i < endIndex; i++) {
            var itemId = itemSet[i][0];
            var price = itemSet[i][1];
            var listIndex = i - startIndex; // 本页内选项索引
            content += `#L${listIndex}# #v${itemId}# #t${itemId}# - 需金币：#r${price / 10000}万#k#l\r\n`;
        }
    }

    return content;
}

/**
 * 处理翻页操作
 */
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

    // 重置状态刷新列表
    status = 0;
    action(1, 0, 0);
    return true;
}