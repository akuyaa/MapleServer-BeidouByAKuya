//package org.gms.server;
//
//import java.util.*;
//import java.util.concurrent.*;
//import org.gms.client.Character;
//import org.gms.client.autoban.AutobanManager;
//import org.gms.scripting.event.EventInstanceManager;
//import org.gms.server.maps.MapManager;
//import org.gms.server.maps.MapleMap;
//import org.gms.util.PacketCreator;
//
///**
// * Zakum 实时伤害排行服务（Java 层实现，无脚本定时器）
// * 线程安全，频道关闭时自动结束。
// */
//public final class ZakumRankService {
//
//    /* 每个 EIM 一份数据 */
//    private static final ConcurrentHashMap<String, ConcurrentHashMap<Integer, Long>> damageMap = new ConcurrentHashMap<>();
//
//    /* 定时器线程池（单线程，够用） */
//    private static final ScheduledExecutorService SCHEDULER = Executors.newSingleThreadScheduledExecutor(r -> {
//        Thread t = new Thread(r, "Zakum-Rank");
//        t.setDaemon(true);
//        return t;
//    });
//
//    /*  public static 方法签名改成这样  */
//    public static void start(EventInstanceManager eim) {
//        String eimName = eim.getName();
//        damageMap.put(eimName, new ConcurrentHashMap<>());
//
//        // 用 eim 拿到频道 → 线程池
//        eim.getChannelServer().getEventSM().schedule(
//                () -> broadcast(eim), 0, 30, TimeUnit.SECONDS);
//    }
//
//    public static void add(EventInstanceManager eim, Character chr, long dmg) {
//        String eimName = eim.getName();
//        ConcurrentHashMap<Integer, Long> map = damageMap.get(eimName);
//        if (map != null) {
//            map.merge(chr.getId(), dmg, Long::sum);
//        }
//    }
//
//    public static void stop(EventInstanceManager eim) {
//        broadcast(eim);                      // 最终榜
//        damageMap.remove(eim.getName());     // 释放内存
//    }
//
//    private static void broadcast(EventInstanceManager eim) {
//        String eimName = eim.getName();
//        ConcurrentHashMap<Integer, Long> map = damageMap.get(eimName);
//        if (map == null || map.isEmpty()) return;
//
//        List<Map.Entry<Integer, Long>> list = new ArrayList<>(map.entrySet());
//        list.sort((a, b) -> Long.compare(b.getValue(), a.getValue()));
//
//        StringBuilder sb = new StringBuilder("================ 伤害排行 ================\r\n");
//        int rank = 0;
//        for (Map.Entry<Integer, Long> e : list) {
//            Character p = eim.getChannelServer()
//                    .getPlayerStorage()
//                    .getCharacterById(e.getKey());
//            if (p != null && p.isLoggedInWorld()) {
//                sb.append(++rank).append(". ")
//                        .append(p.getName()).append(" —— ")
//                        .append(String.format("%,d", e.getValue())).append("\r\n");
//            }
//        }
//        sb.append("==========================================");
//
//        MapleMap eventMap = eim.getChannelServer().getMapFactory().getMap(280030000);
//        eventMap.broadcastMessage(PacketCreator.yellowChat(sb.toString()));
//    }
//}