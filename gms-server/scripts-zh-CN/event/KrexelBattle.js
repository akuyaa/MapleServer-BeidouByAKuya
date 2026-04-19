/* 
 * @author: Ronan (Modified for Krexel Expedition)
 * @event: Vs Krexel
 * @modified: 添加伤害排名广播，击杀时立即发奖
 */

var isPq = true;
var minPlayers = 1, maxPlayers = 6;
var minLevel = 120, maxLevel = 255;
var entryMap = 541020800;
var exitMap = 541020700;
var recruitMap = 541020700;
var clearMap = 541020700;
var minMapId = 541020800;
var maxMapId = 541020800;
var eventTime = 45;

const maxLobbies = 1;
const BOSS_PHASE_1 = 9420520;
const BOSS_PHASE_2 = 9420521;
const BOSS_PHASE_3 = 9420522;
const POSITIVE_CHAOS_SCROLL = 2049115;      // 正向混沌50%
const GameConfig = Java.type('org.gms.config.GameConfig');
minPlayers = GameConfig.getServerBoolean("use_enable_solo_expeditions") ? 1 : minPlayers;
if (GameConfig.getServerBoolean("use_enable_party_level_limit_lift")) {
    minLevel = 1;
    maxLevel = 999;
}

function init() { setEventRequirements(); }
function getMaxLobbies() { return maxLobbies; }

function setEventRequirements() {
    var reqStr = "";
    reqStr += "\r\n   组队人数: " + (maxPlayers - minPlayers >= 1 ? minPlayers + " ~ " + maxPlayers : minPlayers);
    reqStr += "\r\n   等级要求: " + minLevel + " 级以上";
    reqStr += "\r\n   时间限制: " + eventTime + " 分钟";
    reqStr += "\r\n   特殊要求: 每日限1次";
    em.setProperty("party", reqStr);
}

function setEventExclusives(eim) { eim.setExclusiveItems([]); }
function setEventRewards(eim) {
    eim.setEventRewards(1, [], []);
    eim.setEventClearStageExp([]);
}

function hasDailyBossLog(player, bossType) {
    try {
        const DatabaseConnection = Java.type('org.gms.util.DatabaseConnection');
        var con = DatabaseConnection.getConnection();
        var ps = con.prepareStatement(
            "SELECT COUNT(*) AS count FROM bosslog_daily WHERE characterid = ? AND bosstype = ? AND DATE(attempttime) = CURDATE()"
        );
        ps.setInt(1, player.getId());
        ps.setString(2, bossType);
        var rs = ps.executeQuery();
        var exists = false;
        if (rs.next()) {
            exists = rs.getInt("count") > 0;
        }
        rs.close();
        ps.close();
        con.close();
        return exists;
    } catch (e) {
        print("[KrexelBattle] 检查bosslog失败: " + e);
        return false;
    }
}

function getEligibleParty(party) {
    var eligible = [];
    var hasLeader = false;
    if (party.size() > 0) {
        var partyList = party.toArray();
        for (var i = 0; i < party.size(); i++) {
            var ch = partyList[i];
            if (ch.getMapId() == recruitMap && ch.getLevel() >= minLevel && ch.getLevel() <= maxLevel) {
                if (ch.isLeader()) hasLeader = true;
                eligible.push(ch);
            }
        }
    }
    if (!(hasLeader && eligible.length >= minPlayers && eligible.length <= maxPlayers)) {
        eligible = [];
    }
    return Java.to(eligible, Java.type('org.gms.net.server.world.PartyCharacter[]'));
}

// ✅ 通用方法：从EIM获取频道ID（可复制到其他BOSS脚本）
function getChannelFromEim(eim) {
    try {
        var eimName = eim.getName();
        // 尝试从名称解析：BossName + channel 格式，如 "Krexel1", "TianHuang2"
        for (var i = 0; i < eimName.length; i++) {
            var char = eimName.charAt(i);
            if (char >= '0' && char <= '9') {
                var channel = parseInt(eimName.substring(i));
                if (!isNaN(channel) && channel > 0) {
                    return channel;
                }
            }
        }
        // 如果名称解析失败，尝试从eim获取channel属性
        var channelProp = eim.getProperty("channel");
        if (channelProp != null) {
            var channel = parseInt(channelProp);
            if (!isNaN(channel) && channel > 0) {
                return channel;
            }
        }
    } catch (e) {
        print("[getChannelFromEim] 解析频道失败: " + e);
    }
    // 默认返回1
    return 1;
}

