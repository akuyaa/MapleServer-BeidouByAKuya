package org.gms.scripting.event;

import org.gms.net.server.channel.Channel;
import org.gms.server.expeditions.ExpeditionType;

import javax.script.Invocable;

/**
 * 妖僧远征专用管理器
 * 仅做一件事：把远征类型固定为 YAO_SENG
 */
public class TianHuangPQManager extends EventManager {

    public TianHuangPQManager(Channel cs, Invocable iv, String name) {
        super(cs, iv, name);
    }

    public ExpeditionType getExpeditionType() {
        return ExpeditionType.TIAN_HUANG;   // 关键：指向枚举
    }
}