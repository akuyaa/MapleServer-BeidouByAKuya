// 希纳斯 battle 脚本（已移植为 Zakum 风格的奖励与统计）
var isPq = true;
var minPlayers = 2, maxPlayers = 30;
var minLevel = 120, maxLevel = 200;
var entryMap = 271040100;
var exitMap = 271040000;
var eventTime = 120; // 分钟 (2 小时)

function init() {
    em.setProperty("leader", "true");
    em.setProperty("state", "0");
}

function setup() {
    // 支持不同调用签名（某些服务器会传入 channel 或 eim）
    var channel = 1;
    try {
        if (arguments != null && arguments.length > 0) {
            var first = arguments[0];
            if (typeof first === 'number' || (typeof first === 'string' && first.match(/^\d+$/))) {
                channel = parseInt(first);
            }
        }
    } catch (e) { }

    var eim = em.newInstance("CygnusBattle");
    eim.setProperty("canJoin", 1);
    eim.setProperty("defeatedBoss", 0);

    var bossMap = eim.setInstanceMap(entryMap);
    bossMap.resetFully();

    var mob1 = em.getMonster(8850000);
    eim.registerMonster(mob1);
    bossMap.spawnMonsterOnGroundBelow(mob1, new java.awt.Point(-363, 100));

    em.setProperty("state", "1");

    // 事件计时器（分钟->毫秒）
    eim.startEventTimer(eventTime * 60000);

    // 启用统计模块（参考 Zakum 实现）
    try {
        var DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
        DamageStatsMgr.enable(channel, entryMap);
        DamageStatsMgr.startBroadcastTimer(bossMap);
    } catch (e) {
        log.error("启用 DamageStatisticsManager 失败: " + e);
    }

    return eim;
}

function playerEntry(eim, player) {
    var NowMapID = eim.getProperty("NowMapID");
    var toMapid = 271040100;
    if (NowMapID != null) {
        toMapid = java.lang.Integer.parseInt(NowMapID);
    }
    var map = eim.getMapFactory().getMap(toMapid);
    player.changeMap(map, map.getPortal(0));
    eim.setProperty("isSquadPlayerID_" + player.getId(), "1");
    //var map = eim.getMapFactory().getMap(271040100);
    //player.changeMap(map, map.getPortal(0));
}

function playerRevive(eim, player) {
    return false;
}

function scheduledTimeout(eim) {
    eim.disposeIfPlayerBelow(100, 271040000);
    em.setProperty("state", "0");
    em.setProperty("leader", "true");
}

function changedMap(eim, player, mapid) {
    switch (mapid) {
        case 271040100:
            eim.setProperty("NowMapID", "" + mapid);
            return;
    }
    if (mapid != 271040100) {
        eim.unregisterPlayer(player);

        if (eim.disposeIfPlayerBelow(0, 0)) {
            em.setProperty("state", "0");
            em.setProperty("leader", "true");
        }
    }
}

function playerDisconnected(eim, player) {
    playerExit(eim, player);
    return 0;
}

function monsterValue(eim, mobId) {
    var map = eim.setInstanceMap(271040100);
    if (mobId == 8850000) {
        var mob5 = em.getMonster(8850001);
        eim.registerMonster(mob5);
        map.spawnMonsterOnGroundBelow(mob5, new java.awt.Point(-363, 100));
    } else if (mobId == 8850001) {
        var mob5 = em.getMonster(8850002);
        eim.registerMonster(mob5);
        map.spawnMonsterOnGroundBelow(mob5, new java.awt.Point(-363, 100));
    } else if (mobId == 8850002) {
        var mob5 = em.getMonster(8850003);
        eim.registerMonster(mob5);
        map.spawnMonsterOnGroundBelow(mob5, new java.awt.Point(-363, 100));
    } else if (mobId == 8850003) {
        var mob5 = em.getMonster(8850004);
        eim.registerMonster(mob5);
        map.spawnMonsterOnGroundBelow(mob5, new java.awt.Point(-363, 100));
    } else if (mobId == 8850004) {
        var mob5 = em.getMonster(8850011);
        eim.registerMonster(mob5);
        map.spawnMonsterOnGroundBelow(mob5, new java.awt.Point(-363, 100));
    }
    return 1;
}