function setup(level, lobbyid) {
    var eim = em.newInstance("Krexel" + lobbyid);
    eim.setProperty("level", level);
    eim.setProperty("boss", "0");
    eim.setProperty("clear", "0");
    eim.setProperty("finalized", "0");

    var map = eim.getInstanceMap(entryMap);
    map.resetPQ(level);
    map.resetFully();
    map.killAllMonsters();

    eim.startEventTimer(eventTime * 60000);
    setEventRewards(eim);
    setEventExclusives(eim);

    // ✅ 启用伤害统计（传入频道和地图ID）
    try {
        var channel = getChannelFromEim(eim);
        var DamageStatsMgr = Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance();
        DamageStatsMgr.enable(channel, entryMap);  // 传入频道和地图ID
        DamageStatsMgr.startBroadcastTimer(map);
        print("[KrexelBattle] 伤害统计已启用（频道: " + channel + "）");
    } catch (e) {
        print("[KrexelBattle] 启用伤害统计失败: " + e);
    }

    print("[KrexelBattle] 实例已创建: Krexel" + lobbyid);
    return eim;
}

function afterSetup(eim) { }
function respawnStages(eim) { }

function playerEntry(eim, player) {
    eim.dropMessage(5, "[远征队] " + player.getName() + " 已进入克雷塞尔的巢穴。");
    var map = eim.getMapInstance(entryMap);
    player.changeMap(map, map.getPortal(0));
}

function scheduledTimeout(eim) {
    eim.dropMessage(5, "[远征队] 时间到了！挑战失败。");
    end(eim);
}

// 玩家注销时（离开或掉线）补发奖励（如果击杀时没领到）
function playerUnregistered(eim, player) {
    if (eim.isEventCleared()) {
        giveRewardAndLog(eim, player);
    }
}

function playerExit(eim, player) {
    eim.unregisterPlayer(player);
    if (!eim.isEventCleared() && player != null) {
        player.changeMap(exitMap, 0);
    }
}

function playerLeft(eim, player) {
    if (!eim.isEventCleared()) {
        playerExit(eim, player);
    }
}

function changedMap(eim, player, mapid) {
    if (mapid < minMapId || mapid > maxMapId) {
        if (!eim.isEventCleared()) {
            partyPlayersCheck(eim, player, true);
        } else {
            eim.unregisterPlayer(player);
        }
    }
}

function changedLeader(eim, leader) { }
function playerDead(eim, player) { }

function playerRevive(eim, player) {
    partyPlayersCheck(eim, player, false);
}

function playerDisconnected(eim, player) {
    if (!eim.isEventCleared()) {
        partyPlayersCheck(eim, player, true);
    } else {
        eim.unregisterPlayer(player);
    }
}

function leftParty(eim, player) { }
function disbandParty(eim) { }

function monsterValue(eim, mobId) { return 1; }

function end(eim) {
    var party = eim.getPlayers();
    for (var i = 0; i < party.size(); i++) {
        playerExit(eim, party.get(i));
    }
    eim.dispose();
}

function clearPQ(eim) {
    eim.stopEventTimer();
    eim.setEventCleared();
    eim.setProperty("clear", "1");
}

function isKrexel(mob) {
    var mobId = mob.getId();
    return mobId == BOSS_PHASE_1 || mobId == BOSS_PHASE_2 || mobId == BOSS_PHASE_3;
}

function getPhase(mobId) {
    if (mobId == BOSS_PHASE_1) return 1;
    if (mobId == BOSS_PHASE_2) return 2;
    if (mobId == BOSS_PHASE_3) return 3;
    return 0;
}

// 给单个玩家发奖并记录日志（提取公共函数）
function giveRewardAndLog(eim, player) {
    if (player == null) return;

    // 检查是否已发放
    if (eim.getProperty("rewarded_" + player.getId()) == "1") return;

    if (hasDailyBossLog(player, 'KREXEL')) {
        player.dropMessage(5, "[克雷塞尔] 你今天已使用该BOSS次数，无法领取奖励。即使当前副本通关也不会额外发放奖励。");
        return;
    }

    try {
        // 发奖
        const ITEM_ID = 4001126;
        var qty = 2 + Math.floor(Math.random() * 7);
        player.getClient().getAbstractPlayerInteraction().gainItem(ITEM_ID, qty, false, true);
        player.dropMessage(5, "[克雷塞尔] 获得 " + qty + " 个枫叶！");
        player.getClient().getAbstractPlayerInteraction().gainItem(4002003, 3, false, true);
        player.dropMessage(5, "获得 3 个绿水灵邮票！");
        eim.setProperty("rewarded_" + player.getId(), "1");
    } catch (e) {
        print("[KrexelBattle] 给 " + player.getName() + " 发奖失败: " + String(e));
    }
    //每人一张正向混沌卷轴50%
    player.getClient().getAbstractPlayerInteraction().gainItem(
        POSITIVE_CHAOS_SCROLL,
        1,
        false,
        true
    );
    // ✅ 6%概率抽取稀有装备（新增代码）
    var randomNum = 1 + Math.floor(Math.random() * 100);
    print("[roll点拿装备] " + player.getName() + "本次随机数: " + randomNum);
    player.dropMessage("[roll点拿装备] 本次随机数: " + randomNum);

    if (randomNum <= 6) {
        // 装备ID列表（只取每个数组的第一个元素）
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
            var party = eim.getPlayers();
            for (var i = 0; i < party.size(); i++) {
                var selectedEquip = equipList[Math.floor(Math.random() * equipList.length)];
                print("触发稀有掉落！选中装备ID: " + selectedEquip);
                var player = party.get(i);
                player.getClient().getAbstractPlayerInteraction().gainItem(
                    selectedEquip, 1, false, true
                );
                player.dropMessage(5, "恭喜！你获得了稀有装备！");
                player.dropMessage(5, "获得装备ID: " + selectedEquip);
            }
            print("已将稀有装备 " + selectedEquip + " 发放给 " + party.size() + " 名玩家");
        } catch (e) {
            print("发放稀有装备失败: " + e);
        }
    }

    // 记录日志
    try {
        const DatabaseConnection = Java.type('org.gms.util.DatabaseConnection');
        var con = DatabaseConnection.getConnection();
        var ps = con.prepareStatement(
            "INSERT IGNORE INTO bosslog_daily (characterid, bosstype) VALUES (?, 'KREXEL')"
        );
        ps.setInt(1, player.getId());
        ps.executeUpdate();
        ps.close();
        con.close();
        print("[KrexelBattle] 已记录通关 - " + player.getName());
    } catch (e) {
        print("[KrexelBattle] 记录BossLog失败: " + String(e));
    }
}

