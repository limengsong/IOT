module.exports = function (RED) {
	let intecDev = require("./intecTCP_Class.js"); // 引入电子称实例
	let clientsMap = new Map(); //记录tcp客户端的map，key=>ip：port，vallue=> 通讯对象
	// 根据配置id，构建设备对象
	function getDevInfo(id) {
		let scaleCfg = {};
		if (id) {
			let devNode = RED.nodes.getNode(id);
			let devNodeCfg = devNode.content;
			scaleCfg.name = devNodeCfg.name;
			if (devNodeCfg.devtype === 'tcpip') {
				scaleCfg.type = 'tcpip';
				scaleCfg.ip = devNodeCfg.ip;
				scaleCfg.port = devNodeCfg.port;
			} else {
				//TODO ：由于设备不支持，暂不实现
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
	//初始化：读取配置文件+组态信息
	function devInit(node) {
		try {
			let devInfoCfg = {};
			if (node.cfgInfo) {
				devInfoCfg.mbsId = parseInt(node.devID);
				devInfoCfg.mbsPort = parseInt(node.cfgInfo.port);
				devInfoCfg.mbsHost = node.cfgInfo.ip;
			}
			return devInfoCfg;
		} catch (err) {
			console.log('err', err);
		}

	}
	//根据设备通讯配置信息进行电子称数据打开读取数据
	function devOpen(devInfo, callback) {
		intecDev.devOpen(devInfo, result => {
			callback(result);
		});
	}

	//根据设备通讯配置信息进行电子称数据打开读取数据
	function devRead(devInfo, callback) {
		intecDev.devRead(devInfo, result => {
			callback(result);
		});
	}

	//根据设备通讯配置信息进行电子称数据打开读取数据
	function devClose(devInfo, callback) {
		intecDev.devClose(devInfo, result => {
			callback(result);
		});
	}
	//根据设备通讯配置信息进行电子称数据打开读取数据
	// 获取MIS3C的实时值
	function getRealVal(config) {
		RED.nodes.createNode(this, config);
		var node = this;
		let intecRlt;
		this.on('input', function (msg) {
			let devPrams = {};
			node.devID = config.devID;

			if (config.devType) {
				node.cfgInfo = getDevInfo(config.devType);
				devPrams = devInit(node);
			}
			let devCfgId = config.devType; //devcfg-id 读取设备配置的id
			console.log('设备通信配置加载id:', devCfgId);
			let wsIndex = msg._session.id; //ws client 连接的id
			if (msg.event === 'connect') {
				if (!clientsMap.has(devCfgId)) {
					let clientArray = [];
					console.log('ws客户端连接：', wsIndex);
					clientArray.push(wsIndex); //记录属于这个配置信息的所有客户端id
					clientsMap.set(devCfgId, clientArray);
					//首次的devCfgID，进行通讯
					devRead(devPrams, result => {
						// result 就是devOpen回调数据

						node.send(msg);
						if (result.status === 'open') {
							node.status({
								fill: "green",
								shape: "ring",
								text: `MIS3C Open_Success`
							});
							intecRlt = result;
							intecRlt.unit = config.unit; //加载页面端配置的单位信息
							msg.payload = intecRlt;
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

						setInterval(() => {
							if (intecRlt) {
								msg.payload = intecRlt;
								node.send(msg);
							}
						}, 1000);



					}

				}

			} else if (msg.event === 'disconnect') {
				if (clientsMap.has(devCfgId)) {
					//检测断开的客户端 属于哪个设备配置信息，并进行相应的移除操作
					let deleIdx = clientsMap.get(devCfgId).indexOf(wsIndex);
					console.log('ws客户端断开连接：', wsIndex);
					if (deleIdx > -1) {
						clientsMap.get(devCfgId).splice(deleIdx, 1); //ws客户端数组移除
						if (clientsMap.get(devCfgId).length === 0) {
							//客户端为0时候，则关闭电子称，并清空该配置信息
							clientsMap.delete(devCfgId);
							console.log('加载配置个数:', clientsMap.size);

							//TODO: 关闭当前的devCfgId 电子称
							devClose(devPrams, rlt => {
								if (!rlt) {
									node.status({
										fill: "gray",
										shape: "dot",
										text: `MIS3C Close_Success`
									});
									console.log('------设备关闭--------');
									intecRlt = null;
								}
							});
						}
					}


				}
			}
			console.log('clientsMap', clientsMap);
		});

		//点击部署时候出发（回收资源用）
		this.on('close', function () {

		});
	}
	RED.nodes.registerType("mis3c", getRealVal);

}