/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-08-21 08:55:46
 * @LastEditTime : 2019-12-24 11:47:54
 * @LastEditors  : Please set LastEditors
 */
const SerialPort = require("serialport"); //引入模块
const net = require("net"); //引入net模块
let recstatu; //表示是否处于一个正在接收数据包的状态
let str = '';
let stable_ValueObj = {}; // 记录正常通讯的值
let tcpClientsMap = new Map(); //记录tcp客户端的map，key=>ip：port，vallue=> new tcpScale()
let serialClientsMap = new Map(); //记录serial客户端的map，key=>com口号，vallue=> new serialScale()


//构建串口电子称类
class serialScale {
    //属性
    constructor(serialport, baudRate, dataBits, parity, stopBits, brand) {
        this.brand = brand;
        this.type = 'serial';
        this.timer =new Object();
        this.status = 0; //scale状态：0--设备关闭（默认），1--设备打开
        this.client = new SerialPort(
            serialport, { //端口号
                baudRate: parseInt(baudRate), //波特率
                dataBits: parseInt(dataBits), //数据位
                parity: parity, //奇偶校验
                stopBits: parseInt(stopBits), //停止位
                flowControl: false,
                autoOpen: false
            }, false);
    }



    //方法：
    //打开电子称
    serialScaleOpen(callback) {
        this.client.open( error=>{
            if (error) {
                console.log(error);
                callback(error);
            }
            // 建立连接后立即向服务器发送数据，服务器将收到这些数据 
            let cmds;
            if (this.brand === 'mettler') {
                cmds = Buffer.from([0x53, 0x49, 0x0D, 0x0A]); //SI
            } else {
                cmds = Buffer.from([0x1B, 0x50, 0x0D, 0x0A]); //print
            }
            //定时发送SI指令
           // if(Object.keys(this.timer).length===0){//判断是否为空对象
                this.timer = setInterval(() => {
                    if(this.status===0){
                        this.client.write(cmds);
                    }
                }, 500);
           // }

        });

        // data是服务器发回的数据
        this.client.on('data', function (data) {
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
                this.status = 1; //状态打开
                callback(stable_ValueObj);
                return;
            }
            if (recstatu == 1) { //是否处于接收数据包状态
                str += curData
            }
        });
        this.client.on('error', err => {
            console.log('connect-error', err.code);
            callback(err.code);
        });
        this.client.on('close', () => {
            //断开
            this.status = 0; //状态关闭

        });

    }
    //关闭电子秤
    serialScaleClose(callback) {
        clearInterval(this.timer);
        this.client.close(function (err) {
            if (err === null) {
                //关闭成功
                console.log('serial Scala Dev closed success');
                callback(true);
            } else {
                console.log(err);
                callback(false);

            }
        });

    }
    //电子称读数
    serialScaleRead(callback) {
            setInterval(()=>{
                callback(stable_ValueObj);
            },500);
    }
    //电子称状态
    serialScaleStatus() {
        return this.status;
    }

}

//构建网口电子称类
class tcpScale {
    //属性
    constructor(host, port, brand) {
        this.host = host;
        this.port = port;
        this.brand = brand;
        this.type = 'tcpip';
        this.status = 0; //scale状态：0--设备关闭（默认），1--设备打开
        this.tcpTimer = new Object();
        this.client = new net.Socket();
    }

