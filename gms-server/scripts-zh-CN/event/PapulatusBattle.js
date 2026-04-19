/*
    This file is part of the HeavenMS MapleStory Server
    Copyleft (L) 2016 - 2019 RonanLana

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation version 3 as published by
    the Free Software Foundation. You may not use, modify or distribute
    this program under any other version of the GNU Affero General Public
    License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/ >.
*/

/**
 * @author: Ronan
 * @event: Vs Papulatus
 * @modified: 改为远征队类型，每日限制1次 + 黄金枫叶奖励(2-8个)
 */

var isPq = true; // 保持true，但使用远征队逻辑
var minPlayers = 1, maxPlayers = 6;
var minLevel = 1, maxLevel = 255;
var entryMap = 220080001;
var exitMap = 220080000;
var recruitMap = 220080000;
var clearMap = 220080000;

var minMapId = 220080001;
var maxMapId = 220080001;

var eventTime = 45;     // 45 minutes

const maxLobbies = 1;
const BOSS_ID_PAPULATUS = 8500002;
const POSITIVE_CHAOS_SCROLL = 2049115;      // 正向混沌50%

// ✅ 远征队配置（参考扎昆）
const GameConfig = Java.type('org.gms.config.GameConfig');
minPlayers = GameConfig.getServerBoolean("use_enable_solo_expeditions") ? 1 : minPlayers;
if (GameConfig.getServerBoolean("use_enable_party_level_limit_lift")) {
    minLevel = 1, maxLevel = 999;
}

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
        print("[PapulatusBattle] 检查bosslog失败: " + e);
        return false;
    }
}

function setEventExclusives(eim) {
    var itemSet = [];
    eim.setExclusiveItems(itemSet);
}

function setEventRewards(eim) {
    var itemSet, itemQty, evLevel, expStages;

    evLevel = 1;
    itemSet = [];
    itemQty = [];
    eim.setEventRewards(evLevel, itemSet, itemQty);

    expStages = [];
    eim.setEventClearStageExp(expStages);
}

function getEligibleParty(party) {
    var eligible = [];
    var hasLeader = false;

    if (party.size() > 0) {
        var partyList = party.toArray();

        for (var i = 0; i < party.size(); i++) {
            var ch = partyList[i];

            if (ch.getMapId() == recruitMap && ch.getLevel() >= minLevel && ch.getLevel() <= maxLevel) {
                if (ch.isLeader()) {
                    hasLeader = true;
                }
                eligible.push(ch);
            }
        }
    }

    if (!(hasLeader && eligible.length >= minPlayers && eligible.length <= maxPlayers)) {
        eligible = [];
    }
    return Java.to(eligible, Java.type('org.gms.net.server.world.PartyCharacter[]'));
}

function setup(level, lobbyid) {
    var eim = em.newInstance("Papulatus" + lobbyid);
    eim.setProperty("level", level);
    eim.setProperty("boss", "0");

    var map = eim.getInstanceMap(220080001);
    map.resetPQ(level);

    respawnStages(eim);
    eim.startEventTimer(eventTime * 60000);
    setEventRewards(eim);
    setEventExclusives(eim);

    // ✅ 启用伤害统计
    try {
        var channel = getChannelFromEim(eim);
        var DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
        DamageStatsMgr.enable(channel, entryMap);  // 传入频道和地图ID
        DamageStatsMgr.startBroadcastTimer(map);
        print("[PapulatusBattle] 伤害统计已启用");
    } catch (e) {
        print("[PapulatusBattle] 启用失败: " + e);
    }

    return eim;
}

function afterSetup(eim) {
    updateGateState(1);
}

function respawnStages(eim) { }

function playerEntry(eim, player) {
    eim.dropMessage(5, "[远征队] " + player.getName() + " 已进入副本地图。");
    var map = eim.getMapInstance(entryMap);
    player.changeMap(map, map.getPortal(0));
}

function scheduledTimeout(eim) {
    end(eim);
}

function playerUnregistered(eim, player) {
    // ✅ 关键：每日限制1次逻辑（参考扎昆）
    if (eim.isEventCleared()) {
        em.completeQuest(player, 100201, 2041025); // Papulatus任务ID，NPCID可根据需要调整
    }
}

function playerExit(eim, player) {
    eim.unregisterPlayer(player);
    player.changeMap(exitMap, 0);
}

function playerLeft(eim, player) {
    if (!eim.isEventCleared()) {
        playerExit(eim, player);
    }
}

function changedMap(eim, player, mapid) {
    if (mapid < minMapId || mapid > maxMapId) {
        // ✅ 改为远征队检查逻辑（参考扎昆）
        partyPlayersCheck(eim, player, true); // true表示需要结束副本
    }
}

function changedLeader(eim, leader) { }

function playerDead(eim, player) { }

function playerRevive(eim, player) {
    // ✅ 改为远征队检查逻辑
    partyPlayersCheck(eim, player, true);
}

function playerDisconnected(eim, player) {
    // ✅ 改为远征队检查逻辑
    partyPlayersCheck(eim, player, true);
}

function leftParty(eim, player) { }

function disbandParty(eim) { }

function monsterValue(eim, mobId) {
    return 1;
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
    updateGateState(0);
}

function isPapulatus(mob) {
    var mobid = mob.getId();
    return mobid == BOSS_ID_PAPULATUS;
}

