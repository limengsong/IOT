/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-07-01 19:42:03
 * @LastEditTime : 2019-12-24 15:06:19
 * @LastEditors  : Please set LastEditors
 */
module.exports = function (RED) {
	let devInstance = {} // 定义电子称设备实例
	let clientsMap = new Map(); //记录tcp客户端的map，key=>ip：port，vallue=> 通讯对象
	let valueMap = new Map(); //

	// 根据配置id，构建设备对象
	function getDevInfo(id) {
		let scaleCfg = {};
		if (id) {
			let devNode = RED.nodes.getNode(id);
			let devNodeCfg = devNode.content;
			scaleCfg.name = devNodeCfg.name;
			scaleCfg.brand = devNodeCfg.brand;
			if (devNodeCfg.devtype === 'tcpip') {
				scaleCfg.type = 'tcpip';
				scaleCfg.ip = devNodeCfg.ip;
				scaleCfg.port = devNodeCfg.port;
			} else {
				scaleCfg.type = 'serial';
				scaleCfg.serialPort = devNodeCfg.serialPort;
				scaleCfg.baudRate = devNodeCfg.baudRate;
				scaleCfg.dataBits = devNodeCfg.dataBits;
				scaleCfg.stopBits = devNodeCfg.stopBits;
				scaleCfg.parity = devNodeCfg.parity;
			}

		}

		return scaleCfg;
	}
	//-----------------------电子称配置信息开始-----------------------
	function scaleConfig(config) {
		RED.nodes.createNode(this, config);
		this.cfgId = config.devcfg; //界面框中录入的内容
		let node = this;
		let scaleDev = require("./scale-data"); // 引入电子称实例
		let scaleResult = {};
		let timer = {}; //定时器对象
		let timerStatus = false; //定时器默认状态，关

		this.on('input', function (msg) {
			//获取设备连接的配置文件：
			let devCfgId = node.cfgId;
			//维护当前ws_client连接情况：(ws-id,devcfg-id)
			let index = msg._session.id;
			if (msg.event === 'connect') {
				if (!clientsMap.has(index)) {
					clientsMap.set(index, devCfgId);
				}

			} else if (msg.event === 'disconnect') {
				if (clientsMap.has(index)) {
					console.log('断开ws-id', index);
					//clearInterval(clientsMap.get(index).timer);
					clientsMap.delete(index);
				}
			}
			// 当前连接的配置：
			let devCfg = getDevInfo(devCfgId);

			//获取当前配置的连接情况：
			for(let [key,value] of clientsMap){
				let arr=[];
				if(value===devCfgId){
					arr.push(key);
				}
				console.log('当前设备id',devCfgId,'连接数',arr.length,'列表',arr);
			}
			//根据配置信息，构建设备通信对象
			if (JSON.stringify(devCfg) !== '{}') {
				devInstance = scaleDev.buildDevParams(devCfg);
			}
			let status = scaleDev.getStatus(devInstance);

			console.log('当前设备',devCfgId,'状态', status, '当前设备连接数', clientsMap.size);

			if (clientsMap.size === 1 && scaleDev.getStatus(devInstance) === 0) {
				scaleDev.devOpen(devInstance, result => {
					// result 就是devOpen回调数据
					//scaleResult = result;//电子称的数据
					msg.payload = result;
					node.send(msg);
				});

			} else if (clientsMap.size > 1 && scaleDev.getStatus(devInstance) === 1) {
				scaleDev.devRead(devInstance, result => {
					// result 就是devOpen回调数据
					//scaleResult = result;//电子称的数据
					msg.payload = result;
					node.send(msg);
				});

			} else if (clientsMap.size === 0) {
				//0客户端，设备关闭
				console.log('======');
				scaleDev.devClose(devInstance, rlt => {
					if (rlt.status === 'close') {
						node.status({
							fill: "gray",
							shape: "ring",
							text: `${rlt.value}`
						});
					} else {
						node.status({
							fill: "red",
							shape: "ring",
							text: `${rlt.value}`
						});

						msg.payload = rlt;
						node.send(msg);
					}

				});
			}


			//ws有一个连接数 即读取数据
			if (clientsMap.size > 0) {


				// scaleDev.devOpen(devInstance, result => {
				// 	// result 就是devOpen回调数据
				// 	msg.payload = result;
				// 	scaleResult = result;
				// 	console.log('result',result);
				// 	if (result.status === 'open') {
				// 		node.status({
				// 			fill: "green",
				// 			shape: "ring",
				// 			text: `Brand: ${result.brand} Open_Success`
				// 		});
				// 	} else {
				// 		node.status({
				// 			fill: "red",
				// 			shape: "ring",
				// 			text: `Brand: ${result.brand} Open_Fail`
				// 		});
				// 	}
				// 	node.send(msg);
				// });
			} else if (clientsMap.size === 0) {
				//TODO：所有客户端均关闭，是否关闭设备，待定？？？






			}


			// if (msg.count === 0 && msg.event === 'disconnect') {
			// 	//超过一个客户端连接得情况：
			// 	if (timerStatus) {
			// 		clearInterval(timer);
			// 	}
			// 	let index = msg._session.id;
			// 	if (clientsMap.has(index)) {
			// 		let devClose = clientsMap.get(index);
			// 		scaleDev.devClose(devClose, rlt => {
			// 			if (rlt.status === 'close') {
			// 				node.status({
			// 					fill: "gray",
			// 					shape: "ring",
			// 					text: `${rlt.value}`
			// 				});
			// 			} else {
			// 				node.status({
			// 					fill: "red",
			// 					shape: "ring",
			// 					text: `${rlt.value}`
			// 				});

			// 				msg.payload = rlt;
			// 				node.send(msg);
			// 			}

			// 		});
			// 	}

			// } 


		});


		//点击部署时候出发
		this.on('close', function () {

		});
	}

	RED.nodes.registerType("scale-config", scaleConfig);
	//-----------------------电子称配置信息结束始-----------------------

}