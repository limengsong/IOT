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
var ModbusRTU = require("modbus-serial");
var mbsini = require("./ini.js")
var client = new ModbusRTU();

var mbsStatus = "Initializing..."; // holds a status of Modbus

// Modbus 'state' constants
var MBS_STATE_INIT = "State init";
var MBS_STATE_IDLE = "State idle";
var MBS_STATE_NEXT = "State next";
var MBS_STATE_GOOD_READ = "State good (read)";
var MBS_STATE_FAIL_READ = "State fail (read)";
var MBS_STATE_GOOD_CONNECT = "State good (port)";
var MBS_STATE_FAIL_CONNECT = "State fail (port)";

// Modbus TCP configuration values
//初始化时候，读取配置文件进行填充
var mbsId ;//deviceID
var mbsPort ;
var mbsHost ;
var mbsScan ; //轮询周期
var mbsTimeout ; //设置超时时间

// var mbsId = 1;//deviceID
// var mbsPort = 502;
// var mbsHost = "172.26.15.115";
// var mbsScan = 500; //轮询周期
// var mbsTimeout = 5000; //设置超时时间
var mbsState = MBS_STATE_INIT;


// Modbus TCP 地址列表
var requestList=[];//里面存储对象{};key-功能码,value-地址列表


//==============================================================
var connectClient = async function () {
    // close port (NOTE: important in order not to create multiple connections)
    //client.close();   
    requestList=await devInit();
    // console.log('requestList',requestList);
    // console.log('mbsId',mbsId,'mbsPort',mbsPort,'mbsHost',mbsHost,'mbsScan',mbsScan,'mbsTimeout',mbsTimeout);
    // set requests parameters
    client.setID(mbsId);

    client.setTimeout(mbsTimeout);

    // try to connect
    client.connectTCP(mbsHost, {
            port: mbsPort
        })
        .then(function () {
            mbsState = MBS_STATE_GOOD_CONNECT;
            mbsStatus = "Connected, wait for reading...";
            console.log(mbsStatus);
        })
        .catch(function (e) {
            mbsState = MBS_STATE_FAIL_CONNECT;
            mbsStatus = e.message;
            console.log(e);
        });

};


//==============================================================
var readModbusData =  function () { 
    //解析requestList，进行设备读取
    if(requestList.length>0){
        for(let v of requestList){
            let fc=parseInt(v.fc);
            let address=parseInt(v.address);
            let length=parseInt(v.length);
            readDataByCfg(fc,address,length);
        }

    }
};


function readDataByCfg(fc,address,length){
    switch (fc) {
        case 1:
            readCoils(address, length);
            break;
        case 2:
            readDiscreteInputs(address, length);
            break;
        case 3:
            readHoldingRegisters(address, length);
            break;
        case 4:
            readInputRegisters(address, length);
            break;
        default:
            //
    }

}

function readCoils(address, length) {
    // try to read data (FC=1)
    client.readCoils(address, length)
        .then(function (data) {
            mbsState = MBS_STATE_GOOD_READ;
            mbsStatus = "success";
            console.log(data.buffer.readInt16BE(0));
        })
        .catch(function (e) {
            mbsState = MBS_STATE_FAIL_READ;
            mbsStatus = e.message;
            console.log(e);
        });

}

function readDiscreteInputs(address, length) {
    // try to read data(FC=2)
    client.readDiscreteInputs(address, length)
        .then(function (data) {
            mbsState = MBS_STATE_GOOD_READ;
            mbsStatus = "success";
            console.log(data.buffer.readInt16BE(0));
        })
        .catch(function (e) {
            mbsState = MBS_STATE_FAIL_READ;
            mbsStatus = e.message;
            console.log(e);
        });

}

function readHoldingRegisters(address, length) {
    // try to read data(FC=3)
    //address=modsim的address-1；（原因是：程序中地址从0开始，实际设备是从1开始。所以有偏差）
    client.readHoldingRegisters(address, length)
        .then(function (data) {
            mbsState = MBS_STATE_GOOD_READ;
            mbsStatus = "success";
            let alldata=data.buffer;
            for(let i=0;i<length;i++){
                let value=alldata.slice(2*i, 2*(i+1));
                console.log('value',value);
                let curAddress=parseInt(address+i+1);
                console.log('HoldingRegisters','当前地址',curAddress,'当前数据',value.readInt16BE(0));
            }

        })
        .catch(function (e) {
            mbsState = MBS_STATE_FAIL_READ;
            mbsStatus = e.message;
            console.log(e);
        });

}

function readInputRegisters(address, length) {
    // try to read data(FC=4)
    client.readInputRegisters(address, length)
        .then(function (data) {
            mbsState = MBS_STATE_GOOD_READ;
            mbsStatus = "success";
            console.log(data.buffer.readInt16BE(0));
        })
        .catch(function (e) {
            mbsState = MBS_STATE_FAIL_READ;
            mbsStatus = e.message;
            console.log(e);
        });

}

//==============================================================
var runModbus = async function () {
    var nextAction;
    console.log('当前状态位：', mbsState);
    switch (mbsState) {
        case MBS_STATE_INIT:
            nextAction = connectClient;
            break;

        case MBS_STATE_NEXT:
            nextAction = readModbusData;
            break;

        case MBS_STATE_GOOD_CONNECT:
            nextAction = readModbusData;
            break;

        case MBS_STATE_FAIL_CONNECT:
            nextAction = connectClient;
            break;

        case MBS_STATE_GOOD_READ:
            nextAction = readModbusData;
            break;

        case MBS_STATE_FAIL_READ:
            if (client.isOpen) {
                mbsState = MBS_STATE_NEXT;
            } else {
                nextAction = connectClient;
            }
            break;

        default:
            // nothing to do, keep scanning until actionable case
    }

    //console.log(nextAction);//=>指向下一个动作方法

    // execute "next action" function if defined
    if (nextAction !== undefined) {
        nextAction();
        mbsState = MBS_STATE_IDLE;
    }

    // set for next run
    setTimeout(runModbus, mbsScan);
};

//==============================================================

runModbus();


//初始化：读取配置文件+组态信息
async function devInit() {
    try {
        let devInfo = await mbsini.readIniFile();
        let requestCnt;
        if (devInfo.CONFIG) {
            mbsId = parseInt(devInfo.CONFIG.Id);
            mbsPort = parseInt(devInfo.CONFIG.Port);
            mbsHost = devInfo.CONFIG.Ip;
            mbsScan = parseInt(devInfo.CONFIG.Scan);
            mbsTimeout =parseInt(devInfo.CONFIG.Timeout);
            requestCnt = parseInt(devInfo.CONFIG.RequestCount);

        } else {
            console.log('ini配置文件有误');
            return -1;
        }
        
        if (requestCnt>0) {
            for(let i=0;i<requestCnt;i++){
                if(devInfo[`REQUEST${i+1}`]){
                    let tmp={};
                    tmp.fc=devInfo[`REQUEST${i+1}`].Function;
                    tmp.address=devInfo[`REQUEST${i+1}`].StartingAddress;
                    tmp.length=devInfo[`REQUEST${i+1}`].PointCount;
                    requestList[i]=tmp;
                }  
            }
        } else {
            return -1;
        }

     return requestList;
    } catch (err) {
        console.log('err', err);
    }

}

