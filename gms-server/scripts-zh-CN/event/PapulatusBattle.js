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
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * @author: Ronan
 * @event: Vs Papulatus
 * @modified: 添加伤害统计系统（扎昆逻辑版）
 */

var isPq = true;
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

const GameConfig = Java.type('org.gms.config.GameConfig');
minPlayers = GameConfig.getServerBoolean("use_enable_solo_expeditions") ? 1 : minPlayers;
if(GameConfig.getServerBoolean("use_enable_party_level_limit_lift")) {
    minLevel = 1 , maxLevel = 999;
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

    // ✅ 启用伤害统计（扎昆逻辑：setup中直接初始化）
    try {
        Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().enable();
        Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().startBroadcastTimer(map);
    } catch (e) {
        log("启用伤害统计失败: " + e);
    }

    return eim;
}

function afterSetup(eim) {
    updateGateState(1);
}

function respawnStages(eim) {}

function playerEntry(eim, player) {
    var map = eim.getMapInstance(entryMap);
    player.changeMap(map, map.getPortal(0));
}

function scheduledTimeout(eim) {
    end(eim);
}

function playerUnregistered(eim, player) {}

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
        if (eim.isExpeditionTeamLackingNow(true, minPlayers, player)) {
            eim.unregisterPlayer(player);
            end(eim);
        } else {
            eim.unregisterPlayer(player);
        }
    }
}

function changedLeader(eim, leader) {}

function playerDead(eim, player) {}

function playerRevive(eim, player) {
    if (eim.isExpeditionTeamLackingNow(true, minPlayers, player)) {
        eim.unregisterPlayer(player);
        end(eim);
    } else {
        eim.unregisterPlayer(player);
    }
}

function playerDisconnected(eim, player) {
    if (eim.isExpeditionTeamLackingNow(true, minPlayers, player)) {
        eim.unregisterPlayer(player);
        end(eim);
    } else {
        eim.unregisterPlayer(player);
    }
}

function leftParty(eim, player) {}

function disbandParty(eim) {}

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
        // ✅ 广播最终伤害排名
        try {
            Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance()
                .broadcastFinalRanking(mob.getMap());
        } catch (e) {
            log("广播伤害排名失败: " + e);
        }

        eim.showClearEffect();
        eim.clearPQ();
    }
}

function allMonstersDead(eim) {}

function cancelSchedule() {}

function updateGateState(newState) {
    em.getChannelServer().getMapFactory().getMap(220080000).getReactorById(2208001).forceHitReactor(newState);
    em.getChannelServer().getMapFactory().getMap(220080000).getReactorById(2208002).forceHitReactor(newState);
    em.getChannelServer().getMapFactory().getMap(220080000).getReactorById(2208003).forceHitReactor(newState);
}

var disposed = false;
function dispose(eim) {
    if (disposed) return;
    disposed = true;

    // ✅ 停止伤害统计（扎昆逻辑：简单try-catch）
    try {
        Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().stop();
    } catch (e) {
        log("停止伤害统计失败: " + e);
    }

    if (!eim.isEventCleared()) {
        updateGateState(0);
    }
}

/**
 * 日志记录辅助函数
 */
function log(msg) {
    var LogHelper = Java.type('org.gms.util.LogHelper');
    LogHelper.logInfo("[PapulatusBattle] " + msg);
}