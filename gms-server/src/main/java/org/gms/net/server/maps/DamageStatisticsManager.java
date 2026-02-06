package org.gms.server.maps;

import org.gms.client.Character;
import org.gms.scripting.event.EventInstanceManager;
import org.gms.util.PacketCreator;
import org.gms.server.TimerManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.text.NumberFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.stream.Collectors;

public class DamageStatisticsManager {
    private static final Logger log = LoggerFactory.getLogger(DamageStatisticsManager.class);
    private static final DamageStatisticsManager instance = new DamageStatisticsManager();

    // 伤害单位转换常量
    private static final long WAN_UNIT = 10000L; // 万单位
    private static final long YI_UNIT = 100000000L; // 亿单位

    // ✅ 多地图副本配置：每个数组是一个副本的所有地图
    private static final int[][] MULTI_MAP_BOSSES = {
            {240060000, 240060100, 240060200},  // Horntail 黑龙三地图
            {801040100, 801040101}               // ShoWa 昭和两地图
    };

    // 单地图 Boss
    private static final Set<Integer> SINGLE_MAP_BOSSES = Set.of(
            280030000,  // Zakum
            800040410,  // TianHuang
            220080001,  // Papulatus
            270050100,  // PinkBean
            551030200,  // Scarga
            702060000,  // YaoSeng
            541020800   // Krexel
    );

    // Boss名称映射
    private static final Map<Integer, String> BOSS_NAMES = new HashMap<>();
    static {
        // 多地图副本Boss名称
        BOSS_NAMES.put(240060000, "暗黑龙王");
        BOSS_NAMES.put(801040100, "广州黑龙");

        // 单地图Boss名称
        BOSS_NAMES.put(280030000, "扎昆");
        BOSS_NAMES.put(800040410, "天皇");
        BOSS_NAMES.put(220080001, "帕普拉图斯");
        BOSS_NAMES.put(270050100, "品克缤");
        BOSS_NAMES.put(551030200, "心疤狮王与熊");
        BOSS_NAMES.put(702060000, "武林妖僧");
        BOSS_NAMES.put(541020800, "克雷塞尔");
    }

    // 生成所有支持的地图ID
    private static final Set<Integer> SUPPORTED_MAP_IDS = new HashSet<>();
    static {
        SINGLE_MAP_BOSSES.forEach(SUPPORTED_MAP_IDS::add);
        for (int[] group : MULTI_MAP_BOSSES) {
            for (int id : group) SUPPORTED_MAP_IDS.add(id);
        }
    }

    // 地图ID -> 组ID 映射
    private static final Map<Integer, Integer> MAP_TO_GROUP = new HashMap<>();
    static {
        SINGLE_MAP_BOSSES.forEach(id -> MAP_TO_GROUP.put(id, id));
        for (int[] group : MULTI_MAP_BOSSES) {
            int groupId = group[0];
            for (int mapId : group) {
                MAP_TO_GROUP.put(mapId, groupId);
            }
        }
    }

    // 多实例管理
    private final Map<Integer, DamageStatisticsInstance> instances = new ConcurrentHashMap<>();

    // 内部类
    private class DamageStatisticsInstance {
        private final Map<Integer, Long> damageData = new ConcurrentHashMap<>();
        private ScheduledFuture<?> timer = null;
        private boolean enabled = false;
        private final int groupId;
        private long lastDamageTime = 0;  // ✅ 记录最后伤害时间

        DamageStatisticsInstance(int groupId) {
            this.groupId = groupId;
        }

        void enable() {
            if (enabled) return;
            enabled = true;
            damageData.clear();
            lastDamageTime = System.currentTimeMillis();
        }

        void recordDamage(Character attacker, int damage) {
            if (!enabled || attacker == null || damage <= 0) return;
            int charId = attacker.getId();
            damageData.merge(charId, (long)damage, Long::sum);
            lastDamageTime = System.currentTimeMillis();  // ✅ 更新最后伤害时间
        }

