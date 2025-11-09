// file: org.gms.server.maps.DamageStatisticsManager.java
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

    // 使用Zakum地图ID作为静态Key
    private static final int ZAKUM_MAP_ID = 280030000;
    private final Map<Integer, Long> damageData = new ConcurrentHashMap<>();
    private ScheduledFuture<?> timer = null;
    private boolean enabled = false;

    private DamageStatisticsManager() {}

    public static DamageStatisticsManager getInstance() {
        return instance;
    }

    public void enable() {
        if (enabled) return;
        enabled = true;
        damageData.clear();
        log.info("Zakum伤害统计已启用");
    }

    public void recordDamage(Character attacker, int damage) {
        if (!enabled || attacker == null || damage <= 0) return;

        int charId = attacker.getId();
        damageData.merge(charId, (long)damage, Long::sum);
    }

    public void startBroadcastTimer(MapleMap map) {
        if (timer != null && !timer.isCancelled()) return;

        log.info("启动Zakum伤害统计定时器");

        timer = TimerManager.getInstance().register(() -> {
            try {
                broadcastRanking(map);
            } catch (Exception e) {
                log.error("广播排名时出错", e);
            }
        }, 30000, 30000);
    }

    private void broadcastRanking(MapleMap map) {
        if (map == null || map.getId() != ZAKUM_MAP_ID) return;

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
        sb.append("#r【副本伤害统计】#k\r\n");
        int rank = 1;
        for (Map.Entry<Character, Long> entry : rankings) {
            sb.append("#b").append(rank++).append(". ")
                    .append(entry.getKey().getName()).append(": ")
                    .append(nf.format(entry.getValue())).append("#k\r\n");
        }

        map.broadcastMessage(PacketCreator.serverNotice(6, sb.toString()));
    }

    public void broadcastFinalRanking(MapleMap map) {
        if (map == null || map.getId() != ZAKUM_MAP_ID) return;

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
        sb.append("#r【最终伤害排名】#k\r\n");
        int rank = 1;
        for (Map.Entry<Character, Long> entry : rankings) {
            sb.append("#e").append(rank++).append(". ")
                    .append(entry.getKey().getName()).append(": ")
                    .append(nf.format(entry.getValue())).append("#n\r\n");
        }

        map.broadcastMessage(PacketCreator.serverNotice(0, sb.toString()));
    }

    public void stop() {
        if (!enabled) return;
        enabled = false;

        log.info("Zakum伤害统计已停止");

        if (timer != null) {
            timer.cancel(false);
            timer = null;
        }

        damageData.clear();
    }
}