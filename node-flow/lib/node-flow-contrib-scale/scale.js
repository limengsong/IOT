/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-07-01 19:42:03
 * @LastEditTime : 2019-12-24 15:06:19
 * @LastEditors  : Please set LastEditors
 */
module.exports = function (RED) {
	//let devInstance = {} // 定义电子称设备实例
	let clientsMap = new Map(); //记录tcp客户端的map，key=>ip：port，vallue=> 通讯对象
	let valueMap = new Map(); //
	let scaleDev = require("./scale-data"); // 引入电子称实例
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

	//构建设备通讯对象通过devCfgID
	function buildParams(devCfgId) {
		let devInstance = {} // 定义电子称设备实例
		// 当前连接的配置（对象）：
		let devCfg = getDevInfo(devCfgId);
		//根据配置信息，构建设备通信对象
		if (JSON.stringify(devCfg) !== '{}') {
			devInstance = scaleDev.buildDevParams(devCfg);
			return devInstance;
		} else {
			return -1;
		}
	}

	//根据设备通讯配置信息进行电子称数据打开读取数据
	function devOpen(devCfgId, callback) {
		let devInfo = buildParams(devCfgId);
		//let status = scaleDev.getStatus(devInfo);
		scaleDev.devOpen(devInfo, result => {
			// result 就是devOpen回调数据
			if (result.status === 'open') {
				callback(result);
			}
		});
	}

	//根据设备通讯配置信息进行电子称读取数据
	function devRead(devCfgId, callback) {
		let devInfo = buildParams(devCfgId);
		//let status = scaleDev.getStatus(devInfo);
		scaleDev.devRead(devInfo, result => {
			// result 就是devOpen回调数据
			if (result.status === 'open') {
				callback(result);
			}
		});
	}


	//根据设备通讯配置信息进行电子称关闭
	function devClose(devCfgId, callback) {
		let devInfo = buildParams(devCfgId);
		scaleDev.devClose(devInfo, result => {
			// result 就是devOpen回调数据
			callback(result);
		});
	}


	//-----------------------电子称配置信息开始-----------------------
	function scaleConfig(config) {
		RED.nodes.createNode(this, config);
		this.cfgId = config.devcfg; //界面框中录入的内容
		let node = this;

		let scaleResult = {};
		let timer = {}; //定时器对象
		let timerStatus = false; //定时器默认状态，关

		this.on('input', function (msg) {
			//获取设备连接的配置文件：
			let devCfgId = node.cfgId; //devcfg-id 读取设备配置的id
			//维护当前ws_client连接情况：(ws-id,devcfg-id)
			let wsIndex = msg._session.id; //ws client 连接的id
			if (msg.event === 'connect') {
				if (!clientsMap.has(devCfgId)) {
					let clientArray = [];
					clientArray.push(wsIndex); //记录属于这个配置信息的所有客户端id
					clientsMap.set(devCfgId, clientArray);
					//首次的devCfgID，进行通讯
					devOpen(devCfgId, result => {
						// result 就是devOpen回调数据
						if (result.status === 'open') {
							node.status({
								fill: "green",
								shape: "ring",
								text: `Brand: ${result.brand} Open_Success`
							});
							msg.payload = result;
							node.send(msg);
						}

					});
				} else {
					//: 不进行通讯
					console.log('不进行通讯', devCfgId);
					//同一个通讯配置，多个客户端连接
					let checkIdx = clientsMap.get(devCfgId).indexOf(wsIndex);
					if (checkIdx === -1) {
						//不存在的客户端,则添加到数组中
						clientsMap.get(devCfgId).push(wsIndex);
						devRead(devCfgId, result => {
							// result 就是devOpen回调数据
							msg.payload = result;
							node.send(msg);
						});
					}

				}

			} else if (msg.event === 'disconnect') {
				if (clientsMap.has(devCfgId)) {
					//检测断开的客户端 属于哪个设备配置信息，并进行相应的移除操作
					let deleIdx = clientsMap.get(devCfgId).indexOf(wsIndex);
					if (deleIdx > -1) {
						clientsMap.get(devCfgId).splice(deleIdx, 1); //ws客户端数组移除
						if (clientsMap.get(devCfgId).length === 0) {
							//客户端为0时候，则关闭电子称，并清空该配置信息
							clientsMap.delete(devCfgId);
							//TODO: 关闭当前的devCfgId 电子称
							devClose(devCfgId, rlt => {
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
					}


				}
			}
			console.log('clientsMap', clientsMap);
		});


		//点击部署时候出发
		this.on('close', function () {

		});
	}

	RED.nodes.registerType("scale-config", scaleConfig);
	//-----------------------电子称配置信息结束始-----------------------

}