        void startBroadcastTimer(MapleMap map) {
            if (timer != null && !timer.isCancelled()) {
                return;  // 已启动，不再重复创建
            }

            timer = TimerManager.getInstance().register(() -> {
                try {
                    broadcastRanking(map);
                } catch (Exception e) {
                    log.error("副本组 {} 广播排名时出错", groupId, e);
                }
            }, 20000, 20000);  // 20秒广播一次

            log.info("启动伤害统计定时器 - 副本组: {} (触发地图: {})", groupId, map.getId());
        }

        void broadcastRanking(MapleMap triggerMap) {
            if (!enabled) return;
            if (damageData.isEmpty()) return;
            if (triggerMap == null) return;

            // ✅ 5分钟无伤害自动停止
            if (System.currentTimeMillis() - lastDamageTime > 5 * 60 * 1000) {
                log.info("副本组 {} 超过5分钟无伤害，自动停止", groupId);
                stop();
                return;
            }

            NumberFormat nf = NumberFormat.getInstance();
            List<Map.Entry<Integer, Long>> sortedData = damageData.entrySet().stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .limit(10)
                    .collect(Collectors.toList());

            if (sortedData.isEmpty()) return;

            // ✅ 关键修复：向组内所有地图广播，而不只是触发地图
            int[] groupMaps = getGroupMaps(groupId);

            for (int mapId : groupMaps) {
                MapleMap map = getMapFromTrigger(triggerMap, mapId);
                if (map == null) continue;

                // 检查该地图是否有玩家，有玩家才广播
                if (!hasAnyPlayer(map)) continue;

                String msg = buildRankingMessage(sortedData, nf, map, mapId);
                if (msg != null) {
                    map.broadcastMessage(PacketCreator.serverNotice(5, msg));
                }
            }
        }

        // ✅ 辅助：检查地图是否有玩家
        private boolean hasAnyPlayer(MapleMap map) {
            if (map == null) return false;
            try {
                return !map.getAllPlayers().isEmpty();
            } catch (Exception e) {
                return false;
            }
        }



        // ✅ 辅助：从触发地图获取 EIM，再找其他地图
        private MapleMap getMapFromTrigger(MapleMap triggerMap, int targetMapId) {
            if (triggerMap == null) return null;

            // 如果就是触发地图本身
            if (triggerMap.getId() == targetMapId) {
                return triggerMap;
            }

            // 尝试从 EIM 获取
            try {
                EventInstanceManager eim = triggerMap.getEventInstance();
                if (eim != null) {
                    return eim.getMapInstance(targetMapId);
                }
            } catch (Exception e) {
                log.debug("无法从 EIM 获取地图 {}", targetMapId);
            }

            return null;
        }

        // ✅ 修复：buildRankingMessage 需要传入 mapId 来显示正确的进度
        private String buildRankingMessage(List<Map.Entry<Integer, Long>> sortedData,
                                           NumberFormat nf, MapleMap map, int mapId) {
            if (sortedData.isEmpty()) return null;

            StringBuilder sb = new StringBuilder();
            sb.append("【伤害统计】\r\n");

            // 根据当前地图ID显示进度
            String progress = getProgressInfo(groupId, mapId);
            if (progress != null) sb.append(progress).append("\r\n");

            int rank = 1;
            boolean hasValid = false;
            for (Map.Entry<Integer, Long> entry : sortedData) {
                Character chr = findCharacter(entry.getKey(), map);
                if (chr != null) {
                    String formattedDamage = formatDamageWithUnit(entry.getValue());
                    sb.append("  ").append(rank++).append(". ")
                            .append(chr.getName()).append(": ")
                            .append(formattedDamage).append("\r\n");
                    hasValid = true;
                }
            }

            return hasValid ? sb.toString() : null;
        }

        // 重载，保持兼容
        private String buildRankingMessage(List<Map.Entry<Integer, Long>> sortedData,
                                           NumberFormat nf, MapleMap map) {
            return buildRankingMessage(sortedData, nf, map, map.getId());
        }

