/*
    This file is part of the HeavenMS MapleStory Server
    Copyleft (L) 2016 - 2019 RonanLana
*/

/**
 * @author: Ronan
 * @event: Horntail Battle
 * @modified: 三地图实时伤害统计版
 */

var isPq = true;
var minPlayers = 3;
var maxPlayers = 30;
var minLevel = 120;
var maxLevel = 200;
var entryMap = 240060000;
var exitMap = 240050600;
var recruitMap = 240050400;
var clearMap = 240050600;
var minMapId = 240060000;
var maxMapId = 240060200;
var eventTime = 120;
var maxLobbies = 1;
const POSITIVE_CHAOS_SCROLL = 2049115;      // 正向混沌50%

// ✅ 黑龙三地图ID数组（用于伤害统计）
var HORNTAIL_MAPS = [240060000, 240060100, 240060200];

function init() {
    setEventRequirements();
}

function getMaxLobbies() {
    return maxLobbies;
}

function setEventRequirements() {
    var reqStr = "";
    reqStr += "\r\n   组队人数: ";
    if (maxPlayers - minPlayers >= 1) {
        reqStr += minPlayers + " ~ " + maxPlayers;
    } else {
        reqStr += minPlayers;
    }
    reqStr += "\r\n   等级要求: ";
    if (maxLevel - minLevel >= 1) {
        reqStr += minLevel + " ~ " + maxLevel;
    } else {
        reqStr += minLevel;
    }
    reqStr += "\r\n   时间限制: ";
    reqStr += eventTime + " 分钟";
    em.setProperty("party", reqStr);
}

function setEventExclusives(eim) {
    eim.setExclusiveItems([]);
}

function setEventRewards(eim) {
    // ✅ 黑龙掉落物设置
    var itemSet = [4005000, 4005001, 4005002, 4005003, 4005004];
    var itemQty = [5, 5, 5, 5, 5];
    eim.setEventRewards(1, itemSet, itemQty);
    eim.setEventClearStageExp([]);
    eim.setEventClearStageMeso([]);
}

function hasDailyBossLog(player, bossType) {
    try {
        const DatabaseConnection = Java.type('org.gms.util.DatabaseConnection');
        var con = DatabaseConnection.getConnection();
        var ps = con.prepareStatement(
            "SELECT COUNT(*) AS count FROM bosslog_daily WHERE characterid = ? AND bosstype = ? AND DATE(attempttime) = CURDATE()"
        );
        ps.setInt(1, player.getId());
        ps.setString(2, bossType);
        var rs = ps.executeQuery();
        var exists = false;
        if (rs.next()) {
            exists = rs.getInt("count") > 0;
        }
        rs.close();
        ps.close();
        con.close();
        return exists;
    } catch (e) {
        print("[HorntailBattle] 检查bosslog失败: " + e);
        return false;
    }
}

function afterSetup(eim) { }

function setup(channel) {
    var eim = em.newInstance("Horntail" + channel);
    eim.setProperty("canJoin", "1");
    eim.setProperty("defeatedHead", "0");
    eim.setProperty("defeatedBoss", "0");

    var level = 1;
    eim.getInstanceMap(240060000).resetPQ(level);
    eim.getInstanceMap(240060100).resetPQ(level);
    eim.getInstanceMap(240060200).resetPQ(level);

    // ✅ 只召唤龙头
    var LifeFactory = Java.type('org.gms.server.life.LifeFactory');
    var Point = Java.type('java.awt.Point');

    var map1 = eim.getInstanceMap(240060000);
    var head1 = LifeFactory.getMonster(8810000);
    map1.spawnMonsterOnGroundBelow(head1, new Point(960, 120));

    var map2 = eim.getInstanceMap(240060100);
    var head2 = LifeFactory.getMonster(8810001);
    map2.spawnMonsterOnGroundBelow(head2, new Point(-420, 120));

    eim.startEventTimer(eventTime * 60000);
    setEventRewards(eim);
    setEventExclusives(eim);

    // ✅ 启用黑龙三地图伤害统计（传入任意一个地图ID即可，内部共享）
    try {
        var DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
        DamageStatsMgr.enable(channel, 240060000);  // 启用黑龙组（240060000作为组标识）
        print("[HorntailBattle] 黑龙三地图伤害统计已启用 (240060000-240060200)");
    } catch (e) {
        print("[HorntailBattle] 启用统计失败: " + e);
    }

    return eim;
}

function playerEntry(eim, player) {
    eim.dropMessage(5, "[远征队] " + player.getName() + " 已进入地图。");
    var map = eim.getMapInstance(entryMap);
    player.changeMap(map, map.getPortal(0));
}

