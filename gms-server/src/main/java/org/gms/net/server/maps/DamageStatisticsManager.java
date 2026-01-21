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

    // ✅ 支持多地图
    private static final Set<Integer> SUPPORTED_MAP_IDS = Set.of(
            280030000,  // Zakum
            800040410,  // TianHuang
            220080001,  // Papulatus
            270050100,  // PinkBean
            240060000,  //Horntail
            240060100,  //Horntail
            240060200,  //Horntail
            551030200,  //Scarga
            702060000   //YaoSeng

    );

    private final Map<Integer, Long> damageData = new ConcurrentHashMap<>();
    private ScheduledFuture<?> timer = null;
    private boolean enabled = false;
    private int currentMapId = -1;

    private DamageStatisticsManager() {}

    public static DamageStatisticsManager getInstance() {
        return instance;
    }

    public void enable() {
        if (enabled) return;
        enabled = true;
        damageData.clear();
        log.info("伤害统计系统已启用"); // ✅ 不是"Zakum伤害统计"
    }

    // ✅ 接受mapId参数
    public void recordDamage(Character attacker, int damage, int mapId) {
        if (!enabled || attacker == null || damage <= 0) return;
        if (currentMapId != mapId) return;

        int charId = attacker.getId();
        damageData.merge(charId, (long)damage, Long::sum);
    }

    public void startBroadcastTimer(MapleMap map) {
        if (timer != null && !timer.isCancelled()) return;
        if (map == null) return;

        this.currentMapId = map.getId();
        if (!SUPPORTED_MAP_IDS.contains(currentMapId)) {
            log.warn("地图ID {} 不受支持", currentMapId);
            return;
        }

        log.info("启动伤害统计定时器 - 地图: {}", currentMapId);

        timer = TimerManager.getInstance().register(() -> {
            try {
                broadcastRanking(map);
            } catch (Exception e) {
                log.error("广播排名时出错", e);
            }
        }, 30000, 30000);
    }

    private void broadcastRanking(MapleMap map) {
        if (map == null || !SUPPORTED_MAP_IDS.contains(map.getId())) return;
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

    public void broadcastFinalRanking(MapleMap map) {
        if (map == null || !SUPPORTED_MAP_IDS.contains(map.getId())) return;
        if (damageData.isEmpty()) return;

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

    public void stop() {
        if (!enabled) return;
        enabled = false;
        currentMapId = -1;

        if (timer != null) {
            timer.cancel(false);
            timer = null;
        }

        damageData.clear();
        log.info("伤害统计已停止");
    }
}