        // ✅ 优化：083版本兼容的最终排名消息 - 显示所有参与者
        private String buildFinalRankingMessage(List<Map.Entry<Integer, Long>> sortedData,
                                                NumberFormat nf, MapleMap map, int groupId) {
            if (sortedData.isEmpty()) return null;

            StringBuilder sb = new StringBuilder();

            // ✅ 获取Boss名称
            String bossName = getBossName(groupId);
            if (bossName == null || bossName.isEmpty()) {
                bossName = "未知Boss";
            }

            // ✅ 获取当前时间（击杀时间）
            Calendar cal = Calendar.getInstance();
            int year = cal.get(Calendar.YEAR);
            int month = cal.get(Calendar.MONTH) + 1; // 月份从0开始
            int day = cal.get(Calendar.DAY_OF_MONTH);
            int hour = cal.get(Calendar.HOUR_OF_DAY);
            int minute = cal.get(Calendar.MINUTE);
            int second = cal.get(Calendar.SECOND);

            String killTime = String.format("%04d年%02d月%02d日 %02d:%02d:%02d",
                    year, month, day, hour, minute, second);

            // ✅ 简洁但华丽的描述
            sb.append("==============================================\r\n");
            sb.append("          【").append(bossName).append("讨伐战】\r\n");
            sb.append("==============================================\r\n");
            sb.append("击杀时间：").append(killTime).append("\r\n");
            sb.append("以下勇士在战斗中表现出色：\r\n\r\n");

            int rank = 1;
            long totalDamage = 0;
            int participantCount = damageData.size();
            long firstPlaceDamage = sortedData.isEmpty() ? 0 : sortedData.get(0).getValue();

            // ✅ 显示所有参与者的伤害排名
            for (Map.Entry<Integer, Long> entry : sortedData) {
                Character chr = findCharacter(entry.getKey(), map);
                if (chr != null) {
                    long damage = entry.getValue();
                    totalDamage += damage;
                    String formattedDamage = formatDamageWithUnit(damage);

                    // 使用简单的排名格式
                    sb.append("第").append(rank).append("名：").append(chr.getName()).append("\r\n");
                    sb.append("  伤害值：").append(formattedDamage);

                    // 添加相对于第一名的百分比
                    if (firstPlaceDamage > 0) {
                        double percentage = (damage * 100.0) / firstPlaceDamage;
                        sb.append("（相当于第1名的").append(String.format("%.1f", percentage)).append("%）");
                    }

                    // 添加占总伤害的百分比
                    if (totalDamage > 0) {
                        double totalPercentage = (damage * 100.0) / totalDamage;
                        sb.append("\r\n  贡献度：").append(String.format("%.1f", totalPercentage)).append("%");
                    }

                    sb.append("\r\n\r\n");
                    rank++;

                    // 如果排名太多，可以限制显示数量，但显示"等X人"
                    if (rank > 20) { // 最多显示20名
                        int remaining = participantCount - 20;
                        if (remaining > 0) {
                            sb.append("... 等").append(remaining).append("名勇士\r\n");
                        }
                        break;
                    }
                }
            }

            // ✅ 添加详细统计信息
            String formattedTotal = formatDamageWithUnit(totalDamage);
            sb.append("==============================================\r\n");
            sb.append("【战斗统计摘要】\r\n");
            sb.append("----------------------------------------------\r\n");
            sb.append("参与勇士：").append(participantCount).append("人\r\n");
            sb.append("总伤害量：").append(formattedTotal).append("\r\n");

            if (participantCount > 0) {
                long avgDamage = totalDamage / participantCount;
                String formattedAvg = formatDamageWithUnit(avgDamage);
                sb.append("平均伤害：").append(formattedAvg).append("\r\n");

                // 计算伤害中位数
                if (!sortedData.isEmpty()) {
                    List<Long> damageList = new ArrayList<>();
                    for (Map.Entry<Integer, Long> entry : sortedData) {
                        damageList.add(entry.getValue());
                    }
                    Collections.sort(damageList);
                    long medianDamage = damageList.get(damageList.size() / 2);
                    String formattedMedian = formatDamageWithUnit(medianDamage);
                    sb.append("中位伤害：").append(formattedMedian).append("\r\n");
                }
            }

            // ✅ 添加伤害分布信息
            if (participantCount >= 3 && !sortedData.isEmpty()) {
                sb.append("----------------------------------------------\r\n");
                sb.append("【伤害分布】\r\n");

                long top3Damage = 0;
                for (int i = 0; i < Math.min(3, sortedData.size()); i++) {
                    top3Damage += sortedData.get(i).getValue();
                }
                double top3Percentage = (top3Damage * 100.0) / totalDamage;
                sb.append("前三名伤害占比：").append(String.format("%.1f", top3Percentage)).append("%\r\n");

                if (participantCount > 3) {
                    long othersDamage = totalDamage - top3Damage;
                    double othersPercentage = (othersDamage * 100.0) / totalDamage;
                    sb.append("其他勇士伤害占比：").append(String.format("%.1f", othersPercentage)).append("%\r\n");
                }
            }

            sb.append("==============================================\r\n");

            // ✅ 添加激励语句
            sb.append(getVictoryMessage(bossName));
            sb.append("\r\n==============================================");

            return sb.toString();
        }

