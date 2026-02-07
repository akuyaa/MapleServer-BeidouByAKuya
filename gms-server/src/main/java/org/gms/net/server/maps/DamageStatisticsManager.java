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

    // ✅ 多实例管理：Key = 频道ID + ":" + BOSS组ID，确保不同频道隔离
    private final Map<String, DamageStatisticsInstance> instances = new ConcurrentHashMap<>();

    // 内部类
    private class DamageStatisticsInstance {
        private final Map<Integer, Long> damageData = new ConcurrentHashMap<>();
        private ScheduledFuture<?> timer = null;
        private boolean enabled = false;
        private final int groupId;
        private final int channelId;
        private long lastDamageTime = 0;
        private long fightStartTime = 0;
        private boolean fightStarted = false;
        private long fightDuration = 0;
        // ✅ 存储EIM引用，用于获取组内所有地图实例
        private EventInstanceManager eventInstance = null;

        DamageStatisticsInstance(int groupId, int channelId) {
            this.groupId = groupId;
            this.channelId = channelId;
        }

        void enable() {
            if (enabled) return;
            enabled = true;
            damageData.clear();
            lastDamageTime = System.currentTimeMillis();
            fightStartTime = System.currentTimeMillis();
            fightStarted = true;
            fightDuration = 0;
            log.info("副本组 {} 频道 {} 伤害统计已启用，开始计时", groupId, channelId);
        }

        void recordDamage(Character attacker, int damage) {
            if (!enabled || attacker == null || damage <= 0) return;
            int charId = attacker.getId();
            damageData.merge(charId, (long)damage, Long::sum);
            lastDamageTime = System.currentTimeMillis();
        }

        // ✅ 修改：启动定时器时存储EIM引用
        void startBroadcastTimer(MapleMap map) {
            if (map == null) return;

            // 存储EIM引用，用于后续获取组内所有地图
            if (this.eventInstance == null) {
                try {
                    this.eventInstance = map.getEventInstance();
                    log.info("副本组 {} 频道 {} 绑定EIM引用: {}", groupId, channelId,
                            this.eventInstance != null ? "成功" : "失败(无EIM)");
                } catch (Exception e) {
                    log.warn("副本组 {} 频道 {} 获取EIM失败: {}", groupId, channelId, e.getMessage());
                }
            }

            // 如果定时器已存在，直接返回
            if (timer != null && !timer.isCancelled()) {
                log.debug("副本组 {} 频道 {} 定时器已在运行", groupId, channelId);
                return;
            }

            // ✅ 创建定时器，直接向组内所有地图广播
            timer = TimerManager.getInstance().register(() -> {
                try {
                    broadcastRankingToGroup();
                } catch (Exception e) {
                    log.error("副本组 {} 频道 {} 广播排名时出错", groupId, channelId, e);
                }
            }, 20000, 20000);  // 20秒广播一次

            log.info("启动伤害统计定时器 - 副本组: {} 频道: {} (触发地图: {})", groupId, channelId, map.getId());
        }

        // ✅ 新方法：向组内所有地图广播（通过EIM获取地图实例）
        void broadcastRankingToGroup() {
            if (!enabled) return;
            if (damageData.isEmpty()) return;

            // 5分钟无伤害检查
            if (System.currentTimeMillis() - lastDamageTime > 5 * 60 * 1000) {
                log.info("副本组 {} 频道 {} 超过5分钟无伤害，自动停止", groupId, channelId);
                stop();
                return;
            }

            NumberFormat nf = NumberFormat.getInstance();
            List<Map.Entry<Integer, Long>> sortedData = damageData.entrySet().stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .limit(10)
                    .collect(Collectors.toList());

            if (sortedData.isEmpty()) return;

            // ✅ 获取组内所有地图ID
            int[] groupMaps = getGroupMaps(groupId);

            // ✅ 通过EIM获取每个地图的实例并广播
            for (int mapId : groupMaps) {
                try {
                    MapleMap targetMap = getMapInstance(mapId);
                    if (targetMap == null) continue;

                    // 检查该地图是否有玩家
                    if (!hasAnyPlayer(targetMap)) {
                        log.debug("副本组 {} 频道 {} 地图 {} 无玩家，跳过广播", groupId, channelId, mapId);
                        continue;
                    }

                    String msg = buildRankingMessage(sortedData, nf, targetMap, mapId);
                    if (msg != null) {
                        targetMap.broadcastMessage(PacketCreator.serverNotice(5, msg));
                        log.debug("副本组 {} 频道 {} 已向地图 {} 广播伤害排名", groupId, channelId, mapId);
                    }
                } catch (Exception e) {
                    log.error("副本组 {} 频道 {} 向地图 {} 广播失败: {}", groupId, channelId, mapId, e.getMessage());
                }
            }
        }

        // ✅ 辅助：获取地图实例（优先通过EIM，失败则尝试其他方式）
        private MapleMap getMapInstance(int mapId) {
            // 优先通过EIM获取
            if (eventInstance != null) {
                try {
                    MapleMap map = eventInstance.getMapInstance(mapId);
                    if (map != null) return map;
                } catch (Exception e) {
                    log.debug("通过EIM获取地图 {} 失败: {}", mapId, e.getMessage());
                }
            }

            // 如果EIM获取失败，尝试从channel获取
            try {
                var channel = org.gms.net.server.Server.getInstance().getWorld(0).getChannel(channelId);
                if (channel != null) {
                    return channel.getMapFactory().getMap(mapId);
                }
            } catch (Exception e) {
                log.debug("通过频道 {} 获取地图 {} 失败: {}", channelId, mapId, e.getMessage());
            }
            return null;
        }

        // ✅ 保留旧方法用于兼容
        void broadcastRanking(MapleMap triggerMap) {
            broadcastRankingToGroup();
        }

        // ✅ 修改：广播最终排名时存储战斗耗时（不停止实例）
        public void broadcastFinalRanking(MapleMap triggerMap) {
            if (!enabled) return;

            if (fightStarted) {
                fightDuration = (System.currentTimeMillis() - fightStartTime) / 1000;
                String durationStr = formatDuration(fightDuration);
                fightStarted = false;
                log.info("副本组 {} 频道 {} 战斗结束，最终耗时: {}", groupId, channelId, durationStr);
            } else {
                log.info("副本组 {} 频道 {} 战斗结束，但战斗未开始记录", groupId, channelId);
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

        // ✅ 伤害数值格式化方法
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

        // ✅ 格式化耗时
        private String formatDuration(long seconds) {
            if (seconds < 60) {
                return seconds + "秒";
            } else if (seconds < 3600) {
                long minutes = seconds / 60;
                long remainingSeconds = seconds % 60;
                if (remainingSeconds > 0) {
                    return minutes + "分" + remainingSeconds + "秒";
                } else {
                    return minutes + "分钟";
                }
            } else {
                long hours = seconds / 3600;
                long minutes = (seconds % 3600) / 60;
                if (minutes > 0) {
                    return hours + "小时" + minutes + "分";
                } else {
                    return hours + "小时";
                }
            }
        }

        // ✅ 查找玩家：先在当前地图，再从 EIM 其他地图找
        private Character findCharacter(int charId, MapleMap triggerMap) {
            if (triggerMap == null) return null;

            // 先查当前地图
            Character chr = triggerMap.getCharacterById(charId);
            if (chr != null) return chr;

            // 从 EIM 其他地图找
            try {
                if (eventInstance != null) {
                    int[] groupMaps = getGroupMaps(groupId);
                    for (int mid : groupMaps) {
                        MapleMap m = eventInstance.getMapInstance(mid);
                        if (m != null) {
                            chr = m.getCharacterById(charId);
                            if (chr != null) return chr;
                        }
                    }
                }
            } catch (Exception e) {
                // ignore
            }

            // 最后从全局找（用于显示名字，即使玩家已离开地图）
            try {
                var channel = org.gms.net.server.Server.getInstance().getWorld(0).getChannel(channelId);
                if (channel != null) {
                    return channel.getPlayerStorage().getCharacterById(charId);
                }
            } catch (Exception e) {
                // ignore
            }
            return null;
        }

        void stop() {
            if (!enabled) return;
            enabled = false;
            if (timer != null) {
                timer.cancel(false);
                timer = null;
            }
            damageData.clear();
            eventInstance = null; // ✅ 清理EIM引用
            fightStarted = false;
            log.info("副本组 {} 频道 {} 伤害统计已停止", groupId, channelId);
        }

        boolean isEnabled() {
            return enabled;
        }

        int getChannelId() {
            return channelId;
        }

        long getFightDuration() {
            return fightDuration;
        }

        Map<Integer, Long> getDamageData() {
            return new HashMap<>(damageData);
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

    // ✅ 生成实例Key
    private String getKey(int channelId, int groupId) {
        return channelId + ":" + groupId;
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

    // ✅ 保留：enable方法（供JS调用）
    public void enable(int mapId) {
        if (!SUPPORTED_MAP_IDS.contains(mapId)) {
            log.warn("地图ID {} 不受支持", mapId);
            return;
        }

        int groupId = getGroupId(mapId);

        // 获取地图所在的频道
        int channelId = 1; // 默认频道1
        try {
            for (int ch = 1; ch <= 6; ch++) {
                var channel = org.gms.net.server.Server.getInstance().getWorld(0).getChannel(ch);
                if (channel == null) continue;

                var map = channel.getMapFactory().getMap(mapId);
                if (map != null) {
                    // 找到这个地图了
                    channelId = ch;
                    break;
                }
            }
        } catch (Exception e) {
            log.warn("获取地图 {} 频道失败，使用默认频道1: {}", mapId, e.getMessage());
        }

        final int finalChannelId = channelId;
        final int finalGroupId = groupId;
        String key = getKey(channelId, groupId);
        DamageStatisticsInstance inst = instances.computeIfAbsent(key, k -> new DamageStatisticsInstance(finalGroupId, finalChannelId));
        inst.enable();
        log.info("副本组 {} 频道 {} 伤害统计已启用（触发地图: {}）", groupId, channelId, mapId);
    }

    // ✅ 新增：双参数enable（频道ID + 地图ID）
    public void enable(int channelId, int mapId) {
        if (!SUPPORTED_MAP_IDS.contains(mapId)) {
            log.warn("地图ID {} 不受支持", mapId);
            return;
        }

        int groupId = getGroupId(mapId);
        final int finalChannelId = channelId;
        final int finalGroupId = groupId;
        String key = getKey(channelId, groupId);
        DamageStatisticsInstance inst = instances.computeIfAbsent(key, k -> new DamageStatisticsInstance(finalGroupId, finalChannelId));
        inst.enable();
        log.info("副本组 {} 频道 {} 伤害统计已启用（触发地图: {}）", groupId, channelId, mapId);
    }

    public void recordDamage(Character attacker, int damage, int mapId) {
        if (!SUPPORTED_MAP_IDS.contains(mapId)) return;
        if (attacker == null || damage <= 0) return;

        int groupId = getGroupId(mapId);

        // 获取玩家所在频道
        int channelId = 1;
        try {
            if (attacker.getClient() != null) {
                channelId = attacker.getClient().getChannel();
            }
        } catch (Exception e) {
            // ignore
        }

        final int finalChannelId = channelId;
        final int finalGroupId = groupId;
        String key = getKey(channelId, groupId);
        DamageStatisticsInstance inst = instances.computeIfAbsent(key, k -> {
            var newInst = new DamageStatisticsInstance(finalGroupId, finalChannelId);
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
        int channelId = map.getChannelServer().getId();

        final int finalChannelId = channelId;
        final int finalGroupId = groupId;
        String key = getKey(channelId, groupId);
        DamageStatisticsInstance inst = instances.computeIfAbsent(key, k -> {
            var newInst = new DamageStatisticsInstance(finalGroupId, finalChannelId);
            newInst.enable();
            return newInst;
        });

        inst.startBroadcastTimer(map);
    }

    // ✅ 修改：broadcastFinalRanking 只结算，不停止实例
    public void broadcastFinalRanking(MapleMap map) {
        if (map == null) return;

        int mapId = map.getId();
        int groupId = getGroupId(mapId);
        int channelId = map.getChannelServer().getId();
        String key = getKey(channelId, groupId);

        DamageStatisticsInstance inst = instances.get(key);
        if (inst != null) {
            inst.broadcastFinalRanking(map);
            log.info("副本组 {} 频道 {} 已结算（实例未停止）", groupId, channelId);
        } else {
            log.warn("结算时未找到副本组 {} 频道 {} 的实例", groupId, channelId);
        }
    }

    // ✅ 新增：最终伤害显示函数（实例停止后也能获取数据）
    public String getFinalDamageDisplay(int mapId) {
        int groupId = getGroupId(mapId);

        // 遍历所有频道找这个groupId的实例
        for (int ch = 1; ch <= 6; ch++) {
            String key = getKey(ch, groupId);
            DamageStatisticsInstance inst = instances.get(key);

            if (inst != null) {
                return buildFinalDisplay(inst, groupId);
            }
        }
        return null;
    }

    private String buildFinalDisplay(DamageStatisticsInstance inst, int groupId) {
        // 从实例获取数据（即使已停止也能获取）
        Map<Integer, Long> damageData = inst.getDamageData();
        if (damageData.isEmpty()) return null;

        List<Map.Entry<Integer, Long>> sortedData = damageData.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();
        String bossName = getBossName(groupId);
        if (bossName == null) bossName = "未知Boss";

        long fightDuration = inst.getFightDuration();
        String durationStr = fightDuration > 0 ? formatDuration(fightDuration) : "未知";

        sb.append("【").append(bossName).append("伤害统计】\r\n");
        sb.append("战斗耗时：").append(durationStr).append("\r\n");

        int rank = 1;
        long totalDamage = 0;
        int displayLimit = Math.min(10, sortedData.size());

        for (int i = 0; i < displayLimit; i++) {
            Map.Entry<Integer, Long> entry = sortedData.get(i);
            String playerName = "未知冒险家";
            try {
                int channelId = inst.getChannelId();
                var channel = org.gms.net.server.Server.getInstance().getWorld(0).getChannel(channelId);
                if (channel != null) {
                    Character chr = channel.getPlayerStorage().getCharacterById(entry.getKey());
                    if (chr != null) {
                        playerName = chr.getName();
                    }
                }
            } catch (Exception e) {
                // ignore
            }

            long damage = entry.getValue();
            totalDamage += damage;
            String formattedDamage = formatDamageWithUnit(damage);

            sb.append("  ").append(rank++).append(". ")
                    .append(playerName).append(": ")
                    .append(formattedDamage).append("\r\n");
        }

        for (int i = displayLimit; i < sortedData.size(); i++) {
            totalDamage += sortedData.get(i).getValue();
        }

        if (sortedData.size() > displayLimit) {
            int remainingPlayers = sortedData.size() - displayLimit;
            sb.append("... 等").append(remainingPlayers).append("名勇士\r\n");
        }

        return sb.toString();
    }

    private String formatDuration(long seconds) {
        if (seconds < 60) {
            return seconds + "秒";
        } else if (seconds < 3600) {
            long minutes = seconds / 60;
            long remainingSeconds = seconds % 60;
            if (remainingSeconds > 0) {
                return minutes + "分" + remainingSeconds + "秒";
            } else {
                return minutes + "分钟";
            }
        } else {
            long hours = seconds / 3600;
            long minutes = (seconds % 3600) / 60;
            if (minutes > 0) {
                return hours + "小时" + minutes + "分";
            } else {
                return hours + "小时";
            }
        }
    }

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

    // ✅ 修改：stop方法带mapId和channelId参数，精确关闭
    public void stop(int mapId, int channelId) {
        int groupId = getGroupId(mapId);
        String key = getKey(channelId, groupId);

        // 检查是否是多地图副本
        int[] groupMaps = getGroupMaps(groupId);
        if (groupMaps.length > 1) {
            // 多地图副本：关闭该频道下所有相关地图的实例
            log.info("副本组 {} 是多地图副本，关闭频道 {} 下所有地图实例", groupId, channelId);
            for (int relatedMapId : groupMaps) {
                String relatedKey = getKey(channelId, getGroupId(relatedMapId));
                DamageStatisticsInstance inst = instances.remove(relatedKey);
                if (inst != null) {
                    inst.stop();
                    log.info("副本组 {} 频道 {} 地图 {} 伤害统计已停止", groupId, channelId, relatedMapId);
                }
            }
        } else {
            // 单地图副本：只关闭指定地图
            DamageStatisticsInstance inst = instances.remove(key);
            if (inst != null) {
                inst.stop();
                log.info("副本组 {} 频道 {} 伤害统计已停止", groupId, channelId);
            } else {
                log.warn("停止时未找到副本组 {} 频道 {} 的实例", groupId, channelId);
            }
        }
    }

    // ✅ 保留：单参数stop（兼容旧代码，停止所有频道的该groupId）
    public void stop(int mapId) {
        int groupId = getGroupId(mapId);

        // 停止所有频道的这个groupId
        for (int ch = 1; ch <= 6; ch++) {
            String key = getKey(ch, groupId);
            DamageStatisticsInstance inst = instances.remove(key);
            if (inst != null) {
                inst.stop();
                log.info("副本组 {} 频道 {} 伤害统计已停止", groupId, ch);
            }
        }
    }

    public void stopAll() {
        instances.values().forEach(DamageStatisticsInstance::stop);
        instances.clear();
        log.info("所有伤害统计已停止");
    }
}