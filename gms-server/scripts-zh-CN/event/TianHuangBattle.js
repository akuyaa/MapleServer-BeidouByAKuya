/*
 *  TianHuangBattle - 武林妖僧远征副本
 *  开局刷 9400408（天皇），击杀 9400409（天皇蟾蜍）后触发通关
 */

/* ========== 参数区（按需修改） ========== */
var isPq = true;
var minPlayers = 1;        // 开发阶段可先设 1
var maxPlayers = 6;
var minLevel = 160;
var maxLevel = 255;
var entryMap = 800040410;   // 副本地图ID
var exitMap = 800040401;   // 退出地图ID
var recruitMap = 800040401;
var clearMap = 800040401;
var minMapId = 800040410;
var maxMapId = 800040410;
var eventTime = 45;          // 分钟
var postionX = 431;        // BOSS X坐标
var postionY = 580;        // BOSS Y坐标
const maxLobbies = 1;
const BOSS_ID_FIRST = 9400408;   // ✅ 初始形态：天皇
const BOSS_ID_FINAL = 9400409;   // ✅ 最终形态：天皇蟾蜍

/* ========== 以下逻辑勿动，已加日志 ========== */
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
    print("[TianHuangBattle] Requirements set: " + req);
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
        eim.setIntProperty("defeatedBoss", 0);  // ✅ 修复：使用整数

        var map = eim.getInstanceMap(entryMap);
        if (map == null) {
            print("[TianHuangBattle] ❌ entryMap is null! ID=" + entryMap);
            return null;
        }
        map.resetPQ(1);

        eim.startEventTimer(eventTime * 60000);
        setEventRewards(eim);
        setEventExclusives(eim);
        afterSetup(eim);

        /* ===== 刷怪 ===== */
        try {
            const LifeFactory = Java.type('org.gms.server.life.LifeFactory');
            var map = eim.getMapInstance(entryMap);
            var mob = LifeFactory.getMonster(BOSS_ID_FIRST);  // ✅ 刷初始形态
            if (mob == null) {
                print("[SPAWN] Boss template NULL");
                return;
            }

            map.spawnMonster(mob);
            mob.setPosition(new java.awt.Point(postionX, postionY));
            print("[SPAWN] Boss " + BOSS_ID_FIRST + " spawned & moved to (" + postionX + "," + postionY + ")");
        } catch (e) {
            print("[SPAWN] Error: " + e);
        }
        /* ==================== */

        print("[TianHuangBattle] ✅ setup success on channel " + channel);
        return eim;
    } catch (e) {
        print("[TianHuangBattle] ❌ setup exception: " + e + " line=" + e.lineNumber);
        return null;
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
    print("[DEBUG] changedMap: " + player.getName() + " mapid=" + mapid +
        " min=" + minMapId + " max=" + maxMapId);
    if (mapid < minMapId || mapid > maxMapId) {
        print("[TianHuangBattle] " + player.getName() + " left allowed map range");
    }
}

function playerDead(eim, player) { }
function changedLeader(eim, leader) { }

function playerRevive(eim, player) { handleLeave(eim, player); }
function playerDisconnected(eim, player) { handleLeave(eim, player); }

function handleLeave(eim, player) {
    if (eim.isExpeditionTeamLackingNow(true, minPlayers, player)) {
        eim.unregisterPlayer(player);
        print("[TianHuangBattle] team lacking after leave -> end");
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
        // 初始形态死亡，仅日志，不结束副本
        print("[TianHuangBattle] Initial boss " + BOSS_ID_FIRST + " killed! Waiting for final form...");
    } else if (mobId == BOSS_ID_FINAL) {
        // ✅ 最终形态死亡，触发副本结束
        print("[TianHuangBattle] Final boss " + BOSS_ID_FINAL + " killed! Event clear!");
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
    print("[TianHuangBattle] end() called");
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