/**
 * 天皇 – 每日限刷 1 次
 * 北斗项目组  @Magical-H
 * 日志版：每一步都打印控制台，方便秒定位
 * 修复：在创建远征和注册玩家前强制等级检查
 */

var status = 0;
var expedition;
var expedMembers;
var player;
var em;
const ExpeditionType = Java.type('org.gms.server.expeditions.ExpeditionType');
var exped = ExpeditionType.TIAN_HUANG;
var expedName = "TianHuang";
var expedBoss = "天皇";
var expedMap = "天守阁顶部";
var QuestID = 29932;

var list = "你想要做什么？#b\r\n\r\n#L1#查看当前远征队员名单#l\r\n#L2#开始战斗！#l\r\n#L3#结束远征#l";

function start() {
    action(1, 0, 0);
}

function action(mode, type, selection) {
    player = cm.getPlayer();
    expedition = cm.getExpedition(exped);
    em = cm.getEventManager("TianHuangBattle");

    print("[NPC 9110107] action mode=" + mode + " selection=" + selection + " expedition=" + expedition + " em=" + em);

    if (mode == -1) {
        cm.dispose();
    } else {
        if (mode == 0) {
            cm.dispose();
            return;
        }

        // ✅ 第一重检查：进入对话时检查等级
        if (status == 0) {
            if (player.getLevel() < exped.getMinLevel() || player.getLevel() > exped.getMaxLevel()) {
                cm.sendOk("您不符合与" + expedBoss + "战斗的条件！需要等级 " + exped.getMinLevel() + "~" + exped.getMaxLevel());
                cm.dispose();
                return;
            }

            if (expedition == null) {               // 尚未创建远征
                print("[NPC 9110107] 无远征，提示创建");
                cm.sendSimple("#e#b<远征：" + expedName + ">\r\n#k#n" + em.getProperty("party") +
                    "\r\n\r\n你想组建一个队伍来挑战 #r" + expedBoss + "#k 吗？\r\n#b#L1#让我们开始吧！#l\r\n#L2#不，我想再等一会儿...#l");
                status = 1;
            } else if (expedition.isLeader(player)) { // 队长管理
                if (expedition.isInProgress()) {
                    cm.sendOk("你的探险已经在进行中，对于那些仍在战斗中的人，让我们为那些勇敢的灵魂祈祷吧。");
                    cm.dispose();
                } else {
                    cm.sendSimple(list);
                    status = 2;
                }
            } else if (expedition.isRegistering()) { // 注册阶段
                // ✅ 第二重检查：注册远征队时检查等级
                if (player.getLevel() < exped.getMinLevel() || player.getLevel() > exped.getMaxLevel()) {
                    cm.sendOk("您的等级不符合要求，无法注册到远征队！");
                    cm.dispose();
                    return;
                }

                if (expedition.contains(player)) {
                    cm.sendOk("你已经注册了这次远征。请等待 #r" + expedition.getLeader().getName() + "#k 开始。");
                    cm.dispose();
                } else {
                    cm.sendOk(expedition.addMember(cm.getPlayer()));
                    cm.dispose();
                }
            } else if (expedition.isInProgress()) { // 进行中
                var eim = em.getInstance(expedName + player.getClient().getChannel());
                if (eim != null && eim.getIntProperty("canJoin") == 1) {
                    eim.registerPlayer(player);
                } else {
                    cm.sendOk("你的远征队已经开始对抗" + expedBoss + "的战斗。让我们为这些勇敢的灵魂祈祷。");
                }
                cm.dispose();
            }
        } else if (status == 1) {                  // 创建远征
            if (selection == 1) {
                expedition = cm.getExpedition(exped);
                if (expedition != null) {
                    cm.sendOk("有人已经主动成为了远征队的领袖。试着加入他们吧！");
                    cm.dispose();
                    return;
                }

                // ✅ 第三重检查：创建远征队前再次检查等级
                if (player.getLevel() < exped.getMinLevel() || player.getLevel() > exped.getMaxLevel()) {
                    cm.sendOk("您的等级不符合要求，无法创建远征队！");
                    cm.dispose();
                    return;
                }

                var res = cm.createExpedition(exped);
                print("[NPC 9110107] createExpedition result=" + res);
                if (res == 0) {
                    cm.sendOk("#r" + expedBoss + " 远征#k 已经创建。\r\n\r\n再次与我交谈，查看当前队伍，或开始战斗！");
                } else if (res > 0) {
                    cm.sendOk("抱歉，您已经达到了此次远征的尝试配额！请另选他日再试……");
                } else {
                    cm.sendOk("在启动远征时发生了意外错误，请稍后重试。");
                }
                cm.dispose();
            } else if (selection == 2) {
                cm.sendOk("当然，并非每个人都能挑战" + expedBoss + "。");
                cm.dispose();
            }
        } else if (status == 2) {                  // 队长菜单
            if (selection == 1) {                  // 查看队员
                if (expedition == null) {
                    cm.sendOk("无法加载远征队。");
                    cm.dispose();
                    return;
                }
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
            } else if (selection == 2) {           // 开始战斗
                var min = exped.getMinSize();
                var size = expedition.getMemberList().size();
                if (size < min) {
                    cm.sendOk("你的远征队至少需要有" + min + "名玩家注册。");
                    cm.dispose();
                    return;
                }
                cm.sendOk("探险队即将出发，你现在将被护送到 #b" + expedMap + "#k。");
                status = 4;
            } else if (selection == 3) {           // 结束远征
                const PacketCreator = Java.type('org.gms.util.PacketCreator');
                player.getMap().broadcastMessage(PacketCreator.serverNotice(6, expedition.getLeader().getName() + "探险结束了。"));
                cm.endExpedition(expedition);
                cm.sendOk("这次探险已经结束。有时候最好的策略就是逃跑。");
                cm.dispose();
            }
        } else if (status == 4) {                  // 真正调用 startInstance
            print("[NPC 9110107] >>> 准备调用 em.startInstance，远征=" + expedName + "，channel=" + player.getClient().getChannel());
            if (em == null) {
                print("[NPC 9110107] ❌ em is null");
                cm.sendOk("事件管理器未加载，请在论坛上报告此问题。");
                cm.dispose();
                return;
            }

            em.setProperty("leader", player.getName());
            em.setProperty("channel", player.getClient().getChannel());

            var ok = em.startInstance(expedition);
            print("[NPC 9110107] >>> em.startInstance 返回值=" + ok);
            if (!ok) {
                cm.sendOk("另一支探险队已经主动挑战了" + expedBoss + "，让我们为这些勇敢的灵魂祈祷吧。");
                cm.dispose();
                return;
            }
            print("[NPC 9110107] ✅ startInstance 成功，关闭对话");
            cm.dispose();
        } else if (status == 6) {                  // 踢人
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
}