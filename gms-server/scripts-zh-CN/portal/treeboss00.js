/* @author RonanLana
 * @modified: 添加每日挑战限制、120级等级限制、前置任务4528检查
 */

function enter(pi) {
    // ✅ 每日限制检查
    try {
        const DatabaseConnection = Java.type('org.gms.util.DatabaseConnection');
        var con = DatabaseConnection.getConnection();
        var ps = con.prepareStatement("SELECT COUNT(*) as count FROM bosslog_daily WHERE characterid = ? AND bosstype = 'KREXEL' AND DATE(attempttime) = CURDATE()");
        ps.setInt(1, pi.getPlayer().getId());
        var rs = ps.executeQuery();

        if (rs.next() && rs.getInt("count") > 0) {
            pi.playerMessage(5, "你今天已经挑战过克雷塞尔了，每天只能挑战一次（00:00重置），请明天再来。");
            rs.close(); ps.close(); con.close();
            return false;
        }
        rs.close(); ps.close(); con.close();
    } catch (e) {
        print("[KrexelEntry] 检查bosslog失败: " + e);
    }

    // ✅ 120级等级限制检查
    if (pi.getPlayer().getLevel() < 120) {
        pi.playerMessage(5, "需要达到120级以上才能挑战克雷塞尔。");
        return false;
    }

    // ✅ 前置任务检查（扳手任务4528）
    if (pi.getPlayer().getQuestStatus(4528) != 2) {
        pi.playerMessage(5, "你没完成前置任务获得<扳手>，无法进入。");
        return false;
    }

    var em = pi.getEventManager("KrexelBattle");

    // 检查队伍
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
            pi.playerMessage(5, "你暂时无法开始这场战斗，可能是因为队伍人数不符合要求、部分队员等级不足或不在当前地图。");
            return false;
        }

        pi.playPortalSound();
        return true;
    }
}