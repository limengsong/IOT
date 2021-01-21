module.exports = function (RED) {

	// 打印机打印节点
	function printZPL(config) {
		RED.nodes.createNode(this, config);
		var node = this;
		node.config = config;
		let printer = require("../../../src/lib/printer/client"); // 引入打印机实例
		this.on('input', function (msg) {
			let resRlt = {};
			let cfgPrinter = node.config.printer;
			if (!printer.supportZPL(cfgPrinter)) {
				resRlt.data = `${cfgPrinter}不支持ZPL指令`;
				node.status({
					fill: "red",
					shape: "ring",
					text: resRlt.data
				});
			} else if (!printer.checkOnline(cfgPrinter)) {
				resRlt.data = `${cfgPrinter}未在线`;
				node.status({
					fill: "red",
					shape: "ring",
					text: resRlt.data
				});
			} else {
				let printerObj = msg.payload.data;//配置数据，变量数据，打印机名称，zpl指令完全来自于请求方
				printerObj.printerName=cfgPrinter;//node-red配置项
				if (printerObj && printerObj.template) {
					let bPrintRlt = printer.printCode(printerObj);
					if (bPrintRlt.result) {
						resRlt.data = bPrintRlt.zpl;
						resRlt.printer = printerObj.printerName;
						resRlt.result = "success";
						node.status({
							fill: "green",
							shape: "ring",
							text: `${resRlt.printer} print ${resRlt.result}`
						});
					} else {
						resRlt.data = bPrintRlt.zpl;
						resRlt.printer = printerObj.printerName;
						resRlt.result = "fail";
						node.status({
							fill: "red",
							shape: "ring",
							text: `${resRlt.printer} print ${resRlt.result}`
						});
					}
				} else {
					resRlt.data = "数据格式不正确";
				}
			}
			msg.payload = resRlt;
			node.send(msg);
		});

		//点击部署时候出发（回收资源用）
		this.on('close', function () {

		});
	}
	RED.nodes.registerType("label-printer", printZPL);

}