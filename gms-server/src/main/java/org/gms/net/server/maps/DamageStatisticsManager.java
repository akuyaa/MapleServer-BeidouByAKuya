package org.gms.server.maps;

import org.gms.client.Character;
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

    // 支持的地图ID
    private static final Set<Integer> SUPPORTED_MAP_IDS = Set.of(
            280030000,  // Zakum
            800040410,  // TianHuang
            220080001,  // Papulatus
            270050100,  // PinkBean
            240060000, 240060100, 240060200,  // Horntail
            551030200,  // Scarga
            702060000,  // YaoSeng
            801040100, 801040101   // ShoWa
    );

    // 多实例管理：每个地图一个统计实例
    private final Map<Integer, DamageStatisticsInstance> instances = new ConcurrentHashMap<>();

    // 内部类：每个地图的独立统计
    private static class DamageStatisticsInstance {
        private final Map<Integer, Long> damageData = new ConcurrentHashMap<>();
        private ScheduledFuture<?> timer = null;
        private boolean enabled = false;
        private final int mapId;

        DamageStatisticsInstance(int mapId) {
            this.mapId = mapId;
        }

        void enable() {
            if (enabled) return;
            enabled = true;
            damageData.clear();
        }

        void recordDamage(Character attacker, int damage) {
            if (!enabled || attacker == null || damage <= 0) return;
            int charId = attacker.getId();
            damageData.merge(charId, (long)damage, Long::sum);
        }

        void startBroadcastTimer(MapleMap map) {
            if (timer != null && !timer.isCancelled()) {
                // 如果定时器已存在且未取消，先取消再重启（防止复用旧定时器）
                timer.cancel(false);
            }

            timer = TimerManager.getInstance().register(() -> {
                try {
                    broadcastRanking(map);
                } catch (Exception e) {
                    log.error("地图 {} 广播排名时出错", mapId, e);
                }
            }, 30000, 30000);
        }

        void broadcastRanking(MapleMap map) {
            if (map == null) return;

            // ✅ 关键修复：检查是否还有活跃玩家（有伤害记录且仍在地图中）
            boolean hasActivePlayer = damageData.keySet().stream()
                    .anyMatch(charId -> map.getCharacterById(charId) != null);

            if (!hasActivePlayer) {
                log.info("地图 {} 中没有活跃玩家，自动停止伤害统计", mapId);
                stop();
                return;
            }

            if (damageData.isEmpty()) return;

            NumberFormat nf = NumberFormat.getInstance();
            List<Map.Entry<Character, Long>> rankings = damageData.entrySet().stream()
                    .map(entry -> {
                        Character chr = map.getCharacterById(entry.getKey());
                        return chr != null ? new AbstractMap.SimpleEntry<>(chr, entry.getValue()) : null;
                    })
                    .filter(Objects::nonNull)
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .limit(5)
                    .collect(Collectors.toList());

            if (rankings.isEmpty()) return;

            StringBuilder sb = new StringBuilder();
            sb.append("#b【伤害统计】\r\n");
            int rank = 1;
            for (Map.Entry<Character, Long> entry : rankings) {
                sb.append("#b").append(rank++).append(". ")
                        .append(entry.getKey().getName()).append(": ")
                        .append(nf.format(entry.getValue())).append("\r\n");
            }

            map.broadcastMessage(PacketCreator.serverNotice(5, sb.toString()));
        }

        void broadcastFinalRanking(MapleMap map) {
            if (map == null || damageData.isEmpty()) return;

            NumberFormat nf = NumberFormat.getInstance();
            List<Map.Entry<Character, Long>> rankings = damageData.entrySet().stream()
                    .map(entry -> {
                        Character chr = map.getCharacterById(entry.getKey());
                        return chr != null ? new AbstractMap.SimpleEntry<>(chr, entry.getValue()) : null;
                    })
                    .filter(Objects::nonNull)
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .limit(10)
                    .collect(Collectors.toList());

            if (rankings.isEmpty()) return;

            StringBuilder sb = new StringBuilder();
            sb.append("#b【最终伤害排名】\r\n");
            int rank = 1;
            for (Map.Entry<Character, Long> entry : rankings) {
                sb.append("#b").append(rank++).append(". ")
                        .append(entry.getKey().getName()).append(": ")
                        .append(nf.format(entry.getValue())).append("\r\n");
            }

            map.broadcastMessage(PacketCreator.serverNotice(5, sb.toString()));
        }

        void stop() {
            if (!enabled) return;
            enabled = false;

            if (timer != null) {
                timer.cancel(false);
                timer = null;
            }

            damageData.clear();
            log.info("地图 {} 伤害统计已停止", mapId);
        }

        boolean isEnabled() {
            return enabled;
        }
    }

    private DamageStatisticsManager() {}

    public static DamageStatisticsManager getInstance() {
        return instance;
    }

    // 向后兼容：无参enable，启用所有支持的地图
    public void enable() {
        SUPPORTED_MAP_IDS.forEach(mapId -> {
            DamageStatisticsInstance inst = instances.computeIfAbsent(mapId, DamageStatisticsInstance::new);
            inst.enable();
        });
        log.info("伤害统计系统已启用（全地图模式）");
    }

    // 新增：指定地图启用
    public void enable(int mapId) {
        if (!SUPPORTED_MAP_IDS.contains(mapId)) {
            log.warn("地图ID {} 不受支持", mapId);
            return;
        }

        DamageStatisticsInstance inst = instances.computeIfAbsent(mapId, DamageStatisticsInstance::new);
        inst.enable();
        log.info("地图 {} 伤害统计已启用", mapId);
    }

    public void recordDamage(Character attacker, int damage, int mapId) {
        // ✅ 移除 globalEnabled 检查，只要有实例或支持该地图就记录
        if (!SUPPORTED_MAP_IDS.contains(mapId)) return;

        // 懒加载：如果该地图还没有实例，自动创建（兼容旧脚本无参enable的情况）
        DamageStatisticsInstance inst = instances.computeIfAbsent(mapId, DamageStatisticsInstance::new);
        inst.recordDamage(attacker, damage);
    }

    public void startBroadcastTimer(MapleMap map) {
        if (map == null) return;

        int mapId = map.getId();
        if (!SUPPORTED_MAP_IDS.contains(mapId)) {
            log.warn("地图ID {} 不受支持", mapId);
            return;
        }

        DamageStatisticsInstance inst = instances.computeIfAbsent(mapId, DamageStatisticsInstance::new);
        if (!inst.isEnabled()) {
            inst.enable();
        }
        inst.startBroadcastTimer(map);
        log.info("启动伤害统计定时器 - 地图: {}", mapId);
    }

    public void broadcastFinalRanking(MapleMap map) {
        if (map == null) return;

        int mapId = map.getId();
        DamageStatisticsInstance inst = instances.get(mapId);
        if (inst != null) {
            inst.broadcastFinalRanking(map);
        }
    }

    // ✅ 关键修复：stop() 不再停止所有实例，只清空管理器引用
    // 实际的定时器会在检测不到玩家时自行停止
    public void stop() {
        // 不再遍历停止所有实例，避免互相干扰
        // 实例会在 broadcastRanking 检测到无玩家时自动清理
        log.info("收到停止命令，已改为自动管理模式，各地图统计将在玩家离开后自动停止");
    }

    // 新增：指定地图停止（供未来使用）
    public void stop(int mapId) {
        DamageStatisticsInstance inst = instances.remove(mapId);
        if (inst != null) {
            inst.stop();
            log.info("地图 {} 伤害统计已停止", mapId);
        }
    }

    // 停止所有统计（关服时用）
    public void stopAll() {
        instances.values().forEach(DamageStatisticsInstance::stop);
        instances.clear();
    }
}