        // ✅ 新增：优化版的胜利消息，根据不同Boss显示不同消息
        private String getVictoryMessage(String bossName) {
            Map<String, String> messages = new HashMap<>();
            messages.put("天皇", "枫叶之城因你们的勇气而重获新生，和平的曙光再次照耀大地！");
            messages.put("暗黑龙王", "暗影终将消散，光明永驻心间！神木村的传说因你们而续写！");
            messages.put("扎昆", "火焰巨树的倒下，象征着勇气战胜了恐惧！天空之城永远铭记这一刻！");
            messages.put("武林妖僧", "千年古刹重归清净，佛光普照嵩山！正道之光永不熄灭！");
            messages.put("品克缤", "彩虹乐园恢复了往日的欢笑，疯狂的挑战终被勇者征服！");
            messages.put("帕普拉图斯", "时间的长河回归正轨，秩序的守护者名垂青史！");
            messages.put("克雷塞尔", "深渊的黑暗终被驱散，勇气的光芒照亮前路！");
            messages.put("广州黑龙", "岭南大地重归安宁，龙患的阴影彻底消散！");
            messages.put("心疤狮王与熊", "荒野的双王传说落幕，自然的平衡得以恢复！");
            messages.put("闹钟", "时光的错乱已被修正，钟楼的钟声再次准时响起！");

            return messages.getOrDefault(bossName, "勇士们的英勇事迹将被永远传颂，荣耀归于每一位参与者！");
        }

        // ✅ 新增：获取当前时间的格式化方法
        private String getFormattedKillTime() {
            Calendar cal = Calendar.getInstance();
            String[] weekDays = {"日", "一", "二", "三", "四", "五", "六"};
            int week = cal.get(Calendar.DAY_OF_WEEK) - 1;
            if (week < 0) week = 0;

            return String.format("%04d年%02d月%02d日 星期%s %02d:%02d:%02d",
                    cal.get(Calendar.YEAR),
                    cal.get(Calendar.MONTH) + 1,
                    cal.get(Calendar.DAY_OF_MONTH),
                    weekDays[week],
                    cal.get(Calendar.HOUR_OF_DAY),
                    cal.get(Calendar.MINUTE),
                    cal.get(Calendar.SECOND));
        }

        // ✅ 伤害数值格式化方法
        private String formatDamageWithUnit(long damage) {
            // 如果超过1亿，显示"X.XX亿"
            if (damage >= YI_UNIT) {
                double yiDamage = damage / (double) YI_UNIT;
                return String.format("%.2f亿", yiDamage);
            }
            // 如果超过1万，显示"X.XX万"
            else if (damage >= WAN_UNIT) {
                double wanDamage = damage / (double) WAN_UNIT;
                return String.format("%.2f万", wanDamage);
            }
            // 小于1万，直接显示数字
            else {
                return NumberFormat.getInstance().format(damage);
            }
        }

        // ✅ 获取Boss名称
        private String getBossName(int groupId) {
            return BOSS_NAMES.get(groupId);
        }

