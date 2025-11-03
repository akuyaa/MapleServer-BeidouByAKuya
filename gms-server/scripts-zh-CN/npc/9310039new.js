/**
 * 少林密室 – 每日限刷 2 次（零阻塞版）
 * 北斗项目组  @Magical-H
 * 游戏脚本只写本地文件，绝不发 HTTP；外部工具负责真正的 addMember 调用
 */
var status = 0;
var expedition;
var expedMembers;
var player;
var em;
const ExpeditionType = Java.type('org.gms.server.expeditions.ExpeditionType');
var exped = ExpeditionType.YAO_SENG;
var expedName = "YaoSeng";
var expedBoss = "武林妖僧";
var expedMap  = "少林密室";
var QuestID   = 8534;
var bossId    = "武僧";

var list = "你想要做什么？#b\r\n\r\n#L1#查看当前远征队员名单#l\r\n#L2#开始战斗！#l\r\n#L3#结束远征#l";

/* =========================================================
 *  工具：本地文件读写（不联网）
 * =========================================================*/
var todayKey = "Boss_" + bossId + "_" + new Date().toISOString().slice(0,10);
var countDir   = java.lang.System.getProperty("user.home") + "/gms_boss_count/"; // 随意目录
var countFile  = countDir + todayKey + ".txt";

// 确保目录存在
function ensureDir() {
    var f = new java.io.File(countDir);
    if (!f.exists()) f.mkdirs();
}
// 读次数
function getTodayCount(characterId) {
    ensureDir();
    try {
        var all = java.nio.file.Files.readAllLines(new java.nio.file.File(countFile).toPath());
        for (var i = 0; i < all.size(); i++) {
            var line = all.get(i).trim();
            if (line == String(characterId)) return 1; // 出现一次就算 1 次
        }
    } catch (e) {/* 文件不存在就当 0 */}
    return 0;
}
// 追加写（不去重，外部工具最后统一处理）
function appendId(characterId) {
    ensureDir();
    var fw = new java.io.FileWriter(countFile, true);
    fw.write(characterId + "\n");
    fw.close();
}

/* =========================================================
 *  主流程（和原来完全一致，只把 HTTP 换成读文件）
 * =========================================================*/
function start() {
    action(1, 0, 0);
}