function scheduledTimeout(eim) {
    end(eim);
}

function changedMap(eim, player, mapid) {
    if (mapid < minMapId || mapid > maxMapId) {
        partyPlayersCheck(eim, player);
    } else if (isHorntailMap(mapid)) {
        // ✅ 关键：三个地图进入时都绑定伤害统计广播（内部只创建一次定时器）
        try {
            var currentMap = eim.getMapInstance(mapid);
            var DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
            DamageStatsMgr.startBroadcastTimer(currentMap);
            print("[HorntailBattle] 伤害统计广播已绑定到地图 " + mapid);
        } catch (e) {
            print("[HorntailBattle] 绑定广播失败: " + e);
        }
    }
}

// ✅ 辅助函数：判断是否为黑龙副本地图
function isHorntailMap(mapid) {
    for (var i = 0; i < HORNTAIL_MAPS.length; i++) {
        if (HORNTAIL_MAPS[i] == mapid) return true;
    }
    return false;
}

function changedLeader(eim, leader) { }

function playerDead(eim, player) { }

function playerRevive(eim, player) {
    partyPlayersCheck(eim, player);
}

function playerDisconnected(eim, player) {
    partyPlayersCheck(eim, player);
}

function leftParty(eim, player) { }

function disbandParty(eim) { }

function monsterValue(eim, mobId) {
    return 1;
}

function playerUnregistered(eim, player) { }

function playerExit(eim, player) {
    eim.unregisterPlayer(player);
    player.changeMap(exitMap, 0);
}

function end(eim) {
    var party = eim.getPlayers();
    for (var i = 0; i < party.size(); i++) {
        playerExit(eim, party.get(i));
    }
    eim.dispose();
}

function giveRandomEventReward(eim, player) {
    eim.giveEventReward(player);
}

function clearPQ(eim) {
    eim.stopEventTimer();
    eim.setEventCleared();
}

function isHorntailHead(mob) {
    var mobid = mob.getId();
    return mobid == 8810000 || mobid == 8810001;
}

function isHorntail(mob) {
    var mobid = mob.getId();
    return mobid == 8810018;
}

function monsterKilled(mob, eim) {
    if (isHorntail(mob)) {
        eim.setProperty("defeatedBoss", "1");

        // ✅ 发放黄金枫叶奖励（30-50个随机）
        try {
            var party = eim.getPlayers();
            const ITEM_ID = 4000313; // 黄金枫叶

            for (var i = 0; i < party.size(); i++) {
                var player = party.get(i);
                //每人一张正向混沌卷轴50%
                player.getClient().getAbstractPlayerInteraction().gainItem(
                    POSITIVE_CHAOS_SCROLL,
                    1,
                    false,
                    true
                );
                // 随机30-50个 (30 + 0~20)
                var qty = 30 + Math.floor(Math.random() * 21);

                player.getClient().getAbstractPlayerInteraction().gainItem(
                    ITEM_ID,    // 物品ID
                    qty,        // 数量
                    false,      // 是否广播
                    true        // 是否显示获得提示
                );

                player.dropMessage(5, "[暗黑龙王] 获得 " + qty + " 个黄金枫叶！");
                player.getClient().getAbstractPlayerInteraction().gainItem(4002003, 4, false, true);
                player.dropMessage(5, "获得 4 个绿水灵邮票！");
                // ✅ 6%概率抽取稀有装备（新增代码）
                var randomNum = 1 + Math.floor(Math.random() * 100);
                print("[roll点拿装备] " + player.getName() + "本次随机数: " + randomNum);
                player.dropMessage("[roll点拿装备] 本次随机数: " + randomNum);
                if (randomNum <= 6) {
                    player.dropMessage("恭喜你为全队roll出了幸运数字" + randomNum + " ,每人分配一件随机装备")
                    // 装备ID列表（只取每个数组的第一个元素）
                    var equipList = [
                        1042254, 1042255, 1042256, 1042257, 1042258,
                        1062165, 1062166, 1062167, 1062168, 1062169,
                        1132246, 1113075, 1022226, 1132246,
                        1113075, 1022226, 1102481, 1102482,
                        1102483, 1102484, 1102485, 1072743, 1072744,
                        1072745, 1072746, 1072747,                         //暴君 系列
                        1302275, 1312153, 1322203, 1332225, 1372177, 1382208,
                        1402196, 1412135, 1422140, 1432167, 1442223, 1452205,
                        1462193, 1472214, 1482168, 1492179                     //FFN 武器
                    ];
                    try {
                        var party = eim.getPlayers();
                        var eligiblePlayers = [];
                        for (var j = 0; j < party.size(); j++) {
                            eligiblePlayers.push(party.get(j));
                        }
                        if (eligiblePlayers.length > 0) {
                            for (var j = 0; j < eligiblePlayers.length; j++) {
                                var selectedEquip = equipList[Math.floor(Math.random() * equipList.length)];
                                print("触发稀有掉落！选中装备ID: " + selectedEquip);
                                var p = eligiblePlayers[j];
                                p.getClient().getAbstractPlayerInteraction().gainItem(
                                    selectedEquip, 1, false, true
                                );
                                p.dropMessage(5, "恭喜！你获得了稀有装备！");
                                p.dropMessage(5, "获得装备ID: " + selectedEquip);
                            }
                            print("已将稀有装备 " + selectedEquip + " 发放给 " + eligiblePlayers.length + " 名玩家");
                        } else {
                            print("稀有装备未发放：当前没有可领取奖励的玩家。");
                        }
                    } catch (e) {
                        print("发放稀有装备失败: " + e);
                    }
                }
            }
            print("[HorntailBattle] 已发放随机黄金枫叶奖励(30-50个)给 " + party.size() + " 名玩家");
        } catch (e) {
            print("[HorntailBattle] ❌ 发放奖励失败: " + e);
        }


        // ✅ 广播最终伤害排名（向黑龙组所有地图广播）
        try {
            var DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
            // 传入任意黑龙地图ID，内部会向240060000、240060100、240060200都广播
            DamageStatsMgr.broadcastFinalRanking(mob.getMap());
            print("[HorntailBattle] 最终伤害排名已向黑龙三地图广播");
        } catch (e) {
            print("[HorntailBattle] 广播排名失败: " + e);
        }

        eim.showClearEffect(mob.getMap().getId());
        eim.clearPQ(); // 触发掉落
        mob.getMap().broadcastHorntailVictory();

    } else if (isHorntailHead(mob)) {
        var killed = parseInt(eim.getProperty("defeatedHead")) + 1;
        eim.setProperty("defeatedHead", String(killed));
        eim.showClearEffect(mob.getMap().getId());
    }
}

