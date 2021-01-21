/*
 * @Description: 将RFID-SDK中C++模块各个接口转为Node.js接口，供JS调用
 * @Author: limengsong
 * @LastEditors: Please set LastEditors
 * @Date: 2019-03-04 16:49:44
 * @LastEditTime: 2019-08-20 14:44:06
 */

//导入Node-ffi模块
var ffi = require('ffi');
var ref = require('ref');
var ArrayType = require('ref-array');
var int = ref.types.int;
var IntArray = ArrayType(int);
var g_cardCode='00000000'// 首次卡ID
//使用ffi.Library加载dll, 第一个参赛是库文件路径，第二个参数是JSON格式，用于定义使用的dll方法。
//int 表示整形，pointer 表示 指针地址，也可以使用 int * 表示。
const kernel32 = ffi.Library("kernel32", {
    'SetDllDirectoryA': ["bool", ["string"]]
    })
kernel32.SetDllDirectoryA(`${__dirname}/lib/`)

var dcrInstance = ffi.Library(`${__dirname}/lib/dcrf32API.dll`, {
    "dev_open": [ 'int', [  ] ],
    "dev_close":['short',[ 'int' ]],
    "dev_search_card":['short',['int',IntArray,IntArray]],
    "dev_write":['short',['int',IntArray]],
    "dev_read":['short',['int',IntArray]],
    "dev_beep":['short',['int']]
});

/**
 * 记录设备的全部状态
 * rfStatus：0(未连接、断开状态) 1（已连接、打开状态）、2（已连接、关闭状态）、3（读卡状态）、4、（写卡状态）
 * 0（默认，未连接状态）
 */
var rfStatus=0  // 设备状态，默认为未连接状态
var rfObj;// 定义全局设备对象，用来操作设备用

/**
 * 功能：设备打开。
 * 返回值：>0 打开成功，即设备标识符。
 *        -1 打开失败。
 */
function dev_open(){
    let res=dcrInstance.dev_open()// 由于设备是USB，所以波特率随意设置一个即可
    if(res>0){
        rfObj=res
        rfStatus=1
        //console.log('设备打开成功')
    }else{
        rfStatus=0
        //console.log('设备打开失败')
    }
    return res
    
}

/**
 * 功能：设备关闭。
 * 入参：设备标识符
 * 返回值：=0 关闭成功。
 *        -1 关闭失败。
 */

function dev_close(){
    if(rfObj<0){
        return -1
    }
    let nClose=dcrInstance.dev_close(rfObj)
    if(nClose===0){
        rfStatus=2
        g_cardCode='00000000'
        //console.log('设备关闭成功')
    }else{
        //console.log('设备关闭失败')
    }
    return nClose
}

/**
 * 功能：设备蜂鸣。
 * 入参：设备标识符
 * 返回值：=0 蜂鸣成功。
 *        -1 蜂鸣失败。
 */

function dev_beep(){
    if(rfObj<0){
        return -1
    }
    let nBeep=dcrInstance.dev_beep(rfObj)
    return nBeep
}

/**
 * 功能：设备寻卡并返回卡号。
 * 入参：设备标识符
 * 出参：卡号长度，卡号
 * 返回值：=0 寻卡成功。
 *         1 表示无卡或无法寻到卡片。
 *        -1 射频复位失败
 *        -2 设置卡类型失败
 *        -3 寻卡失败
 *        -4 蜂鸣失败
 */
function dev_search_card(){
    if(rfObj<0){
        return -1
    }
    let len=new Buffer(1)
    let strCode=new Buffer(4)
    let nSearchCard=dcrInstance.dev_search_card(rfObj,len,strCode)
    let resCode=strCode.toString('hex',0,4)!==''?strCode.toString('hex',0,4):'00000000'
    if(nSearchCard===0){
        // success
        if(resCode!==g_cardCode){
            g_cardCode=resCode        
            //console.log('寻新卡成功',resCode)
            dev_beep()

        }else{
            //console.log('无新卡 寻卡ing') 
            return -1 
        }
    }else{
        g_cardCode='00000000'
    }
    return g_cardCode
}

/**
 * 功能：设备读取卡扇区数据
 * 入参：设备标识符
 * 出参：卡扇区数据
 * 返回值：=0 读卡成功 
 *        -1 验证卡区密码失败
 *        -2 读卡失败
 */
function dev_read(){
    if(rfObj<0){
        return -1
    }
    let res={}
    res.ID=dev_search_card()
    if(res.ID==="00000000"||res.ID===-1){
        return -1
    }

    let codeArray= new Buffer.alloc(16).fill(0)    
    let nSuccess=dcrInstance.dev_read(rfObj,codeArray)
    if(nSuccess===0){
        rfStatus=3
        let convData = new Buffer(codeArray,'hex');//先把数据存在buf里面
        convData=convData.toString("utf-8")
        res.data=convData
        return  res
    }else{
        return nSuccess
    }
}
/**
 * 功能：设备写入卡扇区数据（写入数据必须为16字节长度，超过会崩溃）
 * 入参：设备标识符，写入内容
 * 出参：卡扇区数据
 * 返回值：=0 写卡成功 
 *        -1 验证卡区密码失败
 *        -2 写卡失败
 */
function dev_write(arrayWrite){
    if(rfObj<0){
        return -1
    }
    // 写卡的前提：要寻到卡
    let ID=dev_search_card()
    if(ID==="00000000"||ID===-1){
        return -1
    }
    let codeArray= new Buffer.from(arrayWrite)
    let len=codeArray.length
    let fillArray,concatBuf //定义待填充的buffer,以及合并后的buf
    if(len<16){
         fillArray= new Buffer.alloc(16-len).fill(0)
         concatBuf=Buffer.concat([codeArray,fillArray])
    }
    let nSuccess=dcrInstance.dev_write(rfObj,concatBuf)
    if(nSuccess===0){
        rfStatus=4
        console.log('nSuccess',nSuccess)
    }else{


    }
    return nSuccess
    
}


// 周期读卡，并返回卡内容
  function loopRead(res,period){
    timerObj =setInterval(function(){
       let readContent=dev_read(res)
       return readContent
    }, period);
}


// 停止周期读卡
function stop(){
    //step1：关闭定时器
    // clearInterval(timerObj);
    //step2：关闭设备
    return dev_close(rfObj)
}

//获取设备状态
function dev_status(){
    return rfStatus
}



// 原厂接口导出：
module.exports.dev_open = dev_open;//打开设备
module.exports.dev_close = dev_close;//关闭设备
module.exports.dev_read = dev_read;//读卡
module.exports.dev_write = dev_write;//写卡
module.exports.dev_status=dev_status//rfid设备的状态