// 第三阶段死亡处理
function handleFinalBossDefeated(eim, killer) {
    if (eim.isEventCleared() || eim.getProperty("finalized") == "1") return;

    eim.setProperty("finalized", "1");
    print("[KrexelBattle] 第三阶段被击杀，准备通关...");

    var map = eim.getMapInstance(entryMap);

    // 1. 显示通关效果（巨大通过字样）
    try {
        eim.showClearEffect();
        print("[KrexelBattle] 通关效果已显示");
    } catch (e) {
        print("[KrexelBattle] 显示通关效果失败: " + String(e));
    }

    // 2. ✅ 广播伤害排名（参照闹钟的关键代码）
    try {
        Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance()
            .broadcastFinalRanking(map);
        print("[KrexelBattle] 伤害排名已广播");
    } catch (e) {
        print("[KrexelBattle] 广播伤害排名失败: " + String(e));
    }

    // 3. ✅ 立即给所有在场玩家发奖（不再等离开）
    var party = eim.getPlayers();
    for (var i = 0; i < party.size(); i++) {
        giveRewardAndLog(eim, party.get(i));
    }

    // 提示玩家可以自行离开
    eim.dropMessage(5, "[远征队] 恭喜击败克雷塞尔！您可以使用回城卷或点击NPC离开副本。");

    // 通关标志
    clearPQ(eim);

    // 10分钟后检查清理
    eim.schedule("delayedDispose", 600000);
}

// 延迟清理
function delayedDispose(eim) {
    if (eim.getPlayerCount() == 0) {
        print("[KrexelBattle] 副本已空，执行清理");
        eim.dispose();
    } else {
        print("[KrexelBattle] 仍有玩家在副本中，延迟清理");
        eim.schedule("delayedDispose", 60000);
    }
}

function monsterKilled(mob, eim) {
    if (!isKrexel(mob)) return;

    var phase = getPhase(mob.getId());
    print("[KrexelBattle] 第 " + phase + " 阶段被击杀");

    if (phase == 3) {
        handleFinalBossDefeated(eim, null);
    } else if (phase == 1 || phase == 2) {
        var party = eim.getPlayers();
        for (var i = 0; i < party.size(); i++) {
            var player = party.get(i);
            if (player != null) {
                player.dropMessage(5, "[克雷塞尔] 第 " + phase + " 阶段被击败！即将进入下一阶段！");
            }
        }
    }
    if (mob.getId() == BOSS_PHASE_3) {
        mob.getMap().broadcastKrexelVictory();
    }

}

function allMonstersDead(eim) { }
function cancelSchedule() { }
function updateGateState(newState) { }

var disposed = false;
function dispose(eim) {
    if (disposed) return;
    disposed = true;

    // ✅ 停止伤害统计（传入频道和地图ID）
    try {
        var channel = getChannelFromEim(eim);
        Java.type('org.gms.server.maps.DamageStatisticsManager').getInstance().stop(entryMap, channel);
        print("[KrexelBattle] 伤害统计已停止（频道: " + channel + "）");
    } catch (e) {
        print("[KrexelBattle] 停止伤害统计失败: " + e);
    }

    print("[KrexelBattle] 实例dispose完成");
}


function partyPlayersCheck(eim, player, endOnLack) {
    if (eim.isEventCleared()) return true;

    var party = eim.getPlayers();
    if (party == null || party.size() < minPlayers) {
        if (player != null) eim.unregisterPlayer(player);
        if (endOnLack) {
            eim.dropMessage(5, "[远征队] 队伍人数不足，远征结束。");
            end(eim);
        }
        return false;
    } else {
        if (player != null) {
            eim.dropMessage(5, "[远征队] " + player.getName() + " 已离开副本。");
            eim.unregisterPlayer(player);
        }
        return true;
    }
}