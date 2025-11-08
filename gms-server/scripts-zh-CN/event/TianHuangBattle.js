/*
 *  TianHuangBattle - 武林妖僧远征副本
 *  修复：使用HeavenMS标准刷怪方法，避免Foothold问题
 */

/* ========== 参数区 ========== */
var isPq = true;
var minPlayers = 1;
var maxPlayers = 6;
var minLevel = 160;
var maxLevel = 255;
var entryMap = 800040410;
var exitMap = 800040401;
var recruitMap = 800040401;
var clearMap = 800040401;
var minMapId = 800040410;
var maxMapId = 800040410;
var eventTime = 45;
const maxLobbies = 1;
const BOSS_ID_FIRST = 9400408;
const BOSS_ID_FINAL = 9400409;

/* ========== 核心逻辑 ========== */

function init() {
    print("[TianHuangBattle] init() called");
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
    print("[TianHuangBattle] afterSetup finished");
}

function setup(channel) {
    print("=== TianHuangBattle.setup called on channel " + channel);
    try {
        var eim = em.newInstance("TianHuang" + channel);
        eim.setProperty("canJoin", "1");
        eim.setIntProperty("defeatedBoss", 0);

        var map = eim.getInstanceMap(entryMap);
        if (map == null) {
            print("[TianHuangBattle] ❌ entryMap is null! ID=" + entryMap);
            return null;
        }

        eim.startEventTimer(eventTime * 60000);
        setEventRewards(eim);
        setEventExclusives(eim);
        afterSetup(eim);

        /* ===== 刷怪（核心修复） ===== */
        spawnBoss(eim);
        /* ==================== */

        print("[TianHuangBattle] ✅ setup success on channel " + channel);
        return eim;
    } catch (e) {
        print("[TianHuangBattle] ❌ setup exception: " + e);
        return null;
    }
}

// ✅ 独立刷怪函数，使用HeavenMS标准方法
function spawnBoss(eim) {
    try {
        const LifeFactory = Java.type('org.gms.server.life.LifeFactory');
        const Point = Java.type('java.awt.Point');

        var map = eim.getMapInstance(entryMap);
        var mob = LifeFactory.getMonster(BOSS_ID_FIRST);
        if (mob == null) {
            print("[SPAWN] ❌ Boss template NULL");
            return;
        }

        var pos = new Point(431, 580);

        // ✅ HeavenMS标准方法：自动寻找正确的Foothold
        map.spawnMonsterOnGroundBelow(mob, pos);

        print("[SPAWN] Boss " + BOSS_ID_FIRST + " spawned on ground below");
    } catch (e) {
        print("[SPAWN] Error: " + e);
    }
}

/* -------- 玩家进出 -------- */
function playerEntry(eim, player) {
    print("[TianHuangBattle] playerEntry: " + player.getName());
    var map = eim.getMapInstance(entryMap);
    player.changeMap(map, map.getPortal(0));
}

function scheduledTimeout(eim) {
    print("[TianHuangBattle] scheduledTimeout -> end");
    end(eim);
}

function changedMap(eim, player, mapid) {
    if (mapid < minMapId || mapid > maxMapId) {
        eim.unregisterPlayer(player);
    }
}

function playerDead(eim, player) { }
function changedLeader(eim, leader) { }

function playerRevive(eim, player) { handleLeave(eim, player); }
function playerDisconnected(eim, player) { handleLeave(eim, player); }

function handleLeave(eim, player) {
    if (eim.isExpeditionTeamLackingNow(true, minPlayers, player)) {
        eim.unregisterPlayer(player);
        end(eim);
    } else {
        eim.unregisterPlayer(player);
    }
}

function leftParty(eim, player) { }
function disbandParty(eim) { }

/* -------- Boss 击杀 -------- */
function monsterKilled(mob, eim) {
    var mobId = mob.getId();

    if (mobId == BOSS_ID_FIRST) {
        print("[TianHuangBattle] Initial boss killed! Waiting for final form...");
    } else if (mobId == BOSS_ID_FINAL) {
        eim.setIntProperty("defeatedBoss", 1);
        eim.showClearEffect(mob.getMap().getId());
        eim.clearPQ();
        mob.getMap().broadcastTianHuangVictory();
    }
}

function allMonstersDead(eim) { }
function monsterValue(eim, mobId) { return 1; }

/* -------- 副本结束 -------- */
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

function clearPQ(eim) {
    print("[TianHuangBattle] clearPQ");
    eim.stopEventTimer();
    eim.setEventCleared();
}

function cancelSchedule() { }
function updateGateState(newState) { }
function dispose(eim) {
    if (!eim.isEventCleared()) updateGateState(0);
}