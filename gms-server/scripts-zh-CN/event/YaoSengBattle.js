/*
 *  YaoSengBattle - 武林妖僧远征副本
 *  基于 Zakum 事件模板复用，参数区可自行调整
 */

/* ========== 参数区（按需修改） ========== */
var isPq        = true;
var minPlayers  = 1;        // 开发阶段可先设 1
var maxPlayers  = 6;
var minLevel    = 120;
var maxLevel    = 200;
var entryMap    = 702060000;   // 副本地图ID
var exitMap     = 702070400;   // 退出地图ID
var recruitMap  = 702070400;
var clearMap    = 702070400;
var minMapId    = 702060000;
var maxMapId    = 702060000;
var eventTime   = 15;          // 分钟
const maxLobbies = 1;
const BOSS_ID   = 9600025;     // 你的妖僧BOSS ID


/* ========== 以下逻辑勿动，已加日志 ========== */
function init() {
    print("[YaoSengBattle] init() called");
    setEventRequirements();
}

function getMaxLobbies() {
    return maxLobbies;
}

function setEventRequirements() {
    var req = "\r\n人数：" + minPlayers + "~" + maxPlayers +
        "\r\n等级：" + minLevel + "~" + maxLevel +
        "\r\n时长：" + eventTime + "分钟";
    em.setProperty("party", req);
    print("[YaoSengBattle] Requirements set: " + req);
}

function setEventExclusives(eim) {
    eim.setExclusiveItems([]);
}

function setEventRewards(eim) {
    eim.setEventRewards(1, [], []);
    eim.setEventClearStageExp([]);
    eim.setEventClearStageMeso([]);
}

function afterSetup(eim) {
    print("[YaoSengBattle] afterSetup finished");
}

function setup(channel) {
    print("=== YaoSengBattle.setup called on channel " + channel);
    try {
        var eim = em.newInstance("YaoSeng" + channel);
        eim.setProperty("canJoin", "1");
        eim.setProperty("defeatedBoss", "0");

        var map = eim.getInstanceMap(entryMap);
        if (map == null) {
            print("[YaoSengBattle] ❌ entryMap is null! ID=" + entryMap);
            return null;
        }

        // 地图重置（这会刷出WZ预置的怪物）
        map.resetPQ(1);

        // ========== 检测是否已存在BOSS ==========
        var hasBoss = false;
        var monsters = map.getAllMonsters();
        var iter = monsters.iterator();

        while (iter.hasNext()) {
            var mob = iter.next();
            if (mob.getId() == BOSS_ID) {
                hasBoss = true;
                print("[YaoSengBattle] ✅ Boss already spawned from WZ: " + mob.getObjectId());
                break;
            }
        }

        // 只有WZ没预置时，才手动刷
        if (!hasBoss) {
            var boss = em.getMonster(BOSS_ID);
            if (boss != null) {
                map.spawnMonsterOnGroundBelow(boss, new java.awt.Point(0, 0));
                print("[YaoSengBattle] ✅ Boss spawned manually (WZ didn't have one)");
            } else {
                print("[YaoSengBattle] ❌ Boss creation failed!");
                return null;
            }
        }

        // 验证最终数量
        print("[YaoSengBattle] Total monsters on map: " + map.getAllMonsters().size());
        // ===========================================

        eim.startEventTimer(eventTime * 60000);
        setEventRewards(eim);
        setEventExclusives(eim);
        afterSetup(eim);

        // ✅ 启用伤害统计
        try {
            const DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
            DamageStatsMgr.enable();
            DamageStatsMgr.startBroadcastTimer(map);
            print("[YaoSengBattle] ✅ 伤害统计已启用");
        } catch (e) {
            print("[YaoSengBattle] ❌ 启用伤害统计失败: " + e);
        }

        print("[YaoSengBattle] ✅ setup success on channel " + channel);
        return eim;
    } catch (e) {
        print("[YaoSengBattle] ❌ setup exception: " + e + " line=" + e.lineNumber);
        return null;
    }
}

/* -------- 玩家进出 -------- */
function playerEntry(eim, player) {
    print("[YaoSengBattle] playerEntry: " + player.getName());
    var map = eim.getMapInstance(entryMap);
    player.changeMap(map, map.getPortal(0));
}

function scheduledTimeout(eim) {
    print("[YaoSengBattle] scheduledTimeout -> end");
    end(eim);
}

function changedMap(eim, player, mapid) {
    if (mapid < minMapId || mapid > maxMapId) {
        print("[YaoSengBattle] " + player.getName() + " left allowed map range");
        if (eim.isExpeditionTeamLackingNow(true, minPlayers, player)) {
            eim.unregisterPlayer(player);
            end(eim);
        } else {
            eim.unregisterPlayer(player);
        }
    }
}

function playerDead(eim, player) {}
function changedLeader(eim, leader) {}

function playerRevive(eim, player)     { handleLeave(eim, player); }
function playerDisconnected(eim, player) { handleLeave(eim, player); }

function handleLeave(eim, player) {
    if (eim.isExpeditionTeamLackingNow(true, minPlayers, player)) {
        eim.unregisterPlayer(player);
        print("[YaoSengBattle] team lacking after leave -> end");
        end(eim);
    } else {
        eim.unregisterPlayer(player);
    }
}

function leftParty(eim, player) {}
function disbandParty(eim) {}

/* -------- Boss 击杀 -------- */
function isYaoSeng(mob) {
    return mob.getId() == BOSS_ID;
}

function monsterKilled(mob, eim) {
    if (isYaoSeng(mob)) {
        print("[YaoSengBattle] Boss YaoSeng killed!");

        // ✅ 广播最终伤害排名（妖僧死亡时）
        try {
            Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance()
                .broadcastFinalRanking(mob.getMap());
            print("[YaoSengBattle] ✅ 最终伤害排名已广播");
        } catch (e) {
            print("[YaoSengBattle] ❌ 广播伤害排名失败: " + e);
        }

        eim.setIntProperty("defeatedBoss", 1);
        eim.showClearEffect(mob.getMap().getId());
        eim.clearPQ();
        mob.getMap().broadcastYaoSengVictory();
    }
}

function allMonstersDead(eim) {}
function monsterValue(eim, mobId) { return 1; }

/* -------- 副本结束 -------- */
function playerUnregistered(eim, player) {}
function playerExit(eim, player) {
    eim.unregisterPlayer(player);
    player.changeMap(exitMap, 0);
}

function end(eim) {
    print("[YaoSengBattle] end() called");
    var party = eim.getPlayers();
    for (var i = 0; i < party.size(); i++) {
        playerExit(eim, party.get(i));
    }
    eim.dispose();
}

function clearPQ(eim) {
    print("[YaoSengBattle] clearPQ");
    eim.stopEventTimer();
    eim.setEventCleared();
}

function cancelSchedule() {}
function updateGateState(newState) {}
function dispose(eim) {
    if (!eim.isEventCleared()) updateGateState(0);

    // ✅ 停止伤害统计
    try {
        Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().stop();
        print("[YaoSengBattle] ✅ 伤害统计已停止");
    } catch (e) {
        print("[YaoSengBattle] ❌ 停止伤害统计失败: " + e);
    }
}