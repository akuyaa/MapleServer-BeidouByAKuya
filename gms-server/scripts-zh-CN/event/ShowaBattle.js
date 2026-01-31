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
 * @event: Showa Boss Battle
 * @modified: 添加伤害统计系统
 */

var isPq = true;
var minPlayers = 2, maxPlayers = 30;
var minLevel = 100, maxLevel = 200;
var entryMap = 801040100;
var exitMap = 801040004;
var recruitMap = 801040004;
var clearMap = 801040101;

var minMapId = 801040100;
var maxMapId = 801040101;

var eventTime = 60;     // 60 minutes for boss stg

const maxLobbies = 1;
const BOSS_ID = 9400300; // 大头头Boss ID

const GameConfig = Java.type('org.gms.config.GameConfig');
minPlayers = GameConfig.getServerBoolean("use_enable_solo_expeditions") ? 1 : minPlayers;
if(GameConfig.getServerBoolean("use_enable_party_level_limit_lift")) {
    minLevel = 1 , maxLevel = 999;
}

function init() {
    print("[ShowaBattle] init() called");
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
    print("[ShowaBattle] Requirements set: " + reqStr);
}

function setEventExclusives(eim) {
    var itemSet = [];
    eim.setExclusiveItems(itemSet);
}

function setEventRewards(eim) {
    var itemSet, itemQty, evLevel, expStages, mesoStages;

    evLevel = 1;
    itemSet = [1102145, 1102084, 1102085, 1102086, 1102087, 1052165, 1052166, 1052167, 1402013, 1332030, 1032030, 1032070, 4003000, 4000030, 4006000, 4006001, 4005000, 4005001, 4005002, 4005003, 4005004, 2022016, 2022263, 2022264, 2022015, 2022306, 2022307, 2022306, 2022113];
    itemQty = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 40, 40, 100, 100, 2, 2, 2, 2, 1, 100, 100, 100, 40, 40, 40, 40, 40];
    eim.setEventRewards(evLevel, itemSet, itemQty);

    expStages = [];
    eim.setEventClearStageExp(expStages);

    mesoStages = [];
    eim.setEventClearStageMeso(mesoStages);
}

function afterSetup(eim) {
    print("[ShowaBattle] afterSetup finished");
}

function setup(channel) {
    print("[ShowaBattle] === setup called on channel " + channel);

    var eim = em.newInstance("Showa" + channel);
    eim.setProperty("canJoin", 1);
    eim.setProperty("playerDied", 0);

    var level = 1;
    var bossMap = eim.getInstanceMap(801040100);
    bossMap.resetPQ(level);

    respawnStages(eim);
    eim.startEventTimer(eventTime * 60000);
    setEventRewards(eim);
    setEventExclusives(eim);

    // ✅ 启用伤害统计（绑定主战斗地图）
    try {
        const DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
        DamageStatsMgr.enable();
        DamageStatsMgr.startBroadcastTimer(bossMap);
        print("[ShowaBattle] ✅ 伤害统计已启用");
    } catch (e) {
        print("[ShowaBattle] ❌ 启用伤害统计失败: " + e);
    }

    return eim;
}

function respawnStages(eim) {
    eim.getInstanceMap(801040100).instanceMapRespawn();
    eim.schedule("respawnStages", 15 * 1000);
}

function playerEntry(eim, player) {
    eim.dropMessage(5, "[远征队] " + player.getName() + " 已进入地图。");
    var map = eim.getMapInstance(entryMap);
    player.changeMap(map, map.getPortal(0));
}

function scheduledTimeout(eim) {
    print("[ShowaBattle] 副本超时结束");
    end(eim);
}

function changedMap(eim, player, mapid) {
    if (mapid < minMapId || mapid > maxMapId) {
        partyPlayersCheck(eim, player);
    }
}

function changedLeader(eim, leader) {}

function playerDead(eim, player) {
    eim.setIntProperty("playerDied", 1);
}

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

// function clearPQ(eim) {
//     eim.getInstanceMap(801040100).killAllMonsters();
//     eim.stopEventTimer();
//     eim.setEventCleared();

//     if (eim.getIntProperty("playerDied") == 0) {
//         var mob = eim.getMonster(9400114);
//         eim.getMapInstance(801040101).spawnMonsterOnGroundBelow(mob, new java.awt.Point(500, -50));
//         eim.dropMessage(5, "康培：Boss已被击败且无人员伤亡，干得漂亮！我们在里面发现了一台可疑的机器，正在将它移出。");
//     }
// }

function monsterKilled(mob, eim) {
    if (isTheBoss(mob)) {
        eim.showClearEffect();

        // ✅ 给所有队员发放30-50个随机数量黄金枫叶
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

                player.dropMessage(5, "[Showa Boss] 获得 " + qty + " 个黄金枫叶！");
            }
            print("[ShowaBattle] 已发放随机黄金枫叶奖励(30-50个)给 " + party.size() + " 名玩家");
        } catch (e) {
            print("[ShowaBattle] ❌ 发放奖励失败: " + e);

            // 备用方案：地图掉落
            try {
                var map = eim.getMapInstance(801040101);
                const Item = Java.type('org.gms.client.inventory.Item');

                var qty = 30 + Math.floor(Math.random() * 21);
                var item = new Item(4000313, 0, qty);

                map.spawnItemDrop(
                    mob,
                    null,
                    item,
                    new java.awt.Point(500, -50),
                    true,
                    true
                );

                eim.dropMessage(6, "[Showa Boss] 击败奖励(" + qty + "个黄金枫叶)已掉落在地图中央！");
                print("[ShowaBattle] 已使用备用方案地图掉落 " + qty + " 个奖励");
            } catch (e2) {
                print("[ShowaBattle] 备用方案也失败: " + e2);
            }
        }

        // ✅ 广播最终伤害排名
        try {
            Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance()
                .broadcastFinalRanking(mob.getMap());
            print("[ShowaBattle] ✅ 最终伤害排名已广播");
        } catch (e) {
            print("[ShowaBattle] ❌ 广播伤害排名失败: " + e);
        }

        eim.clearPQ();
    }
}

function clearPQ(eim) {
    eim.getInstanceMap(801040100).killAllMonsters();
    eim.stopEventTimer();
    eim.setEventCleared();

    if (eim.getIntProperty("playerDied") == 0) {
        var mob = eim.getMonster(9400114);
        eim.getMapInstance(801040101).spawnMonsterOnGroundBelow(mob, new java.awt.Point(500, -50));
        eim.dropMessage(5, "康培：Boss已被击败且无人员伤亡，干得漂亮！我们在里面发现了一台可疑的机器，正在将它移出。");
    }
}

function isTheBoss(mob) {
    return mob.getId() == BOSS_ID;
}

// function monsterKilled(mob, eim) {
//     if (isTheBoss(mob)) {
//         eim.showClearEffect();

//         // ✅ 广播最终伤害排名（Boss死亡时）
//         try {
//             Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance()
//                 .broadcastFinalRanking(mob.getMap());
//             print("[ShowaBattle] ✅ 最终伤害排名已广播");
//         } catch (e) {
//             print("[ShowaBattle] ❌ 广播伤害排名失败: " + e);
//         }

//         eim.clearPQ();
//     }
// }

function allMonstersDead(eim) {}

function cancelSchedule() {}

function dispose(eim) {
    // ✅ 停止伤害统计
    try {
        Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().stop();
        print("[ShowaBattle] ✅ 伤害统计已停止");
    } catch (e) {
        print("[ShowaBattle] ❌ 停止伤害统计失败: " + e);
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