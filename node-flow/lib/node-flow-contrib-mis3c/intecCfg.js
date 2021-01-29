/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-07-01 19:42:03
 * @LastEditTime: 2019-12-13 10:22:26
 * @LastEditors: Please set LastEditors
 */
module.exports = function (RED) {
	//-----------------------电子称配置信息开始-----------------------
	function MBSConfig(config) {
		RED.nodes.createNode(this, config);
		this.content= config; //界面框中录入的内容
		var node = this;
		this.on('input', function (msg) {
			let scaleCfg={};
			scaleCfg.name=node.content.name;
			scaleCfg.brand=node.content.brand;
			if(node.content.devtype==='tcpip'){
				scaleCfg.devtype='tcpip';
				scaleCfg.ip=node.content.ip;
				scaleCfg.port=node.content.port;
			}else{
				scaleCfg.devtype='serial';
				scaleCfg.serialPort=node.content.serialPort;
				scaleCfg.baudRate=node.content.baudRate;
				scaleCfg.dataBits=node.content.dataBits;
				scaleCfg.stopBits=node.content.stopBits;
				scaleCfg.parity=node.content.parity;
			}
			msg.payload=scaleCfg;//配置界面中内容，发送下一个节点
			node.send(msg);
		});

		//点击部署时候出发
		this.on('close', function () {

		});
	}

	RED.nodes.registerType("intec-config", MBSConfig);

}