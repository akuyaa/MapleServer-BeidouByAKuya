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
 * @event: Scarga Battle
 * @modified: 添加伤害统计系统 + 黄金枫叶奖励
 */

var isPq = true;
var minPlayers = 1, maxPlayers = 30;
var minLevel = 90, maxLevel = 200;
var entryMap = 551030200;
var exitMap = 551030100;
var recruitMap = 551030100;
var clearMap = 551030100;

var minMapId = 551030200;
var maxMapId = 551030200;

var eventTime = 60;     // 60 minutes for boss stg

const maxLobbies = 1;

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
    var itemSet, itemQty, evLevel, expStages, mesoStages;

    evLevel = 1;
    itemSet = [1102145, 1102084, 1102085, 1102086, 1102087, 1052165, 1052166, 1052167, 1402013, 1332030, 1032030, 1032070, 4003000, 4000030, 4006000, 4006001, 4005000, 4005001, 4005002, 4005003, 4005004, 2022016, 2022263, 2022264, 2022015, 2022306, 2022307, 2022306, 2022113];
    itemQty = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 50, 50, 120, 120, 4, 4, 4, 4, 2, 125, 125, 125, 30, 30, 30, 30, 30];
    eim.setEventRewards(evLevel, itemSet, itemQty);

    expStages = [];
    eim.setEventClearStageExp(expStages);

    mesoStages = [];
    eim.setEventClearStageMeso(mesoStages);
}

function afterSetup(eim) {}

function setup(channel) {
    var eim = em.newInstance("Scarga" + channel);
    eim.setProperty("canJoin", 1);
    eim.setProperty("defeatedBoss", 0);

    var level = 1;
    eim.getInstanceMap(551030200).resetPQ(level);

    eim.startEventTimer(eventTime * 60000);
    setEventRewards(eim);
    setEventExclusives(eim);

    // ✅ 启用伤害统计
    try {
        const DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
        DamageStatsMgr.enable();
        var bossMap = eim.getInstanceMap(entryMap);
        DamageStatsMgr.startBroadcastTimer(bossMap);
        print("[ScargaBattle] ✅ 伤害统计已启用");
    } catch (e) {
        print("[ScargaBattle] ❌ 启用伤害统计失败: " + e);
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

function isScarga(mob) {
    var mobid = mob.getId();
    return (mobid == 9420544) || (mobid == 9420549);
}

function monsterKilled(mob, eim) {
    if (isScarga(mob)) {
        var killed = eim.getIntProperty("defeatedBoss");

        // 第二形态死亡时发放奖励并广播最终排名
        if (killed == 1) {
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

                    player.dropMessage(5, "[Scarga Boss] 获得 " + qty + " 个黄金枫叶！");
                }
                print("[ScargaBattle] 已发放黄金枫叶奖励给 " + party.size() + " 名玩家");
            } catch (e) {
                print("[ScargaBattle] ❌ 发放奖励失败: " + e);
            }

            // ✅ 广播最终伤害排名
            try {
                Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance()
                    .broadcastFinalRanking(mob.getMap());
                print("[ScargaBattle] ✅ 最终伤害排名已广播");
            } catch (e) {
                print("[ScargaBattle] ❌ 广播伤害排名失败: " + e);
            }

            eim.showClearEffect();
            eim.clearPQ();
        }

        eim.setIntProperty("defeatedBoss", killed + 1);
    }
}

function allMonstersDead(eim) {}

function cancelSchedule() {}

function dispose(eim) {
    // ✅ 停止伤害统计
    try {
        Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().stop();
        print("[ScargaBattle] ✅ 伤害统计已停止");
    } catch (e) {
        print("[ScargaBattle] ❌ 停止伤害统计失败: " + e);
    }
}

/**
 * 检测队伍人数是否满足最低人数要求
 */
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