        // ✅ 查找玩家：先在当前地图，再从 EIM 其他地图找
        private Character findCharacter(int charId, MapleMap triggerMap) {
            if (triggerMap == null) return null;

            // 先查当前地图
            Character chr = triggerMap.getCharacterById(charId);
            if (chr != null) return chr;

            // 从 EIM 其他地图找
            try {
                EventInstanceManager eim = triggerMap.getEventInstance();
                if (eim != null) {
                    int[] groupMaps = getGroupMaps(groupId);
                    for (int mapId : groupMaps) {
                        MapleMap map = eim.getMapInstance(mapId);
                        if (map != null) {
                            chr = map.getCharacterById(charId);
                            if (chr != null) return chr;
                        }
                    }
                }
            } catch (Exception e) {
                // ignore
            }

            // 最后从全局找（用于显示名字，即使玩家已离开地图）
            try {
                return org.gms.net.server.Server.getInstance()
                        .getWorld(0).getChannel(1)
                        .getPlayerStorage().getCharacterById(charId);
            } catch (Exception e) {
                return null;
            }
        }

        void stop() {
            if (!enabled) return;
            enabled = false;
            if (timer != null) {
                timer.cancel(false);
                timer = null;
            }
            damageData.clear();
            log.info("副本组 {} 伤害统计已停止", groupId);
        }

        boolean isEnabled() {
            return enabled;
        }
    }

    private DamageStatisticsManager() {}

    public static DamageStatisticsManager getInstance() {
        return instance;
    }

    // ✅ 获取地图所属组ID
    private int getGroupId(int mapId) {
        return MAP_TO_GROUP.getOrDefault(mapId, mapId);
    }

    // ✅ 获取组内所有地图ID
    private int[] getGroupMaps(int groupId) {
        for (int[] group : MULTI_MAP_BOSSES) {
            if (group[0] == groupId) return group;
        }
        return new int[]{groupId};  // 单地图组
    }

    // ✅ 获取进度信息
    private String getProgressInfo(int groupId, int mapId) {
        if (groupId == 240060000) {  // 黑龙
            switch (mapId) {
                case 240060000: return "(进度: 左龙头 1/3)";
                case 240060100: return "(进度: 右龙头 2/3)";
                case 240060200: return "(进度: 暗黑龙王 3/3)";
                default: return null;
            }
        } else if (groupId == 801040100) {  // ShoWa
            switch (mapId) {
                case 801040100: return "(进度: 昭和村 1/2)";
                case 801040101: return "(进度: 昭和村内 2/2)";
                default: return null;
            }
        }
        return null;
    }

    // ✅ 获取Boss名称
    private String getBossName(int groupId) {
        return BOSS_NAMES.get(groupId);
    }

    // ==================== 公共接口 ====================

    public void enable() {
        SUPPORTED_MAP_IDS.forEach(this::enable);
        log.info("伤害统计系统已启用（全地图模式）");
    }

    public void enable(int mapId) {
        if (!SUPPORTED_MAP_IDS.contains(mapId)) {
            log.warn("地图ID {} 不受支持", mapId);
            return;
        }

        int groupId = getGroupId(mapId);
        DamageStatisticsInstance inst = instances.computeIfAbsent(groupId, DamageStatisticsInstance::new);
        inst.enable();
        log.info("副本组 {} 伤害统计已启用（触发地图: {}）", groupId, mapId);
    }

    public void recordDamage(Character attacker, int damage, int mapId) {
        if (!SUPPORTED_MAP_IDS.contains(mapId)) return;
        if (attacker == null || damage <= 0) return;

        int groupId = getGroupId(mapId);
        DamageStatisticsInstance inst = instances.computeIfAbsent(groupId, k -> {
            var newInst = new DamageStatisticsInstance(groupId);
            newInst.enable();
            return newInst;
        });

        inst.recordDamage(attacker, damage);
    }

    public void startBroadcastTimer(MapleMap map) {
        if (map == null) return;

        int mapId = map.getId();
        if (!SUPPORTED_MAP_IDS.contains(mapId)) {
            log.warn("地图ID {} 不受支持", mapId);
            return;
        }

        int groupId = getGroupId(mapId);
        DamageStatisticsInstance inst = instances.computeIfAbsent(groupId, k -> {
            var newInst = new DamageStatisticsInstance(groupId);
            newInst.enable();
            return newInst;
        });

        // 只有该组第一个进入的地图才启动定时器
        inst.startBroadcastTimer(map);
    }

