var status = 0;
var Eventid = "站街奖励";
var OnlineLevel = [10, 20, 30, 60, 90, 120, 180];
var textMsg = ["恭喜领取成功！", "您未达到领取条件", "您已经领取过了。"];
var giftContent = [1, 1, 1, 1, 1, 1, 1];
var index = [0x01,0x10,0x100,0x1000,0x10000,0x100000,0x1000000];
// 新增：一键领取的选项标识
var ONE_CLICK_SELECTION = OnlineLevel.length;

// 新增：特殊奖励道具ID
//var EXP_CARD_ITEM_ID = 2450018; // 双倍经验卡
//var EXP_CARD_COUNT = 1;

function start() 
{
	var limitDt = new Date();
	limitDt.setHours(0, 0, 5, 0);
	if (new Date() <= limitDt) {
		cm.sendOk("在线奖励正在初始化中，请稍后再试...");
		cm.dispose();
		return;
	}
	status = -1;
	action(1, 0, 0);
}

function action(mode, type, selection) 
{
	if (CheckStatus(mode))
	{
	    if (status == 0)
	    {
			var rawOnlineTime = cm.getOnlineTime();
			
			// ========== 关键修复：处理0值和负值 ==========
			if (rawOnlineTime <= 0) {
				// 首次打开可能还没计算好，提示重试
				cm.sendOk("在线时长数据正在同步中，请#e关闭对话框后再次点击#n...");
				cm.dispose();
				return;
			}
			var onlineTime = rawOnlineTime;
			// ============================================
			
			if (onlineTime < 3600) {
				var timeStr = "今日在线时间：#e#r"+ Math.floor(onlineTime / 60) +"#k#n 分钟\r\n\r\n";
			} else {
				var hour = Math.floor(onlineTime / 3600);
				var min = Math.floor((onlineTime - hour * 3600) / 60);
				var timeStr = "今日在线时间：#e#r"+ hour +"#k#n 小时 #e#r"+ min +"#k#n 分钟\r\n\r\n";
			}
			
			var getTmpStatus = cm.getAccountExtendValue("每日在线奖励领取状态", true);
			var currentStatus = (getTmpStatus == null) ? 0 : parseInt(getTmpStatus, 10);
			
			for (var i = 0; i < OnlineLevel.length; i++) {
				var isClaimed = (currentStatus & index[i]) !== 0;
				if (isClaimed) {
					timeStr += "#g[已领取] 领取【"+OnlineLevel[i]+"】分钟在线奖励#k\r\n";
				} else {
					timeStr += "#b#L"+i+"#领取【"+OnlineLevel[i]+"】分钟在线奖励#l\r\n";
				}
			}
			// 新增：添加一键领取选项
			timeStr += "#b#L"+ONE_CLICK_SELECTION+"#【一键领取】所有可领取的在线奖励#l\r\n";
			cm.sendSimple(timeStr);
	    }
		else if (status == 1 )
		{
			// stage 1 也要检测，防止过程中掉线重连
			var tmpStatus = cm.getAccountExtendValue("每日在线奖励领取状态", true);
			var getStatus = (tmpStatus == null) ? 0 : parseInt(tmpStatus, 10);
			
			var rawCurrent = cm.getOnlineTime();
			if (rawCurrent <= 0) {
				cm.sendOk("在线数据异常，请重新对话...");
				cm.dispose();
				return;
			}
			var currentOnlineTime = Math.floor(rawCurrent / 60);
			
			// 新增：处理一键领取逻辑
			if (selection === ONE_CLICK_SELECTION) {
				var resultMsg = OneClickClaimAll(getStatus, currentOnlineTime);
				cm.sendOk(resultMsg);
				cm.dispose();
				return;
			}
			
			if (selection < 0 || selection >= OnlineLevel.length) {
				cm.sendOk("系统错误：无效选择");
				cm.dispose();
				return;
			}
			
			var msg = AwardItem(selection, getStatus, currentOnlineTime, OnlineLevel[selection], giftContent[selection]);
			cm.sendOk(msg);
			cm.dispose();
		}
		else
		{
			cm.dispose();
		}
	}		
}

