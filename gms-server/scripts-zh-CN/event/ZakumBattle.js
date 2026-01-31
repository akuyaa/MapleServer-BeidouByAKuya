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
 * @event: Zakum Battle
 */

var isPq = true;
var minPlayers = 2, maxPlayers = 30;
var minLevel = 50, maxLevel = 200;
var entryMap = 280030000;
var exitMap = 211042400;
var recruitMap = 211042400;
var clearMap = 211042400;

var minMapId = 280030000;
var maxMapId = 280030000;

var eventTime = 120;     // 120 minutes

const maxLobbies = 1;

/**
 * 【修复】将配置读取移到init函数内部
 */
function init() {
    // 读取配置并设置参数
    try {
        const GameConfig = Java.type('org.gms.config.GameConfig');

        // 远征队人数限制
        if (GameConfig.getServerBoolean("use_enable_solo_expeditions")) {
            minPlayers = 1;
        }

        // 远征队等级限制
        if (GameConfig.getServerBoolean("use_enable_party_level_limit_lift")) {
            minLevel = 50;
            maxLevel = 200;
        }
    } catch (e) {
        log.error("读取配置失败: " + e);
    }

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
    var itemSet = [];
    eim.setExclusiveItems(itemSet);
}

function setEventRewards(eim) {
    var itemSet, itemQty, evLevel, expStages, mesoStages;

    evLevel = 1;    //Rewards at clear PQ
    itemSet = [];
    itemQty = [];
    eim.setEventRewards(evLevel, itemSet, itemQty);

    expStages = [];    //bonus exp given on CLEAR stage signal
    eim.setEventClearStageExp(expStages);

    mesoStages = [];    //bonus meso given on CLEAR stage signal
    eim.setEventClearStageMeso(mesoStages);
}

function afterSetup(eim) {
    updateGateState(1);
}

function setup(channel) {
    var eim = em.newInstance("Zakum" + channel);
    eim.setProperty("canJoin", 1);
    eim.setProperty("defeatedBoss", 0);

    var level = 1;
    var bossMap = eim.getMapInstance(280030000);
    bossMap.resetPQ(level);

    eim.startEventTimer(eventTime * 60000);
    setEventRewards(eim);
    setEventExclusives(eim);

    // 启用统计
    try {
        Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().enable();
        Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().startBroadcastTimer(bossMap);
    } catch (e) {
        log.error("启用失败: " + e);
    }

    return eim;
}

function monsterKilled(mob, eim) {
    if (isZakum(mob)) {
        eim.setIntProperty("defeatedBoss", 1);
        eim.showClearEffect(mob.getMap().getId());

        // ✅ 发放黄金枫叶奖励（15-25个随机）
        try {
            var party = eim.getPlayers();
            const ITEM_ID = 4000313; // 黄金枫叶

            for (var i = 0; i < party.size(); i++) {
                var player = party.get(i);
                // 随机15-25个 (15 + 0~10)
                var qty = 15 + Math.floor(Math.random() * 11);

                player.getClient().getAbstractPlayerInteraction().gainItem(
                    ITEM_ID,    // 物品ID
                    qty,        // 数量
                    false,      // 是否广播
                    true        // 是否显示获得提示
                );

                player.dropMessage(5, "[扎昆] 获得 " + qty + " 个黄金枫叶！");
            }
            print("已发放随机黄金枫叶奖励(15-25个)给 " + party.size() + " 名玩家");
        } catch (e) {
            print("发放奖励失败: " + e);
        }

        try {
            Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().broadcastFinalRanking(mob.getMap());
        } catch (e) {}

        eim.clearPQ();
        mob.getMap().broadcastZakumVictory();
    }
}
var disposed = false;
function dispose(eim) {
    if (disposed) return;
    disposed = true;

    try {
        Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().stop();
    } catch (e) {}

    if (!eim.isEventCleared()) {
        updateGateState(0);
    }
}

function playerEntry(eim, player) {
    eim.dropMessage(5, "[远征队] " + player.getName() + " 已进入副本地图。");
    var map = eim.getMapInstance(entryMap);
    player.changeMap(map, map.getPortal(0));
}

function scheduledTimeout(eim) {
    end(eim);
}

function changedMap(eim, player, mapid) {
    if (mapid < minMapId || mapid > maxMapId) {
        partyPlayersCheck(eim, player);
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

function playerUnregistered(eim, player) {
    if (eim.isEventCleared()) {
        em.completeQuest(player, 100200, 2030010);
    }
}

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
    updateGateState(0);
}

function isZakum(mob) {
    var mobid = mob.getId();
    return (mobid == 8800002);
}


function allMonstersDead(eim) {}

function cancelSchedule() {}

function updateGateState(newState) {
    em.getChannelServer().getMapFactory().getMap(211042300).getReactorById(2118002).forceHitReactor(newState);
}



function partyPlayersCheck(eim, player) {
    if (eim.isExpeditionTeamLackingNow(true, minPlayers, player)) {
        eim.unregisterPlayer(player);
        eim.dropMessage(5, "[远征队] 队长已退出远征或者队伍人数不足最低要求，无法继续。");
        end(eim);
        return false;
    } else {
        eim.dropMessage(5, "[远征队] " + player.getName() + " 已离开副本。");
        eim.unregisterPlayer(player);
        return true;
    }
}

/**
 * 日志记录辅助函数
 */
function log(msg) {
    var LogHelper = Java.type('org.gms.util.LogHelper');
    LogHelper.logInfo("[ZakumBattle] " + msg);
}