function allMonstersDead(eim) { }

function cancelSchedule() { }

// function dispose(eim) {
//     // ✅ 停止黑龙组伤害统计（传入任意一个地图ID即可）
//     try {
//         var DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
//         DamageStatsMgr.stop(240060000);  // 停止整个黑龙组
//         print("[HorntailBattle] 黑龙组伤害统计已停止");
//     } catch (e) {
//         print("[HorntailBattle] 停止统计失败: " + e);
//     }
// }

function dispose(eim) {
    // ✅ 停止黑龙组伤害统计（传入频道和地图ID）
    try {
        var DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
        var channel = getChannelFromEim(eim);
        DamageStatsMgr.stop(entryMap, channel);  // 停止该频道的黑龙组
        print("[HorntailBattle] 黑龙组伤害统计已停止（频道: " + channel + "）");
    } catch (e) {
        print("[HorntailBattle] 停止统计失败: " + e);
    }

    if (!eim.isEventCleared()) updateGateState(0);
}
function updateGateState(newState) { }
// ✅ 通用方法：从EIM获取频道ID（可复制到其他BOSS脚本）
function getChannelFromEim(eim) {
    try {
        var eimName = eim.getName();
        // 尝试从名称解析：BossName + channel 格式，如 "Horntail1", "TianHuang2"
        for (var i = 0; i < eimName.length; i++) {
            var char = eimName.charAt(i);
            if (char >= '0' && char <= '9') {
                var channel = parseInt(eimName.substring(i));
                if (!isNaN(channel) && channel > 0) {
                    return channel;
                }
            }
        }
        // 如果名称解析失败，尝试从eim获取channel属性
        var channelProp = eim.getProperty("channel");
        if (channelProp != null) {
            var channel = parseInt(channelProp);
            if (!isNaN(channel) && channel > 0) {
                return channel;
            }
        }
    } catch (e) {
        print("[getChannelFromEim] 解析频道失败: " + e);
    }
    // 默认返回1
    return 1;
}

function partyPlayersCheck(eim, player) {
    if (eim.isExpeditionTeamLackingNow(true, minPlayers, player)) {
        eim.unregisterPlayer(player);
        eim.dropMessage(5, "[远征队] 队长已退出或人数不足，无法继续。");
        end(eim);
        return false;
    } else {
        eim.dropMessage(5, "[远征队] " + player.getName() + " 已离开副本。");
        eim.unregisterPlayer(player);
        return true;
    }
}