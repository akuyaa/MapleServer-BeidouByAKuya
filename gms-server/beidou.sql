/*
Navicat MySQL Data Transfer

Source Server         : local
Source Server Version : 80039
Source Host           : localhost:3306
Source Database       : beidou

Target Server Type    : MYSQL
Target Server Version : 80039
File Encoding         : 65001

Date: 2026-02-11 19:27:12
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for accounts
-- ----------------------------
DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(13) NOT NULL DEFAULT '',
  `password` varchar(128) NOT NULL DEFAULT '',
  `pin` varchar(10) NOT NULL DEFAULT '',
  `pic` varchar(26) NOT NULL DEFAULT '',
  `loggedin` tinyint NOT NULL DEFAULT '0',
  `lastlogin` timestamp NULL DEFAULT NULL,
  `createdat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `birthday` date NOT NULL DEFAULT '2005-05-11',
  `banned` tinyint(1) NOT NULL DEFAULT '0',
  `banreason` text,
  `macs` tinytext,
  `nxCredit` int DEFAULT NULL,
  `maplePoint` int DEFAULT NULL,
  `nxPrepaid` int DEFAULT NULL,
  `characterslots` tinyint NOT NULL DEFAULT '3',
  `gender` tinyint NOT NULL DEFAULT '10',
  `tempban` timestamp NOT NULL DEFAULT '2005-05-11 00:00:00',
  `greason` tinyint NOT NULL DEFAULT '0',
  `tos` tinyint(1) NOT NULL DEFAULT '0',
  `sitelogged` text,
  `webadmin` int DEFAULT '0',
  `nick` varchar(20) DEFAULT NULL,
  `mute` int DEFAULT '0',
  `email` varchar(45) DEFAULT NULL,
  `ip` text,
  `last_login_ip` varchar(45) DEFAULT NULL COMMENT '上一次登录IP',
  `rewardpoints` int NOT NULL DEFAULT '0',
  `votepoints` int NOT NULL DEFAULT '0',
  `hwid` varchar(12) NOT NULL DEFAULT '',
  `language` int NOT NULL DEFAULT '3',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `ranking1` (`id`,`banned`),
  KEY `id` (`id`,`name`),
  KEY `id_2` (`id`,`nxCredit`,`maplePoint`,`nxPrepaid`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for alliance
-- ----------------------------
DROP TABLE IF EXISTS `alliance`;
CREATE TABLE `alliance` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(13) NOT NULL,
  `capacity` int unsigned NOT NULL DEFAULT '2',
  `notice` varchar(20) NOT NULL DEFAULT '',
  `rank1` varchar(11) NOT NULL DEFAULT 'Master',
  `rank2` varchar(11) NOT NULL DEFAULT 'Jr. Master',
  `rank3` varchar(11) NOT NULL DEFAULT 'Member',
  `rank4` varchar(11) NOT NULL DEFAULT 'Member',
  `rank5` varchar(11) NOT NULL DEFAULT 'Member',
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for allianceguilds
-- ----------------------------
DROP TABLE IF EXISTS `allianceguilds`;
CREATE TABLE `allianceguilds` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `allianceid` int NOT NULL DEFAULT '-1',
  `guildid` int NOT NULL DEFAULT '-1',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1499 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for area_info
-- ----------------------------
DROP TABLE IF EXISTS `area_info`;
CREATE TABLE `area_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `charid` int NOT NULL,
  `area` int NOT NULL,
  `info` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1185 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for bbs_replies
-- ----------------------------
DROP TABLE IF EXISTS `bbs_replies`;
CREATE TABLE `bbs_replies` (
  `replyid` int unsigned NOT NULL AUTO_INCREMENT,
  `threadid` int unsigned NOT NULL,
  `postercid` int unsigned NOT NULL,
  `TIMESTAMP` bigint unsigned NOT NULL,
  `content` varchar(26) NOT NULL DEFAULT '',
  PRIMARY KEY (`replyid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for bbs_threads
-- ----------------------------
DROP TABLE IF EXISTS `bbs_threads`;
CREATE TABLE `bbs_threads` (
  `threadid` int unsigned NOT NULL AUTO_INCREMENT,
  `postercid` int unsigned NOT NULL,
  `name` varchar(26) NOT NULL DEFAULT '',
  `TIMESTAMP` bigint unsigned NOT NULL,
  `icon` smallint unsigned NOT NULL,
  `replycount` smallint unsigned NOT NULL DEFAULT '0',
  `startpost` text NOT NULL,
  `guildid` int unsigned NOT NULL,
  `localthreadid` int unsigned NOT NULL,
  PRIMARY KEY (`threadid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for bosslog_daily
-- ----------------------------
DROP TABLE IF EXISTS `bosslog_daily`;
CREATE TABLE `bosslog_daily` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL,
  `bosstype` enum('ZAKUM','HORNTAIL','PINKBEAN','SCARGA','YAO_SENG','TIAN_HUANG','BALROG','BALROG_NORMAL','SHOWA','KREXEL','PAPULATUS') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `attempttime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=298 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for bosslog_daily_copy
-- ----------------------------
DROP TABLE IF EXISTS `bosslog_daily_copy`;
CREATE TABLE `bosslog_daily_copy` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL,
  `bosstype` enum('ZAKUM','HORNTAIL','PINKBEAN','SCARGA','PAPULATUS') NOT NULL,
  `attempttime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for bosslog_weekly
-- ----------------------------
DROP TABLE IF EXISTS `bosslog_weekly`;
CREATE TABLE `bosslog_weekly` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL,
  `bosstype` enum('ZAKUM','HORNTAIL','PINKBEAN','SCARGA','PAPULATUS') NOT NULL,
  `attempttime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for buddies
-- ----------------------------
DROP TABLE IF EXISTS `buddies`;
CREATE TABLE `buddies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL,
  `buddyid` int NOT NULL,
  `pending` tinyint NOT NULL DEFAULT '0',
  `group` varchar(17) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9634 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for characterexplogs
-- ----------------------------
DROP TABLE IF EXISTS `characterexplogs`;
CREATE TABLE `characterexplogs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `world_exp_rate` float DEFAULT NULL COMMENT '大区倍率',
  `exp_coupon` int DEFAULT NULL,
  `gained_exp` bigint DEFAULT NULL,
  `current_exp` bigint DEFAULT NULL,
  `exp_gain_time` timestamp NULL DEFAULT NULL,
  `charid` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for characters
-- ----------------------------
DROP TABLE IF EXISTS `characters`;
CREATE TABLE `characters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `accountid` int NOT NULL DEFAULT '0',
  `world` int NOT NULL DEFAULT '0',
  `name` varchar(13) NOT NULL DEFAULT '',
  `level` int NOT NULL DEFAULT '1',
  `exp` int NOT NULL DEFAULT '0',
  `gachaexp` int NOT NULL DEFAULT '0',
  `str` int NOT NULL DEFAULT '12',
  `dex` int NOT NULL DEFAULT '5',
  `luk` int NOT NULL DEFAULT '4',
  `int` int NOT NULL DEFAULT '4',
  `hp` int NOT NULL DEFAULT '50',
  `mp` int NOT NULL DEFAULT '5',
  `maxhp` int NOT NULL DEFAULT '50',
  `maxmp` int NOT NULL DEFAULT '5',
  `meso` int NOT NULL DEFAULT '0',
  `hpMpUsed` int unsigned NOT NULL DEFAULT '0',
  `job` int NOT NULL DEFAULT '0',
  `skincolor` int NOT NULL DEFAULT '0',
  `gender` int NOT NULL DEFAULT '0',
  `fame` int NOT NULL DEFAULT '0',
  `fquest` int NOT NULL DEFAULT '0',
  `hair` int NOT NULL DEFAULT '0',
  `face` int NOT NULL DEFAULT '0',
  `ap` int NOT NULL DEFAULT '0',
  `sp` varchar(128) NOT NULL DEFAULT '0,0,0,0,0,0,0,0,0,0',
  `map` int NOT NULL DEFAULT '0',
  `spawnpoint` int NOT NULL DEFAULT '0',
  `gm` tinyint(1) NOT NULL DEFAULT '0',
  `party` int NOT NULL DEFAULT '0',
  `buddyCapacity` int NOT NULL DEFAULT '25',
  `createdate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `rank` int unsigned NOT NULL DEFAULT '1',
  `rankMove` int NOT NULL DEFAULT '0',
  `jobRank` int unsigned NOT NULL DEFAULT '1',
  `jobRankMove` int NOT NULL DEFAULT '0',
  `guildid` int unsigned NOT NULL DEFAULT '0',
  `guildrank` int unsigned NOT NULL DEFAULT '5',
  `messengerid` int unsigned NOT NULL DEFAULT '0',
  `messengerposition` int unsigned NOT NULL DEFAULT '4',
  `mountlevel` int NOT NULL DEFAULT '1',
  `mountexp` int NOT NULL DEFAULT '0',
  `mounttiredness` int NOT NULL DEFAULT '0',
  `omokwins` int NOT NULL DEFAULT '0',
  `omoklosses` int NOT NULL DEFAULT '0',
  `omokties` int NOT NULL DEFAULT '0',
  `matchcardwins` int NOT NULL DEFAULT '0',
  `matchcardlosses` int NOT NULL DEFAULT '0',
  `matchcardties` int NOT NULL DEFAULT '0',
  `MerchantMesos` int DEFAULT '0',
  `HasMerchant` tinyint(1) DEFAULT '0',
  `equipslots` int NOT NULL DEFAULT '24',
  `useslots` int NOT NULL DEFAULT '24',
  `setupslots` int NOT NULL DEFAULT '24',
  `etcslots` int NOT NULL DEFAULT '24',
  `familyId` int NOT NULL DEFAULT '-1',
  `monsterbookcover` int NOT NULL DEFAULT '0',
  `allianceRank` int NOT NULL DEFAULT '5',
  `vanquisherStage` int unsigned NOT NULL DEFAULT '0',
  `ariantPoints` int unsigned NOT NULL DEFAULT '0',
  `dojoPoints` int unsigned NOT NULL DEFAULT '0',
  `lastDojoStage` int unsigned NOT NULL DEFAULT '0',
  `finishedDojoTutorial` tinyint unsigned NOT NULL DEFAULT '0',
  `vanquisherKills` int unsigned NOT NULL DEFAULT '0',
  `summonValue` int unsigned NOT NULL DEFAULT '0',
  `partnerId` int NOT NULL DEFAULT '0',
  `marriageItemId` int NOT NULL DEFAULT '0',
  `reborns` int NOT NULL DEFAULT '0',
  `PQPoints` int NOT NULL DEFAULT '0',
  `dataString` varchar(64) NOT NULL DEFAULT '',
  `lastLogoutTime` timestamp NOT NULL DEFAULT '2015-01-01 05:00:00',
  `lastExpGainTime` timestamp NOT NULL DEFAULT '2015-01-01 05:00:00',
  `partySearch` tinyint(1) NOT NULL DEFAULT '1',
  `jailexpire` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `accountid` (`accountid`),
  KEY `party` (`party`),
  KEY `ranking1` (`level`,`exp`),
  KEY `ranking2` (`gm`,`job`),
  KEY `id` (`id`,`accountid`,`world`),
  KEY `id_2` (`id`,`accountid`,`name`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci PACK_KEYS=0;

-- ----------------------------
-- Table structure for command_info
-- ----------------------------
DROP TABLE IF EXISTS `command_info`;
CREATE TABLE `command_info` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `syntax` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '指令',
  `level` int NOT NULL COMMENT '指令等级0-6',
  `enabled` tinyint(1) unsigned zerofill NOT NULL DEFAULT '1' COMMENT '0不启用 1启用',
  `clazz` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '指令对应后端java类名',
  `default_level` int NOT NULL COMMENT '默认指令等级0-6（该字段不可被修改）',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=180 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for cooldowns
-- ----------------------------
DROP TABLE IF EXISTS `cooldowns`;
CREATE TABLE `cooldowns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `charid` int NOT NULL,
  `SkillID` int NOT NULL,
  `length` bigint unsigned NOT NULL,
  `StartTime` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for drop_data
-- ----------------------------
DROP TABLE IF EXISTS `drop_data`;
CREATE TABLE `drop_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dropperid` int NOT NULL,
  `itemid` int NOT NULL DEFAULT '0',
  `minimum_quantity` int NOT NULL DEFAULT '1',
  `maximum_quantity` int NOT NULL DEFAULT '1',
  `questid` int NOT NULL DEFAULT '0',
  `chance` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `dropperid` (`dropperid`,`itemid`),
  KEY `mobid` (`dropperid`),
  KEY `dropperid_2` (`dropperid`,`itemid`)
) ENGINE=MyISAM AUTO_INCREMENT=26245 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for drop_data_global
-- ----------------------------
DROP TABLE IF EXISTS `drop_data_global`;
CREATE TABLE `drop_data_global` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `continent` tinyint(1) NOT NULL DEFAULT '-1',
  `itemid` int NOT NULL DEFAULT '0',
  `minimum_quantity` int NOT NULL DEFAULT '1',
  `maximum_quantity` int NOT NULL DEFAULT '1',
  `questid` int NOT NULL DEFAULT '0',
  `chance` int NOT NULL DEFAULT '0',
  `comments` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mobid` (`continent`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for dueyitems
-- ----------------------------
DROP TABLE IF EXISTS `dueyitems`;
CREATE TABLE `dueyitems` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `PackageId` int unsigned NOT NULL DEFAULT '0',
  `inventoryitemid` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `INVENTORYITEMID` (`inventoryitemid`),
  KEY `PackageId` (`PackageId`),
  CONSTRAINT `dueyitems_ibfk_1` FOREIGN KEY (`PackageId`) REFERENCES `dueypackages` (`PackageId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for dueypackages
-- ----------------------------
DROP TABLE IF EXISTS `dueypackages`;
CREATE TABLE `dueypackages` (
  `PackageId` int unsigned NOT NULL AUTO_INCREMENT,
  `ReceiverId` int unsigned NOT NULL,
  `SenderName` varchar(13) NOT NULL,
  `Mesos` int unsigned DEFAULT '0',
  `TIMESTAMP` timestamp NOT NULL DEFAULT '2015-01-01 05:00:00',
  `Message` varchar(200) DEFAULT NULL,
  `Checked` tinyint unsigned DEFAULT '1',
  `Type` tinyint unsigned DEFAULT '0',
  PRIMARY KEY (`PackageId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for eventstats
-- ----------------------------
DROP TABLE IF EXISTS `eventstats`;
CREATE TABLE `eventstats` (
  `characterid` int unsigned NOT NULL,
  `name` varchar(11) NOT NULL DEFAULT '0' COMMENT '0',
  `info` int NOT NULL,
  PRIMARY KEY (`characterid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for extend_value
-- ----------------------------
DROP TABLE IF EXISTS `extend_value`;
CREATE TABLE `extend_value` (
  `extend_id` varchar(50) NOT NULL COMMENT '扩展字段id',
  `extend_type` int NOT NULL COMMENT '扩展字段类型，11-账号，12-账号日清，13-账号周清；21-角色，22-角色日清，23-角色周清',
  `extend_name` varchar(50) NOT NULL COMMENT '扩展字段名称',
  `extend_value` varchar(255) DEFAULT NULL COMMENT '扩展字段值',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`extend_id`,`extend_type`,`extend_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='扩展字段表';

-- ----------------------------
-- Table structure for famelog
-- ----------------------------
DROP TABLE IF EXISTS `famelog`;
CREATE TABLE `famelog` (
  `famelogid` int NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL DEFAULT '0',
  `characterid_to` int NOT NULL DEFAULT '0',
  `when` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`famelogid`),
  KEY `characterid` (`characterid`),
  CONSTRAINT `famelog_ibfk_1` FOREIGN KEY (`characterid`) REFERENCES `characters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for family_character
-- ----------------------------
DROP TABLE IF EXISTS `family_character`;
CREATE TABLE `family_character` (
  `cid` int NOT NULL,
  `familyid` int NOT NULL,
  `seniorid` int NOT NULL,
  `reputation` int NOT NULL DEFAULT '0',
  `todaysrep` int NOT NULL DEFAULT '0',
  `totalreputation` int NOT NULL DEFAULT '0',
  `reptosenior` int NOT NULL DEFAULT '0',
  `precepts` varchar(200) DEFAULT NULL,
  `lastresettime` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`cid`),
  KEY `cid` (`cid`,`familyid`),
  CONSTRAINT `family_character_ibfk_1` FOREIGN KEY (`cid`) REFERENCES `characters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for family_entitlement
-- ----------------------------
DROP TABLE IF EXISTS `family_entitlement`;
CREATE TABLE `family_entitlement` (
  `id` int NOT NULL AUTO_INCREMENT,
  `charid` int NOT NULL,
  `entitlementid` int NOT NULL,
  `TIMESTAMP` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `charid` (`charid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for flyway_schema_history
-- ----------------------------
DROP TABLE IF EXISTS `flyway_schema_history`;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `script` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for fredstorage
-- ----------------------------
DROP TABLE IF EXISTS `fredstorage`;
CREATE TABLE `fredstorage` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `cid` int unsigned NOT NULL,
  `daynotes` int unsigned NOT NULL,
  `TIMESTAMP` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cid_2` (`cid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for gachapon
-- ----------------------------
DROP TABLE IF EXISTS `gachapon`;
CREATE TABLE `gachapon` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `gachaponId` int DEFAULT NULL COMMENT '转蛋机ID',
  `itemId` int DEFAULT NULL COMMENT '道具ID',
  `stack` int DEFAULT '1' COMMENT '数量',
  `probability` decimal(5,4) DEFAULT NULL COMMENT '概率',
  `createDate` datetime DEFAULT NULL COMMENT '创建时间',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1625 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for gachapon_reward
-- ----------------------------
DROP TABLE IF EXISTS `gachapon_reward`;
CREATE TABLE `gachapon_reward` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `pool_id` int NOT NULL COMMENT '绑定奖池ID',
  `item_id` int NOT NULL COMMENT '道具ID',
  `quantity` int NOT NULL DEFAULT '1' COMMENT '单次抽取数量',
  `create_time` datetime DEFAULT NULL COMMENT '创建日期',
  `comment` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2184 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for gachapon_reward_pool
-- ----------------------------
DROP TABLE IF EXISTS `gachapon_reward_pool`;
CREATE TABLE `gachapon_reward_pool` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `name` varchar(35) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '转蛋机奖池名称',
  `gachapon_id` int NOT NULL COMMENT '绑定转蛋机ID',
  `weight` int NOT NULL COMMENT '权重',
  `is_public` tinyint(1) unsigned zerofill NOT NULL DEFAULT '0' COMMENT '是否公共奖池 0为否 1为是',
  `prob` int NOT NULL DEFAULT '0' COMMENT '概率',
  `start_time` datetime NOT NULL COMMENT '奖池的启用日期',
  `end_time` datetime DEFAULT NULL COMMENT '奖池的结束日期',
  `notification` tinyint(1) unsigned zerofill NOT NULL DEFAULT '0' COMMENT '是否喇叭通知 0为否 1为是',
  `comment` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for game_config
-- ----------------------------
DROP TABLE IF EXISTS `game_config`;
CREATE TABLE `game_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `config_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '参数类型',
  `config_sub_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '参数子类型',
  `config_clazz` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '参数值java类型',
  `config_code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '参数名',
  `config_value` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '参数值',
  `config_desc` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '参数描述，中英文，关联i18n表lang_resources',
  `update_time` timestamp NULL DEFAULT NULL COMMENT '最后更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=239 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='游戏参数表';

-- ----------------------------
-- Table structure for gifts
-- ----------------------------
DROP TABLE IF EXISTS `gifts`;
CREATE TABLE `gifts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `to` int NOT NULL,
  `from` varchar(13) NOT NULL,
  `message` tinytext NOT NULL,
  `sn` int unsigned NOT NULL,
  `ringid` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for guilds
-- ----------------------------
DROP TABLE IF EXISTS `guilds`;
CREATE TABLE `guilds` (
  `guildid` int unsigned NOT NULL AUTO_INCREMENT,
  `leader` int unsigned NOT NULL DEFAULT '0',
  `GP` int unsigned NOT NULL DEFAULT '0',
  `logo` int unsigned DEFAULT NULL,
  `logoColor` smallint unsigned NOT NULL DEFAULT '0',
  `name` varchar(45) NOT NULL,
  `rank1title` varchar(45) NOT NULL DEFAULT 'Master',
  `rank2title` varchar(45) NOT NULL DEFAULT 'Jr. Master',
  `rank3title` varchar(45) NOT NULL DEFAULT 'Member',
  `rank4title` varchar(45) NOT NULL DEFAULT 'Member',
  `rank5title` varchar(45) NOT NULL DEFAULT 'Member',
  `capacity` int unsigned NOT NULL DEFAULT '10',
  `logoBG` int unsigned DEFAULT NULL,
  `logoBGColor` smallint unsigned NOT NULL DEFAULT '0',
  `notice` varchar(101) DEFAULT NULL,
  `signature` int NOT NULL DEFAULT '0',
  `allianceId` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`guildid`),
  KEY `guildid` (`guildid`,`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for hp_mp_alert
-- ----------------------------
DROP TABLE IF EXISTS `hp_mp_alert`;
CREATE TABLE `hp_mp_alert` (
  `id` int NOT NULL AUTO_INCREMENT,
  `c_id` int unsigned NOT NULL,
  `hp` tinyint unsigned NOT NULL DEFAULT '10',
  `mp` tinyint unsigned NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`),
  UNIQUE KEY `c_id` (`c_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for hwidaccounts
-- ----------------------------
DROP TABLE IF EXISTS `hwidaccounts`;
CREATE TABLE `hwidaccounts` (
  `accountid` int NOT NULL DEFAULT '0',
  `hwid` varchar(40) NOT NULL DEFAULT '',
  `relevance` tinyint NOT NULL DEFAULT '0',
  `expiresat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`accountid`,`hwid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for hwidbans
-- ----------------------------
DROP TABLE IF EXISTS `hwidbans`;
CREATE TABLE `hwidbans` (
  `hwidbanid` int unsigned NOT NULL AUTO_INCREMENT,
  `hwid` varchar(30) NOT NULL,
  PRIMARY KEY (`hwidbanid`),
  UNIQUE KEY `hwid_2` (`hwid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for inventoryequipment
-- ----------------------------
DROP TABLE IF EXISTS `inventoryequipment`;
CREATE TABLE `inventoryequipment` (
  `inventoryequipmentid` int unsigned NOT NULL AUTO_INCREMENT,
  `inventoryitemid` int unsigned NOT NULL DEFAULT '0',
  `upgradeslots` int NOT NULL DEFAULT '0',
  `level` int NOT NULL DEFAULT '0',
  `str` int NOT NULL DEFAULT '0',
  `dex` int NOT NULL DEFAULT '0',
  `int` int NOT NULL DEFAULT '0',
  `luk` int NOT NULL DEFAULT '0',
  `hp` int NOT NULL DEFAULT '0',
  `mp` int NOT NULL DEFAULT '0',
  `watk` int NOT NULL DEFAULT '0',
  `matk` int NOT NULL DEFAULT '0',
  `wdef` int NOT NULL DEFAULT '0',
  `mdef` int NOT NULL DEFAULT '0',
  `acc` int NOT NULL DEFAULT '0',
  `avoid` int NOT NULL DEFAULT '0',
  `hands` int NOT NULL DEFAULT '0',
  `speed` int NOT NULL DEFAULT '0',
  `jump` int NOT NULL DEFAULT '0',
  `locked` int NOT NULL DEFAULT '0',
  `vicious` int unsigned NOT NULL DEFAULT '0',
  `itemlevel` int NOT NULL DEFAULT '1',
  `itemexp` int unsigned NOT NULL DEFAULT '0',
  `ringid` int NOT NULL DEFAULT '-1',
  PRIMARY KEY (`inventoryequipmentid`),
  KEY `INVENTORYITEMID` (`inventoryitemid`)
) ENGINE=InnoDB AUTO_INCREMENT=254809 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for inventoryitems
-- ----------------------------
DROP TABLE IF EXISTS `inventoryitems`;
CREATE TABLE `inventoryitems` (
  `inventoryitemid` int unsigned NOT NULL AUTO_INCREMENT,
  `type` tinyint unsigned NOT NULL,
  `characterid` int DEFAULT NULL,
  `accountid` int DEFAULT NULL,
  `itemid` int NOT NULL DEFAULT '0',
  `inventorytype` int NOT NULL DEFAULT '0',
  `position` int NOT NULL DEFAULT '0',
  `quantity` int NOT NULL DEFAULT '0',
  `owner` tinytext NOT NULL,
  `petid` int NOT NULL DEFAULT '-1',
  `flag` int NOT NULL,
  `expiration` bigint NOT NULL DEFAULT '-1',
  `giftFrom` varchar(26) NOT NULL,
  PRIMARY KEY (`inventoryitemid`),
  KEY `CHARID` (`characterid`)
) ENGINE=InnoDB AUTO_INCREMENT=818835 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for inventorymerchant
-- ----------------------------
DROP TABLE IF EXISTS `inventorymerchant`;
CREATE TABLE `inventorymerchant` (
  `inventorymerchantid` int unsigned NOT NULL AUTO_INCREMENT,
  `inventoryitemid` int unsigned NOT NULL DEFAULT '0',
  `characterid` int DEFAULT NULL,
  `bundles` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`inventorymerchantid`),
  KEY `INVENTORYITEMID` (`inventoryitemid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for ipbans
-- ----------------------------
DROP TABLE IF EXISTS `ipbans`;
CREATE TABLE `ipbans` (
  `ipbanid` int unsigned NOT NULL AUTO_INCREMENT,
  `ip` varchar(40) NOT NULL DEFAULT '',
  `aid` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`ipbanid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for keymap
-- ----------------------------
DROP TABLE IF EXISTS `keymap`;
CREATE TABLE `keymap` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL DEFAULT '0',
  `key` int NOT NULL DEFAULT '0',
  `type` int NOT NULL DEFAULT '0',
  `action` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=222926 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for lang_resources
-- ----------------------------
DROP TABLE IF EXISTS `lang_resources`;
CREATE TABLE `lang_resources` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `lang_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '语言类型，zh-CN，en-US',
  `lang_base` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '预留，当存在2个一样的code，不一样的value，需要用base来区分',
  `lang_code` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'i18n编码',
  `lang_value` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'i18n值',
  `lang_extend` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '预留扩展字段',
  PRIMARY KEY (`id`),
  KEY `idx_lang_code` (`lang_code`)
) ENGINE=InnoDB AUTO_INCREMENT=521 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='数据库i18n表';

-- ----------------------------
-- Table structure for macbans
-- ----------------------------
DROP TABLE IF EXISTS `macbans`;
CREATE TABLE `macbans` (
  `macbanid` int unsigned NOT NULL AUTO_INCREMENT,
  `mac` varchar(30) NOT NULL,
  `aid` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`macbanid`),
  UNIQUE KEY `mac_2` (`mac`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for macfilters
-- ----------------------------
DROP TABLE IF EXISTS `macfilters`;
CREATE TABLE `macfilters` (
  `macfilterid` int unsigned NOT NULL AUTO_INCREMENT,
  `filter` varchar(30) NOT NULL,
  PRIMARY KEY (`macfilterid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for makercreatedata
-- ----------------------------
DROP TABLE IF EXISTS `makercreatedata`;
CREATE TABLE `makercreatedata` (
  `id` tinyint unsigned NOT NULL,
  `itemid` int NOT NULL,
  `req_level` tinyint unsigned NOT NULL,
  `req_maker_level` tinyint unsigned NOT NULL,
  `req_meso` int NOT NULL,
  `req_item` int NOT NULL,
  `req_equip` int NOT NULL,
  `catalyst` int NOT NULL,
  `quantity` smallint NOT NULL,
  `tuc` tinyint NOT NULL,
  PRIMARY KEY (`id`,`itemid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for makerreagentdata
-- ----------------------------
DROP TABLE IF EXISTS `makerreagentdata`;
CREATE TABLE `makerreagentdata` (
  `itemid` int NOT NULL,
  `stat` varchar(20) NOT NULL,
  `value` smallint NOT NULL,
  PRIMARY KEY (`itemid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for makerrecipedata
-- ----------------------------
DROP TABLE IF EXISTS `makerrecipedata`;
CREATE TABLE `makerrecipedata` (
  `itemid` int NOT NULL,
  `req_item` int NOT NULL,
  `count` smallint NOT NULL,
  PRIMARY KEY (`itemid`,`req_item`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for makerrewarddata
-- ----------------------------
DROP TABLE IF EXISTS `makerrewarddata`;
CREATE TABLE `makerrewarddata` (
  `itemid` int NOT NULL,
  `rewardid` int NOT NULL,
  `quantity` smallint NOT NULL,
  `prob` tinyint unsigned NOT NULL DEFAULT '100',
  PRIMARY KEY (`itemid`,`rewardid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for marriages
-- ----------------------------
DROP TABLE IF EXISTS `marriages`;
CREATE TABLE `marriages` (
  `marriageid` int unsigned NOT NULL AUTO_INCREMENT,
  `husbandid` int unsigned NOT NULL DEFAULT '0',
  `wifeid` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`marriageid`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for medalmaps
-- ----------------------------
DROP TABLE IF EXISTS `medalmaps`;
CREATE TABLE `medalmaps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL,
  `queststatusid` int unsigned NOT NULL,
  `mapid` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `queststatusid` (`queststatusid`)
) ENGINE=InnoDB AUTO_INCREMENT=132282 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for modified_cash_item
-- ----------------------------
DROP TABLE IF EXISTS `modified_cash_item`;
CREATE TABLE `modified_cash_item` (
  `sn` int NOT NULL COMMENT 'sn码',
  `item_id` int DEFAULT NULL COMMENT '物品id',
  `count` int DEFAULT NULL COMMENT '数量',
  `price` int DEFAULT NULL COMMENT '价格',
  `bonus` int DEFAULT NULL COMMENT '属性奖励',
  `priority` int DEFAULT NULL COMMENT '优先级',
  `period` bigint DEFAULT NULL COMMENT '有效期',
  `maple_point` int DEFAULT NULL COMMENT '抵用券',
  `meso` int DEFAULT NULL COMMENT '金币',
  `for_premium_user` int DEFAULT NULL COMMENT '高级用户',
  `commodity_gender` int DEFAULT NULL COMMENT '性别',
  `on_sale` int DEFAULT NULL COMMENT '是否销售',
  `class` int DEFAULT NULL,
  `limit` int DEFAULT NULL,
  `pb_cash` int DEFAULT NULL,
  `pb_point` int DEFAULT NULL,
  `pb_gift` int DEFAULT NULL,
  `package_sn` int DEFAULT NULL COMMENT '礼包SN',
  PRIMARY KEY (`sn`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='商城物品修改表';

-- ----------------------------
-- Table structure for monsterbook
-- ----------------------------
DROP TABLE IF EXISTS `monsterbook`;
CREATE TABLE `monsterbook` (
  `charid` int NOT NULL,
  `cardid` int NOT NULL,
  `level` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`charid`,`cardid`),
  CONSTRAINT `FK_monsterbook_characters` FOREIGN KEY (`charid`) REFERENCES `characters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for monstercarddata
-- ----------------------------
DROP TABLE IF EXISTS `monstercarddata`;
CREATE TABLE `monstercarddata` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cardid` int NOT NULL DEFAULT '0',
  `mobid` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=344 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for mts_cart
-- ----------------------------
DROP TABLE IF EXISTS `mts_cart`;
CREATE TABLE `mts_cart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cid` int NOT NULL,
  `itemid` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for mts_items
-- ----------------------------
DROP TABLE IF EXISTS `mts_items`;
CREATE TABLE `mts_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tab` int NOT NULL DEFAULT '0',
  `type` int NOT NULL DEFAULT '0',
  `itemid` int unsigned NOT NULL DEFAULT '0',
  `quantity` int NOT NULL DEFAULT '1',
  `seller` int NOT NULL DEFAULT '0',
  `price` int NOT NULL DEFAULT '0',
  `bid_incre` int DEFAULT '0',
  `buy_now` int DEFAULT '0',
  `position` int DEFAULT '0',
  `upgradeslots` int DEFAULT '0',
  `level` int DEFAULT '0',
  `itemlevel` int NOT NULL DEFAULT '1',
  `itemexp` int unsigned NOT NULL DEFAULT '0',
  `ringid` int NOT NULL DEFAULT '-1',
  `str` int DEFAULT '0',
  `dex` int DEFAULT '0',
  `int` int DEFAULT '0',
  `luk` int DEFAULT '0',
  `hp` int DEFAULT '0',
  `mp` int DEFAULT '0',
  `watk` int DEFAULT '0',
  `matk` int DEFAULT '0',
  `wdef` int DEFAULT '0',
  `mdef` int DEFAULT '0',
  `acc` int DEFAULT '0',
  `avoid` int DEFAULT '0',
  `hands` int DEFAULT '0',
  `speed` int DEFAULT '0',
  `jump` int DEFAULT '0',
  `locked` int DEFAULT '0',
  `isequip` int DEFAULT '0',
  `owner` varchar(16) DEFAULT '',
  `sellername` varchar(16) NOT NULL,
  `sell_ends` varchar(16) NOT NULL,
  `transfer` int DEFAULT '0',
  `vicious` int unsigned NOT NULL DEFAULT '0',
  `flag` int unsigned NOT NULL DEFAULT '0',
  `expiration` bigint NOT NULL DEFAULT '-1',
  `giftFrom` varchar(26) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for namechanges
-- ----------------------------
DROP TABLE IF EXISTS `namechanges`;
CREATE TABLE `namechanges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL,
  `old` varchar(13) NOT NULL,
  `new` varchar(13) NOT NULL,
  `requestTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completionTime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `characterid` (`characterid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for newyear
-- ----------------------------
DROP TABLE IF EXISTS `newyear`;
CREATE TABLE `newyear` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `senderid` int NOT NULL DEFAULT '-1',
  `sendername` varchar(13) DEFAULT '',
  `receiverid` int NOT NULL DEFAULT '-1',
  `receivername` varchar(13) DEFAULT '',
  `message` varchar(120) DEFAULT '',
  `senderdiscard` tinyint(1) NOT NULL DEFAULT '0',
  `receiverdiscard` tinyint(1) NOT NULL DEFAULT '0',
  `received` tinyint(1) NOT NULL DEFAULT '0',
  `timesent` bigint unsigned NOT NULL,
  `timereceived` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for notes
-- ----------------------------
DROP TABLE IF EXISTS `notes`;
CREATE TABLE `notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `to` varchar(13) NOT NULL DEFAULT '',
  `from` varchar(13) NOT NULL DEFAULT '',
  `message` text NOT NULL,
  `TIMESTAMP` bigint unsigned NOT NULL,
  `fame` int NOT NULL DEFAULT '0',
  `deleted` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for nxcode
-- ----------------------------
DROP TABLE IF EXISTS `nxcode`;
CREATE TABLE `nxcode` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(17) NOT NULL,
  `retriever` varchar(13) DEFAULT NULL,
  `expiration` bigint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for nxcode_items
-- ----------------------------
DROP TABLE IF EXISTS `nxcode_items`;
CREATE TABLE `nxcode_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codeid` int NOT NULL,
  `type` int NOT NULL DEFAULT '5',
  `item` int NOT NULL DEFAULT '4000000',
  `quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for nxcoupons
-- ----------------------------
DROP TABLE IF EXISTS `nxcoupons`;
CREATE TABLE `nxcoupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `couponid` int NOT NULL DEFAULT '0',
  `rate` int NOT NULL DEFAULT '0',
  `activeday` int NOT NULL DEFAULT '0',
  `starthour` int NOT NULL DEFAULT '0',
  `endhour` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for petignores
-- ----------------------------
DROP TABLE IF EXISTS `petignores`;
CREATE TABLE `petignores` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `petid` int unsigned NOT NULL,
  `itemid` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_petignorepetid` (`petid`),
  CONSTRAINT `fk_petignorepetid` FOREIGN KEY (`petid`) REFERENCES `pets` (`petid`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1719 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for pets
-- ----------------------------
DROP TABLE IF EXISTS `pets`;
CREATE TABLE `pets` (
  `petid` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(13) DEFAULT NULL,
  `level` int unsigned NOT NULL,
  `closeness` int unsigned NOT NULL,
  `fullness` int unsigned NOT NULL,
  `summoned` tinyint(1) NOT NULL DEFAULT '0',
  `flag` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`petid`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for playerdiseases
-- ----------------------------
DROP TABLE IF EXISTS `playerdiseases`;
CREATE TABLE `playerdiseases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `charid` int NOT NULL,
  `disease` int NOT NULL,
  `mobskillid` int NOT NULL,
  `mobskilllv` int NOT NULL,
  `length` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for playernpcs
-- ----------------------------
DROP TABLE IF EXISTS `playernpcs`;
CREATE TABLE `playernpcs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(13) NOT NULL,
  `hair` int NOT NULL,
  `face` int NOT NULL,
  `skin` int NOT NULL,
  `gender` int NOT NULL DEFAULT '0',
  `x` int NOT NULL,
  `cy` int NOT NULL DEFAULT '0',
  `world` int NOT NULL DEFAULT '0',
  `map` int NOT NULL DEFAULT '0',
  `dir` int NOT NULL DEFAULT '0',
  `scriptid` int unsigned NOT NULL DEFAULT '0',
  `fh` int NOT NULL DEFAULT '0',
  `rx0` int NOT NULL DEFAULT '0',
  `rx1` int NOT NULL DEFAULT '0',
  `worldrank` int NOT NULL DEFAULT '0',
  `overallrank` int NOT NULL DEFAULT '0',
  `worldjobrank` int NOT NULL DEFAULT '0',
  `job` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2147000000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for playernpcs_equip
-- ----------------------------
DROP TABLE IF EXISTS `playernpcs_equip`;
CREATE TABLE `playernpcs_equip` (
  `id` int NOT NULL AUTO_INCREMENT,
  `npcid` int NOT NULL DEFAULT '0',
  `equipid` int NOT NULL,
  `type` int NOT NULL DEFAULT '0',
  `equippos` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for playernpcs_field
-- ----------------------------
DROP TABLE IF EXISTS `playernpcs_field`;
CREATE TABLE `playernpcs_field` (
  `id` int NOT NULL AUTO_INCREMENT,
  `world` int NOT NULL,
  `map` int NOT NULL,
  `step` tinyint(1) NOT NULL DEFAULT '0',
  `podium` smallint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for plife
-- ----------------------------
DROP TABLE IF EXISTS `plife`;
CREATE TABLE `plife` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `world` int NOT NULL DEFAULT '-1',
  `map` int NOT NULL DEFAULT '0',
  `life` int NOT NULL DEFAULT '0',
  `type` varchar(1) NOT NULL DEFAULT 'n',
  `cy` int NOT NULL DEFAULT '0',
  `f` int NOT NULL DEFAULT '0',
  `fh` int NOT NULL DEFAULT '0',
  `rx0` int NOT NULL DEFAULT '0',
  `rx1` int NOT NULL DEFAULT '0',
  `x` int NOT NULL DEFAULT '0',
  `y` int NOT NULL DEFAULT '0',
  `hide` int NOT NULL DEFAULT '0',
  `mobtime` int NOT NULL DEFAULT '0',
  `team` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for questactions
-- ----------------------------
DROP TABLE IF EXISTS `questactions`;
CREATE TABLE `questactions` (
  `questactionid` int unsigned NOT NULL AUTO_INCREMENT,
  `questid` int NOT NULL DEFAULT '0',
  `status` int NOT NULL DEFAULT '0',
  `data` blob NOT NULL,
  PRIMARY KEY (`questactionid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for questprogress
-- ----------------------------
DROP TABLE IF EXISTS `questprogress`;
CREATE TABLE `questprogress` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL,
  `queststatusid` int unsigned NOT NULL DEFAULT '0',
  `progressid` int NOT NULL DEFAULT '0',
  `progress` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=84464 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for questrequirements
-- ----------------------------
DROP TABLE IF EXISTS `questrequirements`;
CREATE TABLE `questrequirements` (
  `questrequirementid` int unsigned NOT NULL AUTO_INCREMENT,
  `questid` int NOT NULL DEFAULT '0',
  `status` int NOT NULL DEFAULT '0',
  `data` blob NOT NULL,
  PRIMARY KEY (`questrequirementid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for queststatus
-- ----------------------------
DROP TABLE IF EXISTS `queststatus`;
CREATE TABLE `queststatus` (
  `queststatusid` int unsigned NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL DEFAULT '0',
  `quest` int NOT NULL DEFAULT '0',
  `status` int NOT NULL DEFAULT '0',
  `time` int NOT NULL DEFAULT '0',
  `expires` bigint NOT NULL DEFAULT '0',
  `forfeited` int NOT NULL DEFAULT '0',
  `completed` int NOT NULL DEFAULT '0',
  `info` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`queststatusid`)
) ENGINE=InnoDB AUTO_INCREMENT=1152640 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for quickslotkeymapped
-- ----------------------------
DROP TABLE IF EXISTS `quickslotkeymapped`;
CREATE TABLE `quickslotkeymapped` (
  `accountid` int NOT NULL,
  `keymap` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`accountid`),
  CONSTRAINT `quickslotkeymapped_accountid_fk` FOREIGN KEY (`accountid`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for reactordrops
-- ----------------------------
DROP TABLE IF EXISTS `reactordrops`;
CREATE TABLE `reactordrops` (
  `reactordropid` int unsigned NOT NULL AUTO_INCREMENT,
  `reactorid` int NOT NULL,
  `itemid` int NOT NULL,
  `chance` int NOT NULL,
  `questid` int NOT NULL DEFAULT '-1',
  PRIMARY KEY (`reactordropid`),
  KEY `reactorid` (`reactorid`)
) ENGINE=InnoDB AUTO_INCREMENT=1535 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci PACK_KEYS=1;

-- ----------------------------
-- Table structure for reports
-- ----------------------------
DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `reporttime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reporterid` int NOT NULL,
  `victimid` int NOT NULL,
  `reason` tinyint NOT NULL,
  `chatlog` text NOT NULL,
  `description` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for responses
-- ----------------------------
DROP TABLE IF EXISTS `responses`;
CREATE TABLE `responses` (
  `chat` text,
  `response` text,
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for rings
-- ----------------------------
DROP TABLE IF EXISTS `rings`;
CREATE TABLE `rings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `partnerRingId` int NOT NULL DEFAULT '0',
  `partnerChrId` int NOT NULL DEFAULT '0',
  `itemid` int NOT NULL DEFAULT '0',
  `partnername` varchar(255) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for savedlocations
-- ----------------------------
DROP TABLE IF EXISTS `savedlocations`;
CREATE TABLE `savedlocations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL,
  `locationtype` enum('FREE_MARKET','WORLDTOUR','FLORINA','INTRO','SUNDAY_MARKET','MIRROR','EVENT','BOSSPQ','HAPPYVILLE','DEVELOPER','MONSTER_CARNIVAL','JAIL') NOT NULL,
  `map` int NOT NULL,
  `portal` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50068 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for server_prop
-- ----------------------------
DROP TABLE IF EXISTS `server_prop`;
CREATE TABLE `server_prop` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '配置id',
  `prop_type` int DEFAULT NULL COMMENT '配置分类',
  `prop_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '配置编码',
  `prop_class` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '配置值数据类型',
  `prop_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '配置值',
  `prop_desc` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '配置描述',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='服务配置';

-- ----------------------------
-- Table structure for server_queue
-- ----------------------------
DROP TABLE IF EXISTS `server_queue`;
CREATE TABLE `server_queue` (
  `id` int NOT NULL AUTO_INCREMENT,
  `accountid` int NOT NULL DEFAULT '0',
  `characterid` int NOT NULL DEFAULT '0',
  `type` tinyint NOT NULL DEFAULT '0',
  `value` int NOT NULL DEFAULT '0',
  `message` varchar(128) NOT NULL,
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for shopitems
-- ----------------------------
DROP TABLE IF EXISTS `shopitems`;
CREATE TABLE `shopitems` (
  `shopitemid` int unsigned NOT NULL AUTO_INCREMENT,
  `shopid` int unsigned NOT NULL,
  `itemid` int NOT NULL,
  `price` int NOT NULL,
  `pitch` int NOT NULL DEFAULT '0',
  `position` int NOT NULL COMMENT 'sort is an arbitrary field designed to give leeway when modifying shops. The lowest number is 104 and it increments by 4 for each item to allow decent space for swapping/inserting/removing items.',
  PRIMARY KEY (`shopitemid`)
) ENGINE=InnoDB AUTO_INCREMENT=21163 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for shops
-- ----------------------------
DROP TABLE IF EXISTS `shops`;
CREATE TABLE `shops` (
  `shopid` int unsigned NOT NULL AUTO_INCREMENT,
  `npcid` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`shopid`)
) ENGINE=InnoDB AUTO_INCREMENT=10000000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for skillmacros
-- ----------------------------
DROP TABLE IF EXISTS `skillmacros`;
CREATE TABLE `skillmacros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL DEFAULT '0',
  `position` tinyint(1) NOT NULL DEFAULT '0',
  `skill1` int NOT NULL DEFAULT '0',
  `skill2` int NOT NULL DEFAULT '0',
  `skill3` int NOT NULL DEFAULT '0',
  `name` varchar(13) DEFAULT NULL,
  `shout` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6488 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for skills
-- ----------------------------
DROP TABLE IF EXISTS `skills`;
CREATE TABLE `skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `skillid` int NOT NULL DEFAULT '0',
  `characterid` int NOT NULL DEFAULT '0',
  `skilllevel` int NOT NULL DEFAULT '0',
  `masterlevel` int NOT NULL DEFAULT '0',
  `expiration` bigint NOT NULL DEFAULT '-1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `skillpair` (`skillid`,`characterid`),
  KEY `skills_chrid_fk` (`characterid`),
  CONSTRAINT `skills_chrid_fk` FOREIGN KEY (`characterid`) REFERENCES `characters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=807296 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for specialcashitems
-- ----------------------------
DROP TABLE IF EXISTS `specialcashitems`;
CREATE TABLE `specialcashitems` (
  `id` int NOT NULL,
  `sn` int NOT NULL,
  `modifier` int NOT NULL COMMENT '1024 is add/remove',
  `info` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for storages
-- ----------------------------
DROP TABLE IF EXISTS `storages`;
CREATE TABLE `storages` (
  `storageid` int unsigned NOT NULL AUTO_INCREMENT,
  `accountid` int NOT NULL DEFAULT '0',
  `world` int NOT NULL,
  `slots` int NOT NULL DEFAULT '0',
  `meso` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`storageid`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for trocklocations
-- ----------------------------
DROP TABLE IF EXISTS `trocklocations`;
CREATE TABLE `trocklocations` (
  `trockid` int NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL,
  `mapid` int NOT NULL,
  `vip` int NOT NULL,
  PRIMARY KEY (`trockid`)
) ENGINE=InnoDB AUTO_INCREMENT=8844 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for wishlists
-- ----------------------------
DROP TABLE IF EXISTS `wishlists`;
CREATE TABLE `wishlists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `charid` int NOT NULL,
  `sn` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2903 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for worldtransfers
-- ----------------------------
DROP TABLE IF EXISTS `worldtransfers`;
CREATE TABLE `worldtransfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterid` int NOT NULL,
  `from` tinyint NOT NULL,
  `to` tinyint NOT NULL,
  `requestTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completionTime` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `characterid` (`characterid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for world_prop
-- ----------------------------
DROP TABLE IF EXISTS `world_prop`;
CREATE TABLE `world_prop` (
  `id` bigint NOT NULL COMMENT '大区id',
  `flag` tinyint DEFAULT '0' COMMENT '0=非特殊，1=活动大区，2=新区，3=热门大区',
  `server_message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '顶部滚动信息',
  `event_message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '大区描述',
  `recommend_message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '大区推荐信息',
  `channel_size` int DEFAULT NULL COMMENT '频道数',
  `exp_rate` decimal(40,3) DEFAULT NULL COMMENT '经验倍率',
  `meso_rate` decimal(40,3) DEFAULT NULL COMMENT '金币倍率',
  `drop_rate` decimal(40,3) DEFAULT NULL COMMENT '掉落倍率',
  `boss_drop_rate` decimal(40,3) DEFAULT NULL COMMENT 'BOSS掉落倍率',
  `quest_rate` decimal(40,3) DEFAULT NULL COMMENT '任务倍率',
  `fishing_rate` decimal(40,3) DEFAULT NULL COMMENT '钓鱼倍率',
  `travel_rate` decimal(40,3) DEFAULT NULL COMMENT '旅行倍率',
  `level_exp_rate` decimal(40,3) DEFAULT NULL COMMENT '等级经验倍率，0为不启用',
  `quick_level` decimal(40,3) DEFAULT NULL COMMENT '冲刺等级，0为不启用',
  `quick_level_exp_rate` decimal(40,3) DEFAULT NULL COMMENT '冲刺等级经验倍率',
  `enabled` tinyint DEFAULT '0' COMMENT '大区是否启用，0-不启用，1-启用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='大区配置';
