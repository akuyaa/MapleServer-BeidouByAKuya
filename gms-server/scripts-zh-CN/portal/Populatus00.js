/* @author RonanLana
 * @modified: 添加每日挑战限制（使用bosslog_daily表）
 */

function enter(pi) {
    // 原有任务路线判断（D.罗伊的研究）
    if (!((pi.isQuestStarted(6361) && pi.haveItem(4031870, 1)) || (pi.isQuestCompleted(6361) && !pi.isQuestCompleted(6363)))) {

        // ✅ 每日限制检查：直接查询bosslog_daily表
        var canEnter = true;
        try {
            const DatabaseConnection = Java.type('org.gms.util.DatabaseConnection');
            var con = DatabaseConnection.getConnection();
            var ps = con.prepareStatement("SELECT COUNT(*) as count FROM bosslog_daily WHERE characterid = ? AND bosstype = 'PAPULATUS' AND DATE(attempttime) = CURDATE()");
            ps.setInt(1, pi.getPlayer().getId());
            var rs = ps.executeQuery();

            if (rs.next() && rs.getInt("count") > 0) {
                canEnter = false;
            }

            rs.close();
            ps.close();
            con.close();

            if (!canEnter) {
                pi.playerMessage(5, "你今天已经挑战过帕普拉图斯了，每天只能挑战一次（00:00重置），请明天再来。");
                return false;
            }
        } catch (e) {
            print("[PapulatusEntry] 检查bosslog失败: " + e);
            // 如果查询出错，允许进入（避免阻塞玩家）
        }

        var em = pi.getEventManager("PapulatusBattle");

        if (pi.getParty() == null) {
            pi.playerMessage(5, "你当前未加入远征队，请创建队伍后再挑战BOSS。");
            return false;
        } else if (!pi.isLeader()) {
            pi.playerMessage(5, "你的队伍必须由队长进入传送门才能开始战斗。");
            return false;
        } else {
            var eli = em.getEligibleParty(pi.getParty());
            if (eli.size() > 0) {
                if (!em.startInstance(pi.getParty(), pi.getPlayer().getMap(), 1)) {
                    pi.playerMessage(5, "当前无法开始战斗，可能有其他队伍正在进行挑战。");
                    return false;
                }
            } else {
                pi.playerMessage(5, "你暂时无法开始这场战斗，可能是因为队伍人数不符合要求、部分队员未满足挑战条件或不在当前地图。");
                return false;
            }

            pi.playPortalSound();
            return true;
        }
    } else {
        // 任务路线
        pi.playPortalSound();
        pi.warp(922020300, 0);
        return true;
    }
}