    //方法：
    //打开电子称
    tcpScaleOpen(callback) {
        let tcpipPara = {
            port: this.port,
            host: this.host
        };
        this.client.connect(tcpipPara, () => {
            this.status = 1; //状态打开
            // 建立连接后立即向服务器发送数据，服务器将收到这些数据 
            let cmds;
            if (this.brand === 'mettler') {
                cmds = Buffer.from([0x53, 0x49, 0x0D, 0x0A]); //SI
            } else {
                cmds = Buffer.from([0x1B, 0x50, 0x0D, 0x0A]); //print
            }
            //定时发送SI指令
            this.tcpTimer = setInterval(() => {
                this.client.write(cmds);
            }, 500);


        });
        // data是服务器发回的数据
        this.client.on('data', data => {
            this.status = 1; //状态打开
            if (this.brand = 'mettler') {
                let temValue = analysisMettler(data);
                callback(temValue);
            } else {
                let temValue = analysisIntec(data);
                callback(temValue);
            }

        });
        this.client.on('error', err => {
            console.log('connect-error', err);
            callback(err);
        });
        this.client.on('close', () => {
            this.status = 0; //状态关闭
            //断开
            // console.log('梅特勒TCP客户端关闭');

        });

    }
    //关闭电子秤
    tcpScaleClose(callback) {
        clearInterval(this.tcpTimer);
        let tcpCloseRlt = this.client.destroy();
        if (tcpCloseRlt.destroyed) {
            console.log('TCP Scala Dev closed success');
            callback(true);

        } else {
            console.log('TCP Scala Dev closed fail');
            callback(false);
        }

    }


    //电子称读数
    tcpScaleRead(callback) {
        // data是服务器发回的数据
        this.client.on('data', data => {
            this.status = 1; //状态打开
            if (this.brand = 'mettler') {
                let temValue = analysisMettler(data);
                callback(temValue);
            } else {
                let temValue = analysisIntec(data);
                callback(temValue);
            }

        });
        this.client.on('error', err => {
            console.log('connect-error', err);
            callback(err);
        });
        this.client.on('close', () => {
            this.status = 0; //状态关闭
            //断开
            // console.log('梅特勒TCP客户端关闭');

        });
    }

    //电子称状态
    tcpScaleStatus() {
        return this.status;
    }


}



//构建设备通讯参数，
function buildDevParams(conn) {
    if (JSON.stringify(conn) === '{}') {
        return -1;
    }
    if (conn.type === 'serial') { //串口
        let serialPort = {};
        serialPort.type = 'serial';
        serialPort.brand = conn.brand;
        serialPort.serialport = conn.serialPort;
        serialPort.baudRate = conn.baudRate;
        serialPort.dataBits = conn.dataBits;
        serialPort.parity = conn.parity;
        serialPort.stopBits = conn.stopBits;
        return serialPort;
    } else { //网口
        let options = new tcpScale(conn.ip, conn.port, conn.brand);
        return options;
    }

}

// 将通讯的参数构建好，参数传递.组包成功得数据，进行回调
function devOpen(devInfo, callback) {
    if (devInfo.type === 'serial') {
        // new serialScale(devInfo.serialport, devInfo.baudRate, devInfo.dataBits, devInfo.parity, devInfo.stopBits, devInfo.brand).serialSaleOpen(rlt => {
        //     callback(rlt);
        // });
        let index = devInfo.serialport;//同一台机器接入多个串口设备,端口号是主键
        if (!serialClientsMap.has(index)) {
            serialClientsMap.set(index,  new serialScale(devInfo.serialport, devInfo.baudRate, devInfo.dataBits, devInfo.parity, devInfo.stopBits, devInfo.brand));
        }
        serialClientsMap.get(index).serialScaleOpen(rlt => {
            callback(rlt);
        })
    } else {
        let index = `${devInfo.host}:${devInfo.port}`;
        if (!tcpClientsMap.has(index)) {
            tcpClientsMap.set(index, new tcpScale(devInfo.host, devInfo.port, devInfo.brand));
        }
        tcpClientsMap.get(index).tcpScaleOpen(rlt => {
            callback(rlt);
        })

    }

}

