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
            }, 30000, 30000);  // 30秒广播一次

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

        void broadcastFinalRanking(MapleMap triggerMap) {
            if (!enabled || damageData.isEmpty()) return;

            NumberFormat nf = NumberFormat.getInstance();
            List<Map.Entry<Integer, Long>> sortedData = damageData.entrySet().stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .limit(10)
                    .collect(Collectors.toList());

            // ✅ 最终排名：尝试向组内所有地图广播
            int[] groupMaps = getGroupMaps(groupId);

            for (int mapId : groupMaps) {
                MapleMap map = getMapFromTrigger(triggerMap, mapId);
                if (map == null) continue;

                String msg = buildFinalRankingMessage(sortedData, nf, map);
                if (msg != null) {
                    map.broadcastMessage(PacketCreator.serverNotice(5, msg));
                }
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
                    sb.append(rank++).append(". ")
                            .append(chr.getName()).append(": ")
                            .append(nf.format(entry.getValue())).append("\r\n");
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

        private String buildFinalRankingMessage(List<Map.Entry<Integer, Long>> sortedData,
                                                NumberFormat nf, MapleMap map) {
            if (sortedData.isEmpty()) return null;

            StringBuilder sb = new StringBuilder();
            sb.append("【最终伤害排名】\r\n");

            int rank = 1;
            boolean hasValid = false;
            for (Map.Entry<Integer, Long> entry : sortedData) {
                Character chr = findCharacter(entry.getKey(), map);
                if (chr != null) {
                    sb.append(rank++).append(". ")
                            .append(chr.getName()).append(": ")
                            .append(nf.format(entry.getValue())).append("\r\n");
                    hasValid = true;
                }
            }

            return hasValid ? sb.toString() : null;
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

    public void broadcastFinalRanking(MapleMap map) {
        if (map == null) return;

        int mapId = map.getId();
        int groupId = getGroupId(mapId);

        DamageStatisticsInstance inst = instances.get(groupId);
        if (inst != null) {
            inst.broadcastFinalRanking(map);
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