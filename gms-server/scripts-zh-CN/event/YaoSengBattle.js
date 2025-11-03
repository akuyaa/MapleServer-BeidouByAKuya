/*
 *  YaoSengBattle - 武林妖僧远征副本
 *  基于 Zakum 事件模板复用，参数区可自行调整
 */

/* ========== 参数区（按需修改） ========== */
var isPq        = true;
var minPlayers  = 1;        // 开发阶段可先设 1
var maxPlayers  = 6;
var minLevel    = 50;
var maxLevel    = 255;
var entryMap    = 702060000;   // 副本地图ID
var exitMap     = 702070400;   // 退出地图ID
var recruitMap  = 702070400;
var clearMap    = 702070400;
var minMapId    = 702060000;
var maxMapId    = 702060000;
var eventTime   = 30;          // 分钟
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
        map.resetPQ(1);

        eim.startEventTimer(eventTime * 60000);
        setEventRewards(eim);
        setEventExclusives(eim);
        afterSetup(eim);

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
        eim.setIntProperty("defeatedBoss", "1");
        eim.showClearEffect(mob.getMap().getId());
        eim.clearPQ();
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
}