// 处理怪物被击杀后的奖励与结算（参考 Zakum）
function monsterKilled(mob, eim) {
    try {
        var mobid = mob.getId();
        if (mobid == 8850011) { // 最终boss
            eim.setIntProperty("defeatedBoss", 1);
            eim.showClearEffect(mob.getMap().getId());

            try {
                var party = eim.getPlayers();
                const GOLD_LEAF = 4000313; // 黄金枫叶
                const BLUE_SNAIL = 4002001; // 蓝蜗牛邮票

                for (var i = 0; i < party.size(); i++) {
                    var player = party.get(i);
                    // 每人固定发放 黄金枫叶 x100
                    player.getClient().getAbstractPlayerInteraction().gainItem(GOLD_LEAF, 100, false, true);
                    // 每人发放 10 个蓝蜗牛邮票
                    player.getClient().getAbstractPlayerInteraction().gainItem(BLUE_SNAIL, 10, false, true);

                    player.dropMessage(5, "[希纳斯] 获得 100 个黄金枫叶与 10 个蓝蜗牛邮票！");
                }

                // 6% 概率触发稀有毕业装备分发（采用 Zakum 的每人一件策略）
                var randomNum = 1 + Math.floor(Math.random() * 100);
                print("[Cygnus roll] 本次随机数: " + randomNum);
                player.dropMessage("[roll点拿装备] 本次随机数: " + randomNum);
                if (randomNum <= 6) {
                    var equipList = [
                        1042254, 1042255, 1042256, 1042257, 1042258,
                        1062165, 1062166, 1062167, 1062168, 1062169,
                        1132246, 1113075, 1022226, 1132246,
                        1113075, 1022226, 1102481, 1102482,
                        1102483, 1102484, 1102485, 1072743, 1072744,
                        1072745, 1072746, 1072747,                         //暴君 系列
                        1302275, 1312153, 1322203, 1332225, 1372177, 1382208,
                        1402196, 1412135, 1422140, 1432167, 1442223, 1452205,
                        1462193, 1472214, 1482168, 1492179                     //FFN 武器
                    ];

                    try {
                        var eligiblePlayers = [];
                        for (var j = 0; j < party.size(); j++) {
                            eligiblePlayers.push(party.get(j));
                        }
                        if (eligiblePlayers.length > 0) {
                            for (var j = 0; j < eligiblePlayers.length; j++) {
                                var selectedEquip = equipList[Math.floor(Math.random() * equipList.length)];
                                var player = eligiblePlayers[j];
                                player.getClient().getAbstractPlayerInteraction().gainItem(selectedEquip, 1, false, true);
                                player.dropMessage(5, "恭喜！你获得了稀有装备！ 装备ID: " + selectedEquip);
                            }
                        }
                    } catch (e) {
                        print("发放稀有装备失败: " + e);
                    }
                }

                print("已为 " + party.size() + " 名玩家发放最终奖励。");
            } catch (e) {
                print("发放奖励失败: " + e);
            }

            try {
                Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().broadcastFinalRanking(mob.getMap());
            } catch (e) { }

            // Do not immediately clear the PQ; mimic Zakum flow to allow players time to pick up drops.
            try {
                // Stop the event timer and mark cleared, but delay disposing to preserve drops.
                eim.stopEventTimer();
                eim.setEventCleared();
                eim.showClearEffect(mob.getMap().getId());
                // Broadcast victory effect specific to Cygnus (if available)
                try {
                    mob.getMap().broadcastCygnusVictory();
                } catch (e) { }
                // Schedule a delayed disposal to give players time to loot (30 seconds)
                eim.schedule("delayedDispose", 30000);
            } catch (e) {
                print("结算阶段出错: " + e);
            }
        }
    } catch (e) {
        print("monsterKilled 错误: " + e);
    }
}

// Lifecycle methods expected by the EventInstanceManager — follow Zakum's patterns
function afterSetup(eim) {
    // Placeholder: can be used to open gates or set reactors; keep minimal to avoid NoSuchMethodException
    try {
        // If there are gate/reactor states to update, implement here. For now, log for debugging.
        log("afterSetup called");
    } catch (e) {}
}

function playerUnregistered(eim, player) {
    // Called when a player is unregistered from the EIM after completion
    try {
        if (eim.isEventCleared && eim.isEventCleared()) {
            // If you want to grant quest progress or other rewards per-player, do it here.
        }
    } catch (e) {}
}

var disposed = false;
function dispose(eim) {
    if (disposed) return;
    disposed = true;

    try {
        // Stop DamageStatistics if running for this map. Try best-effort stop using map id if available
        try {
            var DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
            // attempt to derive channel from eim name if possible
            var channel = 1;
            try {
                var eimName = eim.getName();
                for (var i = 0; i < eimName.length; i++) {
                    var c = eimName.charAt(i);
                    if (c >= '0' && c <= '9') {
                        channel = parseInt(eimName.substring(i));
                        break;
                    }
                }
            } catch (ee) {}
            DamageStatsMgr.stop(entryMap, channel);
        } catch (e) {}
    } catch (e) {}

    try {
        if (!eim.isEventCleared()) {
            em.setProperty("state", "0");
            em.setProperty("leader", "true");
        }
    } catch (e) {}
}

function delayedDispose(eim) {
    try {
        if (eim.getPlayerCount() == 0) {
            print("[CygnusBattle] 副本已空，执行清理");
            eim.dispose();
        } else {
            print("[CygnusBattle] 仍有玩家在副本中，延迟清理");
            eim.schedule("delayedDispose", 60000);
        }
    } catch (e) {
        print("delayedDispose 错误: " + e);
    }
}

function log(msg) {
    var LogHelper = Java.type('org.gms.util.LogHelper');
    LogHelper.logInfo("[CygnusBattle] " + msg);
}

function playerExit(eim, player) {
    eim.unregisterPlayer(player);

    if (eim.disposeIfPlayerBelow(0, 0)) {
        em.setProperty("state", "0");
        em.setProperty("leader", "true");
    }
}

function end(eim) {
    if (eim.disposeIfPlayerBelow(100, 271040000)) {
        em.setProperty("state", "0");
        em.setProperty("leader", "true");
    }
}

function clearPQ(eim) {
    end(eim);
}

function allMonstersDead(eim) {
}

function leftParty(eim, player) {}
function disbandParty(eim) {}
function playerDead(eim, player) {
 eim.setProperty("isSquadPlayerID_" + player.getId(), "1");
    
}
function cancelSchedule() {}