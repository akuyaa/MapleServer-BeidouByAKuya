/*
    This file is part of the HeavenMS MapleStory Server
    Copyleft (L) 2016 - 2019 RonanLana
*/

/**
 * @author: Ronan
 * @event: Horntail Battle
 * @modified: 第三张图伤害统计版
 */

var isPq = true;
var minPlayers = 3;
var maxPlayers = 30;
var minLevel = 100;
var maxLevel = 200;
var entryMap = 240060000;
var exitMap = 240050600;
var recruitMap = 240050400;
var clearMap = 240050600;
var minMapId = 240060000;
var maxMapId = 240060200;
var eventTime = 120;
var maxLobbies = 1;

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

function afterSetup(eim) {}

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

    // ✅ 全局启用伤害统计（开始记录数据）
    try {
        var DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
        DamageStatsMgr.enable();
        print("[HorntailBattle] 伤害统计已全局启用");
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
    } else if (mapid == 240060200) {
        // ✅ 关键：只在进入第三张图时绑定伤害统计广播
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

function changedLeader(eim, leader) {}

function playerDead(eim, player) {}

function playerRevive(eim, player) {
    partyPlayersCheck(eim, player);
}

function playerDisconnected(eim, player) {
    partyPlayersCheck(eim, player);
}

function leftParty(eim, player) {}

function disbandParty(eim) {}

function monsterValue(eim, mobId) {
    return 1;
}

function playerUnregistered(eim, player) {}

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
                // 随机30-50个 (30 + 0~20)
                var qty = 30 + Math.floor(Math.random() * 21);

                player.getClient().getAbstractPlayerInteraction().gainItem(
                    ITEM_ID,    // 物品ID
                    qty,        // 数量
                    false,      // 是否广播
                    true        // 是否显示获得提示
                );

                player.dropMessage(5, "[暗黑龙王] 获得 " + qty + " 个黄金枫叶！");
            }
            print("[HorntailBattle] 已发放随机黄金枫叶奖励(30-50个)给 " + party.size() + " 名玩家");
        } catch (e) {
            print("[HorntailBattle] ❌ 发放奖励失败: " + e);
        }

        // ✅ 广播最终伤害排名（黑龙死亡时）
        try {
            var DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
            DamageStatsMgr.broadcastFinalRanking(mob.getMap());
            print("[HorntailBattle] 最终伤害排名已广播");
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

function allMonstersDead(eim) {}

function cancelSchedule() {}

function dispose(eim) {
    try {
        var DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
        DamageStatsMgr.stop();
        print("[HorntailBattle] 伤害统计已停止");
    } catch (e) {
        print("[HorntailBattle] 停止统计失败: " + e);
    }
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