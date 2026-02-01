package org.gms.net.server.task;

import org.gms.client.Character;
import org.gms.net.server.Server;
import org.gms.net.server.channel.Channel;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class OnlineTimeTask implements Runnable {
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Override
    public void run() {
        if (!Server.getInstance().isOnline()) {
            return;
        }

        LocalDate now = LocalDate.now();
        String todayStr = now.format(DATE_FORMAT);

        for (final Channel chan : Server.getInstance().getAllChannels()) {
            if (chan == null || chan.getPlayerStorage() == null) {
                continue;
            }

            for (final Character chr : chan.getPlayerStorage().getAllCharacters()) {
                if (chr == null) {
                    continue;
                }

                String playerDate = chr.getAbstractPlayerInteraction().getAccountExtendValue("每日在线时间_日期", true);
                int currentOnlineTime = chr.getCurrentOnlineTime();

                // 判断是否跨天
                boolean isNewDay = (playerDate == null) || !playerDate.equals(todayStr);

                if (isNewDay) {
                    // ========== 情况1：跨天了（或首次玩），重置所有数据 ==========
                    currentOnlineTime = 0;

                    // 保存新日期
                    chr.getAbstractPlayerInteraction().saveOrUpdateAccountExtendValue("每日在线时间_日期", todayStr, true);
                    // 重置在线时间
                    chr.getAbstractPlayerInteraction().saveOrUpdateAccountExtendValue("每日在线时间", "0", true);
                    // 关键：重置领取状态！
                    chr.getAbstractPlayerInteraction().saveOrUpdateAccountExtendValue("每日在线奖励领取状态", "0", true);

                } else if (currentOnlineTime == -1) {
                    // 玩家刚登录/重上（非跨天），恢复今日数据
                    String timeStr = chr.getAbstractPlayerInteraction().getAccountExtendValue("每日在线时间", true);
                    try {
                        currentOnlineTime = (timeStr == null) ? 0 : Integer.parseInt(timeStr);
                    } catch (NumberFormatException e) {
                        currentOnlineTime = 0;
                    }

                    // 关键修复：如果数据库里是-1（脏数据），强制重置为0
                    if (currentOnlineTime < 0) {
                        currentOnlineTime = 0;
                        // 立即保存，把数据库里的-1覆盖掉，防止下次还读到-1
                        chr.getAbstractPlayerInteraction().saveOrUpdateAccountExtendValue("每日在线时间", "0", true);
                    }

                    chr.setCurrentOnlineTime(currentOnlineTime);
                }else {
                    // ========== 情况3：正常在线，累加时间 ==========
                    currentOnlineTime += 5;

                    // 每30秒保存一次到数据库（减少IO）
                    if (currentOnlineTime % 30 == 0) {
                        chr.getAbstractPlayerInteraction().saveOrUpdateAccountExtendValue("每日在线时间", String.valueOf(currentOnlineTime), true);
                    }
                }

                chr.setCurrentOnlineTime(currentOnlineTime);
            }
        }
    }
}