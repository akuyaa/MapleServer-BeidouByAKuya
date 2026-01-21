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
 * @event: Horntail Battle
 * @modified: GraalJS终极兼容版
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
var eventTime = 120;  // 120分钟
var maxLobbies = 1;
var GameConfig = null;
var DamageStatsMgr = null;
var LifeFactory = null;
var Point = null;

// ✅ 极简init，不使用任何Java对象
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
    eim.setEventRewards(1, [], []);
    eim.setEventClearStageExp([]);
    eim.setEventClearStageMeso([]);
}

function afterSetup(eim) {}

// ✅ setup函数必须放在所有函数之后
function setup(channel) {
    var eim = em.newInstance("Horntail" + channel);
    eim.setProperty("canJoin", "1");
    eim.setProperty("defeatedHead", "0");
    eim.setProperty("defeatedBoss", "0");
    eim.setProperty("damageStatsBound", "false");

    var level = 1;
    eim.getInstanceMap(240060000).resetPQ(level);
    eim.getInstanceMap(240060100).resetPQ(level);
    eim.getInstanceMap(240060200).resetPQ(level);

    try {
        LifeFactory = Java.type('org.gms.server.life.LifeFactory');
        Point = Java.type('java.awt.Point');

        var map1 = eim.getInstanceMap(240060000);
        var head1 = LifeFactory.getMonster(8810000);
        map1.spawnMonsterOnGroundBelow(head1, new Point(960, 120));
        print("[HorntailBattle] ✅ 龙头1召唤成功");

        var map2 = eim.getInstanceMap(240060100);
        var head2 = LifeFactory.getMonster(8810001);
        map2.spawnMonsterOnGroundBelow(head2, new Point(-420, 120));
        print("[HorntailBattle] ✅ 龙头2召唤成功");
    } catch (e) {
        print("[HorntailBattle] ❌ 召唤龙头失败: " + e);
    }

    eim.startEventTimer(eventTime * 60000);
    setEventRewards(eim);
    setEventExclusives(eim);

    try {
        DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
        DamageStatsMgr.enable();
        print("[HorntailBattle] ✅ 伤害统计启用");
    } catch (e) {
        print("[HorntailBattle] ❌ 启用伤害统计失败: " + e);
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

function isHorntailHead(mob) {
    var mobid = mob.getId();
    return mobid == 8810000 || mobid == 8810001;
}

function isHorntail(mob) {
    var mobid = mob.getId();
    return mobid == 8810018;
}

function monsterKilled(mob, eim) {
    var mobId = mob.getId();
    var mapId = mob.getMap().getId();

    if (isHorntail(mob)) {
        eim.setProperty("defeatedBoss", "1");
        print("[HorntailBattle] 黑龙本体被击杀");

        try {
            if (DamageStatsMgr == null) {
                DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
            }
            DamageStatsMgr.broadcastFinalRanking(mob.getMap());
            print("[HorntailBattle] ✅ 最终排名已广播");
        } catch (e) {
            print("[HorntailBattle] ❌ 广播失败: " + e);
        }

        eim.showClearEffect(mapId);
        eim.clearPQ();
        mob.getMap().broadcastHorntailVictory();
    } else if (isHorntailHead(mob)) {
        var killed = parseInt(eim.getProperty("defeatedHead")) + 1;
        eim.setProperty("defeatedHead", String(killed));
        print("[HorntailBattle] 龙头被击杀，计数: " + killed);

        eim.showClearEffect(mapId);

        if (killed >= 2 && eim.getProperty("damageStatsBound") == "false") {
            try {
                if (LifeFactory == null) {
                    LifeFactory = Java.type('org.gms.server.life.LifeFactory');
                    Point = Java.type('java.awt.Point');
                }

                var finalMap = eim.getMapInstance(240060200);
                if (finalMap == null) {
                    print("[HorntailBattle] ❌ 地图不存在");
                    return;
                }

                if (finalMap.getMonsterById(8810018) != null) {
                    print("[HorntailBattle] ⚠️ 黑龙已存在");
                    return;
                }

                var boss = LifeFactory.getMonster(8810018);
                finalMap.spawnMonsterOnGroundBelow(boss, new Point(0, 120));
                print("[HorntailBattle] ✅ 黑龙本体已召唤");

                if (DamageStatsMgr == null) {
                    DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
                }
                DamageStatsMgr.startBroadcastTimer(finalMap);
                eim.setProperty("damageStatsBound", "true");
                print("[HorntailBattle] ✅ 统计已绑定");
            } catch (e) {
                print("[HorntailBattle] ❌ 召唤/绑定失败: " + e);
            }
        }
    }
}

function allMonstersDead(eim) {}

function cancelSchedule() {}

function dispose(eim) {
    try {
        if (DamageStatsMgr == null) {
            DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
        }
        DamageStatsMgr.stop();
        print("[HorntailBattle] ✅ 统计已停止");
    } catch (e) {
        print("[HorntailBattle] ❌ 停止失败: " + e);
    }
}

function partyPlayersCheck(eim, player) {
    if (eim.isExpeditionTeamLackingNow(true, minPlayers, player)) {
        eim.unregisterPlayer(player);
        eim.dropMessage(5, "[远征队] 队长已退出或人数不足。");
        end(eim);
        return false;
    } else {
        eim.dropMessage(5, "[远征队] " + player.getName() + " 已离开副本。");
        eim.unregisterPlayer(player);
        return true;
    }
}