function action(mode, type, selection) {
    player = cm.getPlayer();
    expedition = cm.getExpedition(exped);
    em = cm.getEventManager("YaoSengBattle");

    if (mode == -1) {
        cm.dispose();
        return;
    }
    if (mode == 0) {
        cm.dispose();
        return;
    }

    if (status == 0) {
        /* -------- 等级检查 -------- */
        if (player.getLevel() < exped.getMinLevel() || player.getLevel() > exped.getMaxLevel()) {
            cm.sendOk("您不符合与" + expedBoss + "战斗的条件！");
            cm.dispose();
            return;
        }
        /* -------- 尚未创建 -------- */
        if (expedition == null) {
            cm.sendSimple("#e#b<远征：" + expedName + ">\r\n#k#n" + em.getProperty("party") +
                "\r\n\r\n你想组建一个队伍来挑战 #r" + expedBoss + "#k 吗？\r\n#b#L1#让我们开始吧！#l\r\n#L2#不，我想再等一会儿...#l");
            status = 1;
            return;
        }
        /* -------- 队长管理 -------- */
        if (expedition.isLeader(player)) {
            if (expedition.isInProgress()) {
                cm.sendOk("你的探险已经在进行中，对于那些仍在战斗中的人，让我们为那些勇敢的灵魂祈祷吧。");
                cm.dispose();
            } else {
                cm.sendSimple(list);
                status = 2;
            }
            return;
        }
        /* -------- 注册阶段 -------- */
        if (expedition.isRegistering()) {
            if (expedition.contains(player)) {
                cm.sendOk("你已经注册了这次远征。请等待 #r" + expedition.getLeader().getName() + "#k 开始。");
                cm.dispose();
            } else {
                // 个人校验
                if (getTodayCount(player.getId()) >= 2) {
                    cm.sendOk("你今天已完成 2 次武僧，无法再加入远征。");
                    cm.dispose();
                    return;
                }
                cm.sendOk(expedition.addMember(player));
                cm.dispose();
            }
            return;
        }
        /* -------- 进行中 -------- */
        if (expedition.isInProgress()) {
            var eim = em.getInstance(expedName + player.getClient().getChannel());
            if (eim != null && eim.getIntProperty("canJoin") == 1) {
                eim.registerPlayer(player);
            } else {
                cm.sendOk("你的远征队已经开始对抗" + expedBoss + "的战斗。让我们为这些勇敢的灵魂祈祷。");
            }
            cm.dispose();
        }
    }

    else if (status == 1) {              // 创建远征
        if (selection == 1) {
            expedition = cm.getExpedition(exped);
            if (expedition != null) {
                cm.sendOk("有人已经主动成为了远征队的领袖。试着加入他们吧！");
                cm.dispose();
                return;
            }
            var res = cm.createExpedition(exped);
            if (res == 0) {
                cm.sendOk("#r" + expedBoss + " 远征#k 已经创建。\r\n\r\n再次与我交谈，查看当前队伍，或开始战斗！");
            } else if (res > 0) {
                cm.sendOk("抱歉，您已经达到了此次远征的尝试配额！请另选他日再试……");
            } else {
                cm.sendOk("在启动远征时发生了意外错误，请稍后重试。");
            }
            cm.dispose();
        } else {
            cm.sendOk("当然，并非每个人都能挑战" + expedBoss + "。");
            cm.dispose();
        }
    }

    else if (status == 2) {              // 队长菜单
        if (selection == 1) {              // 查看队员
            expedMembers = expedition.getMemberList();
            var size = expedMembers.size();
            if (size == 1) {
                cm.sendOk("你是探险队中唯一的成员。");
                cm.dispose();
                return;
            }
            var text = "当前与您参与远程的队员(点击名字可驱逐出队伍):\r\n";
            text += "\r\n\t\t1." + expedition.getLeader().getName();
            for (var i = 1; i < size; i++) {
                text += "\r\n#b#L" + (i + 1) + "#" + (i + 1) + ". " + expedMembers.get(i).getValue() + "#l\n";
            }
            cm.sendSimple(text);
            status = 6;
        } else if (selection == 2) {       // 开始战斗
            var min = exped.getMinSize();
            var size = expedition.getMemberList().size();
            if (size < min) {
                cm.sendOk("你的远征队至少需要有" + min + "名玩家注册。");
                cm.dispose();
                return;
            }
            /* ===== 本地文件校验：全队 ===== */
            var members = expedition.getMemberList();
            for (var i = 0; i < members.size(); i++) {
                var cid = members.get(i).getId();
                if (getTodayCount(cid) >= 2) {
                    cm.sendOk("角色ID " + cid + " 今天已完成 2 次武僧，无法开始远征。");
                    cm.dispose();
                    return;
                }
            }
            cm.sendOk("探险队即将出发，你现在将被护送到 #b" + expedMap + "#k。");
            status = 4;
        } else if (selection == 3) {       // 结束远征
            const PacketCreator = Java.type('org.gms.util.PacketCreator');
            player.getMap().broadcastMessage(PacketCreator.serverNotice(6, expedition.getLeader().getName() + "探险结束了。"));
            cm.endExpedition(expedition);
            cm.sendOk("这次探险已经结束。有时候最好的策略就是逃跑。");
            cm.dispose();
        }
    }

    else if (status == 4) {              // 真正调用 startInstance
        em.setProperty("leader", player.getName());
        em.setProperty("channel", player.getClient().getChannel());

        var ok = em.startInstance(expedition);
        if (!ok) {
            cm.sendOk("另一支探险队已经主动挑战了" + expedBoss + "，让我们为这些勇敢的灵魂祈祷吧。");
            cm.dispose();
            return;
        }
        /* ===== 零阻塞：只把 ID 写本地文件 ===== */
        try {
            var members = expedition.getMemberList();
            for (var j = 0; j < members.size(); j++) {
                appendId(members.get(j).getId());
            }
        } catch (e) {
            java.lang.System.err.println('[少林密室] 写本地文件失败: ' + e);
        }
        cm.dispose();
    }

    else if (status == 6) {              // 踢人
        if (selection > 0) {
            var banned = expedMembers.get(selection - 1);
            expedition.ban(banned);
            cm.sendOk("你已经从远征中禁止了 " + banned.getValue() + "。");
            cm.dispose();
        } else {
            cm.sendSimple(list);
            status = 2;
        }
    }
}