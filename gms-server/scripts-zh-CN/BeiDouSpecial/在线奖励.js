var status = 0;
var Eventid = "站街奖励";
var OnlineLevel = [10, 20, 30, 60, 90, 120, 180];
var textMsg = ["恭喜领取成功！", "您未达到领取条件", "您已经领取过了。"];
var giftContent = [1, 1, 1, 1, 1, 1, 1];
var index = [0x01,0x10,0x100,0x1000,0x10000,0x100000,0x1000000];

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
	cm.gainItem(2430033, gaincount);
	var newAcquireStatus = acquire | index[selection];
	cm.saveOrUpdateAccountExtendValue("每日在线奖励领取状态", String(newAcquireStatus), true);
	return textMsg[0];
}