/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-08-21 08:55:46
 * @LastEditTime : 2019-12-21 19:54:39
 * @LastEditors  : Please set LastEditors
 */
const SerialPort = require("serialport"); //引入模块
const net = require("net"); //引入net模块
let client = new net.Socket(); //构建tcp客户端
client.setEncoding('utf8');
let recstatu; //表示是否处于一个正在接收数据包的状态
let str = '';
let stable_ValueObj = {}; // 记录正常通讯的值
let closeRlt;
let devTimer = {}; //定义发送指令的定时器
let devStatus = 0; //定义设备状态。1：打开状态，0：关闭状态（默认）

//构建设备通讯参数，
function buildDevParams(conn) {
    if (JSON.stringify(conn) === '{}') {
        return -1;
    }
    if (conn.type === 'serial') { //串口
        let serialPort = new SerialPort(
            conn.serialport, {//com口
                baudRate: parseInt(conn.baudRate), //波特率
                dataBits: parseInt(conn.dataBits), //数据位
                parity: conn.parity, //奇偶校验
                stopBits: parseInt(conn.stopBits), //停止位
                flowControl: false,
                autoOpen: false
            }, false);
        serialPort.brand = conn.config.brand;
        serialPort.type = 'serial';
        return serialPort;
    } else if (conn.type === 'tcpip') { //网口
        return options = {
            host: conn.ip,
            port: conn.port,
            type: 'tcpip',
            brand: conn.brand
        };
    }

}

// 将通讯的参数构建好，参数传递.组包成功得数据，进行回调
function devOpen(serialPort, callback) {
    if (serialPort.type === 'tcpip') {
        //tcpip--梅特勒
        if (serialPort.brand === 'mettler') {
            try {
                let tcpipPara = {
                    port: serialPort.port,
                    host: serialPort.host
                };
                //建立连接，
                createTcpConnect(tcpipPara, serialPort.brand);

                // data是服务器发回的数据
                client.on('data', function (data) {
                    try {
                        let temValue = analysisMettler(data);

                        callback(temValue);
                        //sendCMD('mettler');
                        return temValue;

                    } catch (err) {
                        console.log('err', err);
                    }

                });
                client.on('error', function (err) {
                    console.log('connect-error', err.code);
                    createTcpConnect(tcpipPara, serialPort.brand);

                });
                client.on('close', function () {
                    //断开
                    //console.log('TCP客户端关闭');

                });

            } catch (err) {
                console.error(err);
            }

        } else {
            //tcp-茵泰科
            try {
                let tcpipPara = {
                    port: serialPort.port,
                    host: serialPort.host
                };
                createTcpConnect(tcpipPara, serialPort.brand);
                // data是服务器发回的数据
                client.on('data', function (data) {
                    try {
                        let v = analysisMsg(data);
                        callback(v);
                        sendCMD('intec');
                        return v;

                    } catch (err) {
                        console.log('err', err);
                    }

                });
                client.on('error', function (err) {
                    //console.log('connect-error',err.code);
                    //连接中途发生错误，重新建立连接
                    createTcpConnect(tcpipPara, serialPort.brand);

                });
                client.on('close', function () {
                    //断开
                    console.log('intec scale close')

                });

            } catch (err) {
                console.error(err);
            }

        }


    } else {
        //serial
        try {
            createSerialConnect(serialPort);
            serialPort.on('data', function (data) {
                // 寻找包地址开始符：'\u0053'
                // 寻找包地址结束符：'\u000A'
                let curData = data;
                if (curData.indexOf('\u0053') > -1 && recstatu === 0) { //检测是否是包头
                    str = ''
                    recstatu = 1;
                    str += curData
                    return;
                }
                if (curData.indexOf('\u000A') > -1) { //检测是否是包尾
                    recstatu = 0;
                    str += curData
                    stable_ValueObj = analysisMettler(str);
                    callback(stable_ValueObj);
                    return;
                }
                if (recstatu == 1) { //是否处于接收数据包状态
                    str += curData
                }
            });
            serialPort.on('error', function (err) {
                console.log('serial scale connect-error',err.code);
                devClose(serialPort) ;
                //发生错误，关闭电子称
                let obj = {};
                obj.value = err.message;
                obj.status = 'error';
                callback(obj);

            });
            serialPort.on('close', function () {
                //断开
                let obj = {};
                obj.value = '电子称端口关闭';
                obj.status = 'close';
                callback(obj);

            });

        } catch (err) {
            let obj = {};
            obj.value = err.message;
            obj.status = 'close';
            callback(obj);
            return obj;
        }

    }
}