    // ✅ 新增：最终伤害显示函数
    public String getFinalDamageDisplay(int mapId) {
        int groupId = getGroupId(mapId);
        DamageStatisticsInstance inst = instances.get(groupId);

        if (inst == null || !inst.enabled || inst.damageData.isEmpty()) {
            return null;
        }

        // 获取伤害数据（取前5名）
        List<Map.Entry<Integer, Long>> sortedData = inst.damageData.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(5)
                .collect(Collectors.toList());

        if (sortedData.isEmpty()) return null;

        StringBuilder sb = new StringBuilder();
        String bossName = getBossName(groupId);
        if (bossName == null) bossName = "未知Boss";

        // 简洁华丽的标题
        sb.append("<<").append(bossName).append("讨伐战 伤害之星>>\r\n");
        sb.append("英勇的冒险家们展现出非凡实力：\r\n\r\n");

        int rank = 1;
        long totalDamage = 0;
        int participantCount = inst.damageData.size();

        // 简单的排名称号
        String[] rankTitles = {"首席输出", "次席输出", "三席输出"};

        for (Map.Entry<Integer, Long> entry : sortedData) {
            // 查找玩家名字
            String playerName = "未知冒险家";
            try {
                Character chr = org.gms.net.server.Server.getInstance()
                        .getWorld(0).getChannel(1)
                        .getPlayerStorage().getCharacterById(entry.getKey());
                if (chr != null) {
                    playerName = chr.getName();
                }
            } catch (Exception e) {
                // ignore
            }

            long damage = entry.getValue();
            totalDamage += damage;
            String formattedDamage = formatDamageWithUnit(damage);

            // 使用简单的称号
            String title = (rank <= rankTitles.length) ? rankTitles[rank-1] : ("第" + rank + "名");

            sb.append(title).append("：").append(playerName).append("\r\n");
            sb.append("   伤害值：").append(formattedDamage);

            // 添加百分比
            if (totalDamage > 0) {
                double percentage = (damage * 100.0) / totalDamage;
                sb.append("（占比").append(String.format("%.1f", percentage)).append("%）");
            }

            sb.append("\r\n\r\n");
            rank++;
        }

        // 总计信息
        String formattedTotal = formatDamageWithUnit(totalDamage);
        sb.append("总计").append(participantCount).append("名勇士参与战斗");
        sb.append("，合力造成").append(formattedTotal).append("伤害！");

        // 添加鼓舞语句
        sb.append("\r\n").append(getFinalEncouragement(bossName));

        return sb.toString();
    }

    // ✅ 新增：最终鼓励语句
    private String getFinalEncouragement(String bossName) {
        Map<String, String> encouragements = new HashMap<>();
        encouragements.put("天皇", "枫叶之城为你们的胜利而欢呼！");
        encouragements.put("暗黑龙王", "暗黑龙王的传说因你们而终结！");
        encouragements.put("扎昆", "扎昆的火焰在勇士面前熄灭！");
        encouragements.put("品克缤", "彩虹岛的噩梦已被驱散！");
        encouragements.put("广州黑龙", "岭南英雄，名不虚传！");

        return encouragements.getOrDefault(bossName, "勇士们的传说将被永远铭记！");
    }

    // ✅ 新增：伤害数值格式化（公共方法）
    private String formatDamageWithUnit(long damage) {
        if (damage >= YI_UNIT) {
            double yiDamage = damage / (double) YI_UNIT;
            return String.format("%.2f亿", yiDamage);
        } else if (damage >= WAN_UNIT) {
            double wanDamage = damage / (double) WAN_UNIT;
            return String.format("%.2f万", wanDamage);
        } else {
            return NumberFormat.getInstance().format(damage);
        }
    }



    public void stop() {
        log.info("收到停止命令，各副本统计将在5分钟无伤害后自动停止");
    }

    public void stop(int mapId) {
        int groupId = getGroupId(mapId);
        DamageStatisticsInstance inst = instances.remove(groupId);
        if (inst != null) {
            inst.stop();
            log.info("副本组 {} 伤害统计已停止", groupId);
        }
    }

    public void stopAll() {
        instances.values().forEach(DamageStatisticsInstance::stop);
        instances.clear();
        log.info("所有伤害统计已停止");
    }
}