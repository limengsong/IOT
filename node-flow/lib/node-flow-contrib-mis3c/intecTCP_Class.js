/* eslint-disable no-console, spaced-comment, func-call-spacing, no-spaced-func */

//==============================================================
// This is an example of polling (reading) Holding Registers
// on a regular scan interval with timeouts enabled.
// For robust behaviour, the next action is not activated
// until the previous action is completed (callback served).
//==============================================================

"use strict";

//==============================================================
// create an empty modbus client
let ModbusRTU = require("modbus-serial");
let tcpIntecMap = new Map(); //记录tcp客户端的map，key=>ip：port，vallue=> new tcpScale()
// let mbsini = require("./ini.js")
// let client = new ModbusRTU();

//构建网口电子称类
class tcpIntec {
    //属性
    constructor(mbsId, mbsHost, mbsPort) {
        this.mbsId = mbsId;
        this.mbsHost = mbsHost;
        this.mbsPort = mbsPort;
        this.mbsTimeout = 1000;
        this.fc = 3;
        this.address = 0;
        this.length = 2;
        this.status = 0; //scale状态：0--设备关闭（默认），1--设备打开
        this.tcpTimer = new Object();
        this.client = new ModbusRTU();
    }

    //方法:
    intecRead(callback) {
       this.tcpTimer = setInterval(() => {
            this.client.readHoldingRegisters(this.address, this.length)
            .then(data => {
                mbsState = MBS_STATE_GOOD_READ;
                mbsStatus = "success";
                let alldata = data.buffer;
                for (let i = 0; i < this.length; i++) {
                    if (4 * (i + 1) > data.buffer.length) return;
                    let value = alldata.slice(4 * i, 4 * (i + 1));
                    value = value.swap32();
                    value = value.swap16();
                    console.log(value.readFloatBE(0));
                    let rltObj={};
                    rltObj.status='open';
                    rltObj.value=value.readFloatBE(0);
                    callback(rltObj);
                }

            })
            .catch(function (e) {
                mbsState = MBS_STATE_FAIL_READ;
                mbsStatus = e.message;
                console.log(e);
            });
       }, 1000);

    }

    intecOpen(callback) {
        if(this.status===0){
            //关闭状态就去打开
            this.client.setID(this.mbsId);
            this.client.setTimeout(1000);
            // try to connect
            this.client.connectTCP(this.mbsHost, {
                    port: this.mbsPort
                })
                .then(() => {
                    mbsState = MBS_STATE_GOOD_CONNECT;
                    mbsStatus = "Connected, wait for reading...";
                    console.log(mbsState);
                    this.status = 1; //设备打开
                    callback(mbsState)
    
                })
                .catch(function (e) {
                    mbsState = MBS_STATE_FAIL_CONNECT;
                    mbsStatus = e.message;
                    console.log(e);
                });

        }



    }
    intecClose() {
        this.status = 0; //设备关闭
        this.client.close();
    }

}




let mbsStatus = "Initializing..."; // holds a status of Modbus
// Modbus 'state' constants
let MBS_STATE_INIT = "State init";
let MBS_STATE_IDLE = "State idle";
let MBS_STATE_NEXT = "State next";
let MBS_STATE_GOOD_READ = "State good (read)";
let MBS_STATE_FAIL_READ = "State fail (read)";
let MBS_STATE_GOOD_CONNECT = "State good (port)";
let MBS_STATE_FAIL_CONNECT = "State fail (port)";

// Modbus TCP configuration values


let mbsState = MBS_STATE_INIT;

// 将通讯的参数构建好，参数传递.组包成功得数据，进行回调
function devOpen(devInfo, callback) {
    let index = `${devInfo.mbsHost}:${devInfo.mbsPort}`;
    if (!tcpIntecMap.has(index)) {
        tcpIntecMap.set(index, new tcpIntec(devInfo.mbsId, devInfo.mbsHost, devInfo.mbsPort));
    }
    tcpIntecMap.get(index).intecOpen(rlt => {
        callback(rlt);
    });

}

// 将通讯的参数构建好，参数传递.组包成功得数据，进行回调

//获取电子秤设备状态
function devRead(devInfo, callback) {
    let index = `${devInfo.mbsHost}:${devInfo.mbsPort}`;
    if (!tcpIntecMap.has(index)) {
        tcpIntecMap.set(index, new tcpIntec(devInfo.mbsId, devInfo.mbsHost, devInfo.mbsPort));
    }
    if(tcpIntecMap.get(index).status===0){
        tcpIntecMap.get(index).intecOpen(rlt => {
            callback(rlt);
        });
    }
    tcpIntecMap.get(index).intecRead(rlt => {
        callback(rlt);
    });



}


//获取电子秤设备状态
function devClose(devInfo) {
    let index = `${devInfo.mbsHost}:${devInfo.mbsPort}`;
    if (tcpIntecMap.has(index)) {
        clearInterval(tcpIntecMap.get(index).tcpTimer);
        tcpIntecMap.get(index).intecClose();
    }



}



//接口导出：
module.exports.devOpen = devOpen;
module.exports.devClose = devClose;
module.exports.devRead = devRead;