function monsterKilled(mob, eim) {
    if (isPapulatus(mob)) {
        // ✅ 发放黄金枫叶奖励（2-8个随机）
        try {
            var party = eim.getPlayers();
            const ITEM_ID = 4000313; // 黄金枫叶
            var rewardedCount = 0;

            for (var i = 0; i < party.size(); i++) {
                var player = party.get(i);
                if (hasDailyBossLog(player, 'PAPULATUS')) {
                    player.dropMessage(5, "[帕普拉图斯] 你今天已使用该BOSS次数，无法领取奖励。即使当前副本通关也不会额外发放奖励。");
                    continue;
                }
                var qty = 2 + Math.floor(Math.random() * 7); // 随机2-8个

                player.getClient().getAbstractPlayerInteraction().gainItem(
                    ITEM_ID, qty, false, true
                );
                rewardedCount++;
                player.dropMessage(5, "[帕普拉图斯] 获得 " + qty + " 个黄金枫叶！");
                player.getClient().getAbstractPlayerInteraction().gainItem(4002003, 1, false, true);
                player.dropMessage(5, "获得 1 个绿水灵邮票！");
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
                            var p = party.get(j);
                            if (!hasDailyBossLog(p, 'PAPULATUS')) {
                                eligiblePlayers.push(p);
                            }
                        }
                        if (eligiblePlayers.length > 0) {
                            for (var k = 0; k < eligiblePlayers.length; k++) {
                                var selectedEquip = equipList[Math.floor(Math.random() * equipList.length)];
                                print("触发稀有掉落！选中装备ID: " + selectedEquip);
                                var eligiblePlayer = eligiblePlayers[k];
                                eligiblePlayer.getClient().getAbstractPlayerInteraction().gainItem(
                                    selectedEquip, 1, false, true
                                );
                                eligiblePlayer.dropMessage(5, "恭喜！你获得了稀有装备！");
                                eligiblePlayer.dropMessage(5, "获得装备ID: " + selectedEquip);
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
            print("[PapulatusBattle] 已发放奖励给 " + rewardedCount + " 名玩家");
        } catch (e) {
            print("[PapulatusBattle] 发放奖励失败: " + e);
        }



        // ✅ 记录bosslog_daily（只有未超过每日次数的玩家会记录）
        try {
            const DatabaseConnection = Java.type('org.gms.util.DatabaseConnection');
            var con = DatabaseConnection.getConnection();
            var party = eim.getPlayers();
            var count = 0;

            for (var i = 0; i < party.size(); i++) {
                var player = party.get(i);
                if (hasDailyBossLog(player, 'PAPULATUS')) {
                    continue;
                }
                try {
                    var ps = con.prepareStatement("INSERT INTO bosslog_daily (characterid, bosstype) VALUES (?, 'PAPULATUS')");
                    ps.setInt(1, player.getId());
                    ps.executeUpdate();
                    ps.close();
                    count++;
                    print("[PapulatusBattle] 已记录通关 - 角色: " + player.getName() + " (ID:" + player.getId() + ")");
                } catch (sqlEx) {
                    print("[PapulatusBattle] 记录玩家 " + player.getName() + " 失败(可能已记录): " + sqlEx);
                }
            }
            con.close();
            print("[PapulatusBattle] 成功记录 " + count + " 名玩家到bosslog_daily");
        } catch (e) {
            print("[PapulatusBattle] ❌ 连接数据库失败: " + e);
        }

        // ✅ 广播最终伤害排名
        try {
            Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance()
                .broadcastFinalRanking(mob.getMap());
        } catch (e) { }

        eim.showClearEffect();
        eim.clearPQ();
        mob.getMap().broadcastPapulatusVictory();
    }

}



function allMonstersDead(eim) { }

function cancelSchedule() { }

function updateGateState(newState) {
    try {
        em.getChannelServer().getMapFactory().getMap(220080000).getReactorById(2208001).forceHitReactor(newState);
        em.getChannelServer().getMapFactory().getMap(220080000).getReactorById(2208002).forceHitReactor(newState);
        em.getChannelServer().getMapFactory().getMap(220080000).getReactorById(2208003).forceHitReactor(newState);
    } catch (e) {
        print("[PapulatusBattle] 更新门状态失败: " + e);
    }
}

var disposed = false;
function dispose(eim) {
    if (disposed) return;
    disposed = true;

    try {
        Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().stop(entryMap, channel);
    } catch (e) { }

    if (!eim.isEventCleared()) {
        updateGateState(0);
    }
}

// 1. 复制 getChannelFromEim 方法
function getChannelFromEim(eim) {
    try {
        var eimName = eim.getName();
        for (var i = 0; i < eimName.length; i++) {
            var char = eimName.charAt(i);
            if (char >= '0' && char <= '9') {
                var channel = parseInt(eimName.substring(i));
                if (!isNaN(channel) && channel > 0) {
                    return channel;
                }
            }
        }
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
    return 1;
}

// ✅ 新增：远征队人数检查函数（完全参考扎昆逻辑）
function partyPlayersCheck(eim, player, endOnLack) {
    if (eim.isExpeditionTeamLackingNow(true, minPlayers, player)) {
        eim.unregisterPlayer(player);
        if (endOnLack) {
            eim.dropMessage(5, "[远征队] 队长已退出远征或者队伍人数不足最低要求，无法继续。");
            end(eim);
        }
        return false;
    } else {
        eim.dropMessage(5, "[远征队] " + player.getName() + " 已离开副本。");
        eim.unregisterPlayer(player);
        return true;
    }
}