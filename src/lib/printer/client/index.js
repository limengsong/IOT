/**
 * 打印机的操作方法，供Node-Red用
 * limengsong
 * 2019-4-12
 */
var printer = require("../index.js");
var binding = require("./binding.js");


/**
 * 获取系统打印机列表
 * 参数：无
 * 返回值：
 * array：返回本机打印机列表
 * -1：获取失败
 *  */ 
function getPrinters() {
    let printerArrays = printer.getPrinters()
    if(printerArrays.length>0){
        return printerArrays
    }else{
        return -1
    }
}


/**
 * 检测打印机是否在线
 * 参数：被测打印机名称
 * 返回值：
 * true：在线
 * false：离线
 *  */ 
function checkOnline(name) {
    let bOnline=false
    let selectPrinter=getPrinters()
    let printerAtt=selectPrinter.find(selectPrinter => selectPrinter.name === name)
   if (printerAtt!==undefined){
        if(printerAtt.attributes.includes('OFFLINE')){
            bOnline=false
        }else{
            bOnline=true
        }
   }


    return bOnline
}


/**
 * 检测打印机是否支持ZPL
 * 参数：被测打印机名称
 * 返回值：
 * true：支持
 * false：不支持
 *  */ 
function supportZPL(name) {
    let bSupport=false
    if(name.includes('ZPL')){
        //  support
        bSupport= true
    }else{
        //  not support
        bSupport= false
    }
    return bSupport
}



//
/**
 * 打印ZPL命令
 * 参数：ZPL指令，所选打印机名称
 * 返回值：
 * true：打印成功
 * false：打印失败
 *  */ 
function printCode(req) {
    let res={};
    res.result=false;
    res.zpl='';
    if(req){
        let printerName = req.printerName;
        let zpl=binding.dataBinding(req);//标签字段替换
        if(!zpl){
            return res;	
        }
        res.zpl=zpl;
        printer.printDirect({
              data:zpl
            , printer:printerName
            , type: "RAW"
            , success:function(){
                res.result=true;
            }
            , error:function(err){console.log(err); res.result=false;}
        });

    }else{
        res.result=false;
    }

	return res;	
}



// 接口导出：
module.exports.getPrinters = getPrinters; //获取打印机列表
module.exports.checkOnline = checkOnline; //检测设备是否在线
module.exports.supportZPL = supportZPL; //检测设备是否支持ZPL
module.exports.printCode = printCode; //打印ZPL指令