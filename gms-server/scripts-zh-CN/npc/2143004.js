// 希纳斯远征 NPC — 改用远征 (Expedition) API，移除旧的 squad 接口调用
var status = 0;
var player;
var expedition;
var em;
const ExpeditionType = Java.type('org.gms.server.expeditions.ExpeditionType');
const ExpeditionBossLog = Java.type('org.gms.server.expeditions.ExpeditionBossLog');
const Expedition = Java.type('org.gms.server.expeditions.Expedition');
const expedType = ExpeditionType.CYGNUS;

function start() {
    action(1, 0, 0);
}

function action(mode, type, selection) {
    player = cm.getPlayer();
    expedition = cm.getExpedition(expedType);
    em = cm.getEventManager("CygnusBattle");

    if (mode == -1) {
        cm.dispose();
        return;
    }
    if (mode == 0) {
        cm.dispose();
        return;
    }

    if (status == 0) {
        // If player is inside the instance map, offer exit
        if (player.getMapId() == 271040100) {
            cm.sendYesNo("你想返回主城吗？");
            status = 1;
            return;
        }

        if (player.getLevel() < 120) {
            cm.sendOk("你的等級不够! (需要120)");
            cm.dispose();
            return;
        }

        if (em == null) {
            cm.sendOk("活动未就绪，请联系管理员。");
            cm.dispose();
            return;
        }

        if (expedition == null) {
            cm.sendSimple("#e#b<远征: 希纳斯>\r\n#k你想创建/查看远征队吗?#b\r\n#L1#创建远征队#l\r\n#L2#稍后再说#l");
            status = 2;
            return;
        }

        // If player is leader
        if (expedition.isLeader(player)) {
            if (expedition.isInProgress()) {
                cm.sendOk("你的远征已经开始。等待正在战斗的队员。");
                cm.dispose();
                return;
            }
            cm.sendSimple("你想做什么?\r\n#b#L0#查看远征队名单#l\r\n#b#L1#移除成员#l\r\n#b#L2#结束远征#l\r\n#r#L3#开始战斗#l");
            status = 3;
            return;
        }

        if (expedition.isRegistering()) {
            if (expedition.contains(player)) {
                cm.sendOk("你已经登记了这次远征。请等待队长开始。");
                cm.dispose();
                return;
            }
            // Offer to join
            cm.sendYesNo("这支远征队正在登记，是否要加入？");
            status = 5;
            return;
        }

        if (expedition.isInProgress()) {
            if (expedition.contains(player)) {
                var eim = em.getInstance("Cygnus" + player.getClient().getChannel());
                if (eim != null && eim.getIntProperty("canJoin") == 1) {
                    eim.registerPlayer(player);
                } else {
                    cm.sendOk("远征已经开始，当前无法加入。");
                }
            } else {
                cm.sendOk("另一支远征正在进行中，请稍后再试。");
            }
            cm.dispose();
            return;
        }

        cm.sendOk("无法处理请求，请稍后重试。若问题持续存在，请联系管理员。");
        cm.dispose();
        return;
    } else if (status == 1) {
        // leave map
        if (mode == 1) {
            cm.warp(271040000, 0);
        }
        cm.dispose();
        return;
    } else if (status == 2) {
        if (selection == 1) {
            // create expedition
            var res = cm.createExpedition(expedType);
            if (res == 0) {
                cm.sendOk("远征已创建，作为队长请管理你的队伍。");
            } else if (res > 0) {
                cm.sendOk("你今天的远征次数已达到上限，请稍后再试。");
            } else {
                cm.sendOk("创建远征失败，请稍后再试。");
            }
            cm.dispose();
            return;
        }
        cm.sendOk("好吧，改天再说。");
        cm.dispose();
        return;
    } else if (status == 3) {
        if (selection == 0) {
            // view members
            if (expedition == null) {
                cm.sendOk("远征无法加载。请稍后重试。");
                cm.dispose();
                return;
            }
            var members = expedition.getMemberList();
            var size = members.size();
            if (size <= 1) {
                cm.sendOk("目前只有你一人。请邀请更多队员。");
                cm.dispose();
                return;
            }
            var text = "远征成员:\r\n";
            for (var i = 0; i < size; i++) {
                var e = members.get(i);
                text += "\r\n" + (i + 1) + ". " + e.getValue();
            }
            cm.sendOk(text);
            cm.dispose();
            return;
        } else if (selection == 1) {
            // remove member - simple index based removal
            var members = expedition.getMemberList();
            var size = members.size();
            if (size <= 1) {
                cm.sendOk("无可移除成员。");
                cm.dispose();
                return;
            }
            var text = "选择要移除的成员:\r\n";
            for (var i = 1; i < size; i++) {
                var e = members.get(i);
                text += "\r\n#L" + i + "#" + e.getValue() + "#l";
            }
            cm.sendSimple(text);
            status = 11;
            return;
        } else if (selection == 2) {
            cm.endExpedition(expedition);
            cm.sendOk("远征已结束。");
            cm.dispose();
            return;
        } else if (selection == 3) {
            // start fight
            if (em == null) {
                cm.sendOk("事件未就绪，请联系管理员。");
                cm.dispose();
                return;
            }
            // starting an instance will validate participants via ExpeditionBossLog in server-side logic
            if (!em.startInstance(expedition)) {
                cm.sendOk("另一个远征正在进行中。无法开始。");
                cm.dispose();
                return;
            }
            cm.dispose();
            return;
        }
    } else if (status == 5) {
        // Player chose to join while expedition is registering
        if (mode == 1) {
            // Check bosslog / attempt limit via ExpeditionBossLog
            try {
                var channel = player.getMap().getChannelServer().getId();
                var exped = new Expedition(player, expedType);
                if (!ExpeditionBossLog.attemptBoss(player.getId(), channel, exped, false)) {
                    cm.sendOk("很抱歉，你的每日远征次数已用完，无法加入远征队。\r\n(每日次数限制)");
                    cm.dispose();
                    return;
                }
            } catch (e) {
                print("ExpeditionBossLog 检查失败: " + e);
            }

            var res = expedition.addMember(player);
            // expedition.addMember may return a message or code; show a friendly confirmation
            cm.sendOk("已加入远征队，等待队长开始。\r\n" + (res ? String(res) : ""));
            cm.dispose();
            return;
        } else {
            cm.dispose();
            return;
        }
    } else if (status == 11) {
        // handle selected member removal
        var idx = selection; // selection corresponds to list index we presented
        var members = expedition.getMemberList();
        if (idx > 0 && idx < members.size()) {
            var banned = members.get(idx);
            expedition.ban(banned);
            cm.sendOk("已移除 " + banned.getValue());
        } else {
            cm.sendOk("无效选择。");
        }
        cm.dispose();
        return;
    }
    cm.dispose();
}