/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-07-01 19:42:03
 * @LastEditTime: 2019-08-21 21:33:22
 * @LastEditors: Please set LastEditors
 */

module.exports = function(RED) {
    function switchCard(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var rfDev = require("../rfid-common-resource/rfid");
        let obj = {}
        this.on('input', function(msg) {       

            // rfStatus：0(未连接、断开状态) 1（已连接、打开状态）、2（已连接、关闭状态）、3（读卡状态）、4、（写卡状态）
            let status=rfDev.dev_status()
            if(msg.count===0){
                //当所有客户端均断开连接时，即关闭设备
                if(status===1||status===3||status===4){// 当前状态为打开时：则关闭
                    if(rfDev.dev_close()===0){    
                        node.status({fill:"red",shape:"dot",text:"RFID.status.close"});
                        node.send("RFID.message.close-success");
                        obj.status = "RFID.message.close-success"
                        
                    }else{
                        node.send("RFID.message.close-fail");
                        obj.status ="RFID.message.close-fail"
                    }
                    obj.value = ""
                    msg.payload = obj
                    node.send(msg);
                    return;
                }

            }else if(msg.count===1){
                //当有一个客户端进行连接时，则就开启设备。多个连接时 只打开一次，则>1情况不做处理即可
                if(status===2){// 当前状态为关闭：则打开
                    if(rfDev.dev_open()>0){    
                        node.status({fill:"green",shape:"ring",text:"RFID.status.connect"});
                        node.send("RFID.message.open-success");
                        obj.status ="RFID.message.open-success"
                    }else{
                        node.status({fill:"red",shape:"dot",text:"RFID.status.disconnect"});
                        node.send("RFID.message.open-fail");
                        obj.status ="RFID.message.open-fail"
                    }
                }else if(status===0){// 当前未连接，则连接
                    if(rfDev.dev_open()>0){    
                        node.status({fill:"green",shape:"ring",text:"RFID.status.connect"});
                        node.send("RFID.message.open-success");
                        obj.status ="RFID.message.open-success"
                    }else{
                        node.status({fill:"red",shape:"dot",text:"RFID.status.disconnect"});
                        node.send("RFID.message.open-fail");
                        obj.status ="RFID.message.open-fail"
                    }
                }
                obj.value = ""
                msg.payload = obj
                node.send(msg);

            }
			 
        });
        //点击部署时候触发（回收资源用）
        this.on('close', function() {
            
            

        });

    }

    RED.nodes.registerType("RFID-Switch",switchCard);
}