var status = 0;

function start() {
        	cm.sendYesNo("花费1万点券，可直接获得血量蓝量上限，是否提升？");
	}

function action(mode, type, selection) {
    if (mode == -1) {
        cm.dispose();
    } else {
        if (status == 1 && mode == 0) {
            cm.dispose();
            return;
        } else if (status >= 2 && mode == 0) {
            cm.dispose();
            return;
        }
        if (mode == 1)
            status++;
        else
            status--;
        if (status == 1) {
	 if (cm.getPlayer().getCashShop().getCash(1) < 10000) {
                          	cm.sendOk("#b需要1W点券");
	        	cm.dispose();
	} else {
        cm.getPlayer().getCashShop().gainCash(1, -10000);//点券
        var randomHP = Math.floor(Math.random() * 31) + 20;
        var randomMP = Math.floor(Math.random() * 31) + 20;
        cm.getPlayer().addMaxHP(randomHP)
        cm.getPlayer().addMaxMP(randomMP)

        cm.sendOk("增加成功！\r\n#b血量上限 + " + randomHP + "\r\n魔力上限 + " + randomMP + "#k");
		cm.dispose();  }
             }else {
		cm.dispose();
		}
	}
}