function CheckStatus(mode)
{
	if (mode == -1) {
		cm.dispose();
		return false;
	}
	if (mode == 1) {
		status++;
	} else {
		status--;
	}
	if (status == -1) {
		cm.dispose();
		return false;
	}	
	return true;
}

function AwardItem(selection, acquire, currentOnlineTime, scalar, gaincount) {  
    if (currentOnlineTime < scalar) {
        return textMsg[1] + "\r\n(需" + scalar + "分钟，当前" + currentOnlineTime + "分钟)";
    }
    var rewardBit = acquire & index[selection]; 
    if (rewardBit !== 0) {
        return textMsg[2];
    }
    
    // 发放常规奖励
    cm.gainItem(2430033, gaincount);
    
    
    
    var newAcquireStatus = acquire | index[selection];
    cm.saveOrUpdateAccountExtendValue("每日在线奖励领取状态", String(newAcquireStatus), true);  
    
    // 新增：根据签到次数返回特殊提示
    if (selection === 0) {
        return textMsg[0] + "\r\n\r\n#e#r[首次签到特别奖励]#k#n\r\n额外获得双倍经验卡 x" + EXP_CARD_COUNT;
    } else if (selection === 1) {
        return textMsg[0] + "\r\n\r\n#e#r[第二次签到特别奖励]#k#n\r\n额外获得双倍经验卡 x" + EXP_CARD_COUNT;
    }
    
    return textMsg[0]; 
}

// 新增：一键领取所有可领取奖励的核心函数
function OneClickClaimAll(acquireStatus, currentOnlineTime) {
    var claimResult = []; // 存储每个奖励的领取结果
    var newStatus = acquireStatus; // 新的领取状态
    var claimedFirst = false; // 是否领取了首次签到
    var claimedSecond = false; // 是否领取了第二次签到
    
    // 遍历所有奖励等级，逐个检测并领取
    for (var i = 0; i < OnlineLevel.length; i++) {
        var scalar = OnlineLevel[i];
        var gaincount = giftContent[i];
        var rewardBit = acquireStatus & index[i];
        
        // 未领取且时长达标
        if (rewardBit === 0 && currentOnlineTime >= scalar) {
            cm.gainItem(2430033, gaincount); // 发放常规奖励
            
            
            
            newStatus = newStatus | index[i]; // 更新领取状态
            claimResult.push("【"+scalar+"分钟】" + textMsg[0]);
        }
        // 未领取但时长不达标
        else if (rewardBit === 0 && currentOnlineTime < scalar) {
            claimResult.push("【"+scalar+"分钟】" + textMsg[1] + "(需" + scalar + "分钟，当前" + currentOnlineTime + "分钟)");
        }
        // 已领取
        else {
            claimResult.push("【"+scalar+"分钟】" + textMsg[2]);
        }
    }
    
    // 保存更新后的领取状态
    if (newStatus !== acquireStatus) {
        cm.saveOrUpdateAccountExtendValue("每日在线奖励领取状态", String(newStatus), true);
    }
    
    // 拼接结果消息
    var resultMsg = "一键领取结果：\r\n" + claimResult.join("\r\n");
    
    // 新增：如果领取了特殊奖励，添加提示
    if (claimedFirst || claimedSecond) {
        resultMsg += "\r\n\r\n#e#r[特别奖励]#k#n";
        if (claimedFirst) {
            resultMsg += "\r\n首次签到：双倍经验卡 x" + EXP_CARD_COUNT;
        }
        if (claimedSecond) {
            resultMsg += "\r\n第二次签到：双倍经验卡 x" + EXP_CARD_COUNT;
        }
    }
    
    return resultMsg;
}