//关闭端口
function devClose(devInfo, callback) {
    if (devInfo.type === 'serial') {
        let index =devInfo.serialport;
        if (serialClientsMap.has(index)) {
            serialClientsMap.get(index).serialScaleClose(rlt => {
                let obj = {};
                if (rlt) {
                    obj.status = 'close';
                    obj.value = `Brand：${devInfo.brand} COM: ${devInfo.serialport} Close Success`;
                } else {
                    obj.status = 'error';
                    obj.value = `Brand：${devInfo.brand} COM: ${devInfo.serialport} Close Fail`;
                }
    
                callback(obj);
            });
            serialClientsMap.delete(index);
        }

    } else {
        let index = `${devInfo.host}:${devInfo.port}`;
        if (tcpClientsMap.has(index)) {
            tcpClientsMap.get(index).tcpScaleClose(rlt => {
                let obj = {};
                if (rlt) {
                    tcpClientsMap.delete(index);
                    obj.status = 'close';
                    obj.value = `Brand：${devInfo.brand} IP: ${devInfo.host} Close Success`;
                } else {
                    obj.status = 'error';
                    obj.value = `Brand：${devInfo.brand} IP: ${devInfo.host} Close Fail`;
                }
                callback(obj);
            });
        }



    }
}


//解析梅特勒报文：
function analysisMettler(data) {
    const bufferText = Buffer.from(data, 'utf8'); // 原始应答格式：S_S_ _ _ _ _0.890_kg
    //53 20 53 20 20 20 20 20 30 2E 38 31 32 37 20 6B 67 0D 0A
    //S  _  S  _  _  _  _  _  0   .  8  1  2  7 _  k  g  回车 换行
    let a = bufferText.slice(0, 3); // S_S
    let c = bufferText.slice(3, 14); // 数据(含负号)
    let d = bufferText.slice(14, 15); //空格
    let e = bufferText.slice(15, 17); //单位
    let f = bufferText.slice(17, 19); //回车换行
    let obj = {};
    obj.brand = 'mettler';
    obj.value = parseFloat(c.toString().trim()); //重量值
    obj.unit = e.toString().trim(); //单位
    obj.status = 'open'; //a.toString().trim();// N-净重，T-皮重，G-毛重  为了保持和梅特勒一致，修改为open
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
function analysisIntec(data) {
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
    if(b.toString()==='-'){
        obj.value = parseFloat(b.toString()+d.toString().trim()); //重量值
    }else{
        obj.value = parseFloat(d.toString().trim()); //重量值
    }
    obj.unit = f.toString().trim(); //有单位--稳态，空--非稳态
    obj.status = 'open'; //a.toString().trim();// N-净重，T-皮重，G-毛重  为了保持和梅特勒一致，修改为open
    return obj;
}


//获取电子秤设备状态
function getStatus(devInfo) {
    if (devInfo.type === 'serial') {
        let index =devInfo.serialport;
        if (serialClientsMap.has(index)) {
            return serialClientsMap.get(index).serialScaleStatus();
        } else {
            return 0; //初始状态 未打开
        }

    }else{
        let index = `${devInfo.host}:${devInfo.port}`;
        if (tcpClientsMap.has(index)) {
            return tcpClientsMap.get(index).tcpScaleStatus();
        } else {
            return 0; //初始状态 未打开
        }
    }

}


//获取电子秤设备状态
function devRead(devInfo, callback) {
    if (devInfo.type === 'serial') {
        let index =devInfo.serialport;
        if (serialClientsMap.has(index)) {
            return serialClientsMap.get(index).serialScaleRead(rlt => {
                callback(rlt);
            });
        }
    }else{
        let index = `${devInfo.host}:${devInfo.port}`;
        if (tcpClientsMap.has(index)) {
            tcpClientsMap.get(index).tcpScaleRead(rlt => {
                callback(rlt);
            });
        }

    }

}





//接口导出：
module.exports.devOpen = devOpen; //打开设备
module.exports.devClose = devClose; //关闭设备
module.exports.getStatus = getStatus; //关闭设备
module.exports.devRead = devRead; //设备读
module.exports.buildDevParams = buildDevParams; //构建设备通讯参数