let interfaces = require('os').networkInterfaces();
let SerialPort = require("serialport"); //引入模块
//获取本机IP地址列表
function getLocalIps() {
    let ipList = [];
    for (let devName in interfaces) {
        var iface = interfaces[devName];

        for (let i = 0; i < iface.length; i++) {
            let alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                ipList.push(alias)
            }
        }
    }
    return ipList;
}

//获取本机串口列表

// 获取PC机器所有串口列表
async function portList() {
    let comList = await SerialPort.list()
    let portList = []
    for (let v of comList) {
        let tmpObj = {}
        // tmpObj.code=v.comName//老版本是comName
        // tmpObj.value=v.comName
        tmpObj.code = v.path; //新版本是path
        tmpObj.value = v.path;
        portList.push(tmpObj);
    }
    return portList
}



module.exports.portList = portList //com列表
module.exports.getLocalIps = getLocalIps //IP列表