//解析梅特勒报文：原始应答格式：S_S_ _ _ _ _0.890_kg
function analysisMettler(data) {
    const bufferText = Buffer.from(data, 'ascii'); // 原始应答格式：S_S_ _ _ _ _0.890_kg
    //53 20 53 20 20 20 20 20 30 2E 38 31 32 37 20 6B 67 0D 0A
    //S  _  S  _  _  _  _  _  0   .  8  1  2  7 _  k  g  回车 换行
    let a = bufferText.slice(0, 3); // S_S
    let b = bufferText.slice(3, 8); //空格
    let c = bufferText.slice(8, 14); // 数据
    let d = bufferText.slice(14, 15); //空格
    let e = bufferText.slice(15, 17); //单位
    let f = bufferText.slice(17, 19); //回车换行
    let obj = {};
    obj.value = parseFloat(c.toString().trim()); //重量值
    obj.unit = e.toString().trim(); //单位
    obj.status = 'open';

    return obj;

}




/** 
 * 解析茵泰科报文
 * 原始应答格式：<Buffer 4e 20 20 20 20 20 2b 20 20 20 30 2e 30 31 30 30 20 6b 67 20 0d 0a>\
 * 位置 0： N-净重，T-皮重，G-毛重
 * 位置 1： 正号或者负号或者空格
 * 位置 2： 空格
 * 位置 3-10： 带一位小数点的重量值；前面的零用空格代替
 * 位置 11： 空格
 * 位置 12-14： 单位符号或者空格
 * 位置 15： 回车
 * 位置 16： 换行
 */
function analysisMsg(data) {
    const bufferText = Buffer.from(data, 'utf8'); // 原始数据
    let a = bufferText.slice(0, 6); // N-稳态，T-皮重，G-毛重
    let b = bufferText.slice(6, 7); //正号或者负号或者空格
    let c = bufferText.slice(7, 8); // 空格
    let d = bufferText.slice(8, 16); //带一位小数点的重量值；前面的零用空格代替
    let e = bufferText.slice(16, 17); //空格
    let f = bufferText.slice(17, 20); //单位符号或者空格
    let g = bufferText.slice(20, 21); // 回车
    let h = bufferText.slice(21, 22); //换行
    let obj = {};
    obj.value = parseFloat(d.toString().trim()); //重量值
    obj.unit = f.toString().trim(); //有单位--稳态，空--非稳态
    obj.status = 'open'; //a.toString().trim();// N-净重，T-皮重，G-毛重  为了保持和梅特勒一致，修改为open
    return obj;
}


//关闭端口
function devClose(serialPort) {
    closeRlt = false;
    clearInterval(devTimer);
    //reset(serialPort); //复位后再关闭
    if (serialPort.type === 'tcpip') {
        //tcpip
        try {
            let tcpCloseRlt = client.destroy();
            if (tcpCloseRlt.destroyed) {
                closeRlt = client.destroyed;
                devStatus = 0; //关闭成功
                //callback(closeRlt)
                console.log('TCP Scala Dev closed success');
            }

        } catch (err) {
            devStatus = 1; //关闭失败，即仍旧为打开状态
            closeRlt=false;
            //callback(closeRlt)
            console.log('TCP Scala Dev closed fail:,', err)
        }
    } else {
        try {
            serialPort.close(function (err) {
                if (err === null) {
                    //关闭成功
                    closeRlt = true
                    //callback(closeRlt)
                    devStatus = 0; //关闭成功
                    console.log('serial Scala Dev closed success');
                }
            });
        } catch (err) {
            devStatus = 1; //关闭失败，即仍旧为打开状态
           // callback(closeRlt)
            console.log('Serial Scala Dev closed fail:,', err)
        }
    }

    return closeRlt;
}

//建立Tcp连接
function createTcpConnect(tcpipPara, brand) {
    if (devStatus === 0) {
        client.connect(tcpipPara, function () {
            // 建立连接后立即向服务器发送数据，服务器将收到这些数据 
            devStatus = 1;
            // sendCMD(brand);

            devTimer = setInterval(() => {
                sendCMD(brand);
            }, 500);
        });
    }


}

//建立Serial连接
function createSerialConnect(serialPort) {
    if (devStatus === 0) {
        serialPort.open(function (error) {
            devStatus = 1;
            if (serialPort.brand === 'mettler') {
                let cmdSI = Buffer.from([0x53, 0x49, 0x0D, 0x0A]);
                devTimer = setInterval(() => {
                    serialPort.write(cmdSI);
                    // console.log('Serial Dev Send Command SI');
                }, 500);

            }
        });

    }


}


//发送取值命令
function sendCMD(brand) {
    let cmds;
    if (brand === 'mettler') {
        //cmds = Buffer.from([0x53, 0x49, 0x52, 0x0D, 0x0A]);//SIR
        cmds = Buffer.from([0x53, 0x49, 0x0D, 0x0A]); //SI
    } else {
        cmds = Buffer.from([0x1B, 0x50, 0x0D, 0x0A]);
    }
    client.write(cmds);

}


function getStatus(){
    return devStatus;
}





//接口导出：
module.exports.devOpen = devOpen; //打开设备
module.exports.devClose = devClose; //关闭设备
module.exports.buildDevParams = buildDevParams; //构建设备通讯参数
module.exports.getStatus = getStatus; //获取秤的状态