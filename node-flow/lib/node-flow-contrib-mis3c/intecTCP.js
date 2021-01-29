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
let mbsini = require("./ini.js")
let client = new ModbusRTU();

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
//初始化设备信息，
let intecObj = {
    mbsId: '', //deviceID
    mbsPort: '',
    mbsHost: '',
    mbsScan: 1000,
    mbsTimeout: 1000,
    fc: 3, //TODO:intec  写死功能码 
    address: 0, //TODO:intec  帧起始地址 
    length: 2 //TODO:intec  请求的寄存器个数（一个寄存器为16位）
};

let mbsState = MBS_STATE_INIT;
// Modbus TCP 地址列表
let requestList = []; //里面存储对象{};key-功能码,value-地址列表
//==============================================================
let connectClient = async function () {
    // close port (NOTE: important in order not to create multiple connections)
    //client.close();
    client.setID(intecObj.mbsId);

    client.setTimeout(intecObj.mbsTimeout);

    // try to connect
    client.connectTCP(intecObj.mbsHost, {
            port: intecObj.mbsPort
        })
        .then(function () {
            mbsState = MBS_STATE_GOOD_CONNECT;
            mbsStatus = "Connected, wait for reading...";
            //console.log(mbsStatus);
        })
        .catch(function (e) {
            mbsState = MBS_STATE_FAIL_CONNECT;
            mbsStatus = e.message;
            console.log(e);
        });

};


//==============================================================
let readModbusData = function () {
    //解析requestList，进行设备读取
    // if(requestList.length>0){
    //     for(let v of requestList){
    //         let fc=parseInt(v.fc);
    //         let address=parseInt(v.address);
    //         let length=parseInt(v.length);
    //         readDataByCfg(fc,address,length);
    //     }

    // }
    //TODO：茵泰克方式写死
    readDataByCfg(intecObj.fc, intecObj.address, intecObj.length);
};


function readDataByCfg(fc, address, length) {
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
            console.log('data.data', data.data);
            for (let i = 0; i < length; i++) {
                let curAddress = parseInt(address + i + 1);
                console.log('readCoils==>', '当前地址', curAddress, 'data', Number(data.data[i]));
            }
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
            // console.log('value==》',data.data);
            // console.log('请求的原始数据 ==》:',data.buffer,'len:',data.buffer.length);
            let alldata = data.buffer;
            //alldata = Buffer.from(alldata, 'utf8'); // 原始数据
            for (let i = 0; i < length; i++) {
                if (4 * (i + 1) > data.buffer.length) return;
                let value = alldata.slice(4 * i, 4 * (i + 1));
                value = value.swap32();
                value = value.swap16();
                //console.log('value：', value.readFloatBE(0));
                return value.readFloatBE(0);
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

function buildIntec(devPrams) {
    intecObj.mbsId = devPrams.mbsId;
    intecObj.mbsPort = devPrams.mbsPort;
    intecObj.mbsHost = devPrams.mbsHost;
}
//==============================================================
let runModbus = async function (devPrams) {
    let nextAction;
    //console.log('当前状态位：', mbsState);
    if (intecObj.mbsId === '') {
        buildIntec(devPrams); //构建设备信息
    }
    switch (mbsState) {
        case MBS_STATE_INIT:
            nextAction = connectClient;
            break;

        case MBS_STATE_NEXT:
            nextAction = readModbusData(devPrams);
            break;

        case MBS_STATE_GOOD_CONNECT:
            nextAction = readModbusData(devPrams);
            break;

        case MBS_STATE_FAIL_CONNECT:
            nextAction = connectClient;
            break;

        case MBS_STATE_GOOD_READ:
            nextAction = readModbusData(devPrams);
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
    //setTimeout(runModbus, mbsScan);
};

//==============================================================

//setInterval(()=>runModbus(),2000);

// runModbus();



//接口导出：
module.exports.intecRead = runModbus; //读取mbs数据
//module.exports.intecInit = connectClient; //设备参数初始化连接
// module.exports.intecRead = runModbus; //读取mbs数据