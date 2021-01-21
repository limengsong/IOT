module.exports =  function(RED) {	 
	 function readCard(config) {
		RED.nodes.createNode(this,config);
	    // this.period = config.period;
		var node = this;
		var rfDev = require("../rfid-common-resource/rfid");
		this.on('input', function(msg) {			
			//rfStatus：0(未连接、断开状态) 1（已连接、打开状态）、2（已连接、关闭状态）、3（读卡状态）、4、（写卡状态）
			//通过Node-Red外部，设置周期进行轮询
			if(rfDev.dev_status()===1||rfDev.dev_status()===3){//连接-打开状态，则进行读卡
				let result=rfDev.dev_read()
				node.status({fill:"green",shape:"dot",text:"RFID.status.read"});
				if(result!==-1){
					msg.payload=result
					node.send(msg);
				}
				
			}else if(rfDev.dev_status()===2){
				node.status({fill:"yellow",shape:"dot",text:"RFID.status.close"});
			}else if(rfDev.dev_status()===0){
				node.status({fill:"grey",shape:"dot",text:"RFID.status.disconnect"});
			}
		});		
		//点击部署时候触发
		this.on('close', function () {
                                                                                                                                                        
		});
	}
	RED.nodes.registerType("RFID-Read",readCard);
}
