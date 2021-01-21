/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-07-01 19:42:03
 * @LastEditTime: 2019-08-19 10:55:16
 * @LastEditors: Please set LastEditors
 */
/** 
 * 打印机ZPL模板数据绑定
 * 占位符<=>业务字段 对应关系
 * limengsong
 */



/** 
 * -------------- 占位符 <-------->  业务字段   -------------  
 * --------------- %WO% <---------> "%WO%"-------------  
 * 即占位符（样本字段）与客户端传的业务字段保持一致即可！
 * 
 * */ 
function dataBinding(obj){
    if(obj=== null){
        return -1;
    }
    const type=obj.type;
    //TODO: 为后期留扩展接口,针对不同的品牌类型做不同的适配解析
    if(type==='ZPL'){
        let template=obj.template
        let reg= /\%(.+?)\%/g; //筛选ZPL中所有的%FIELDS%
        let allFields=template.match(reg);//获取所有的样本字段（含有重复字段）
        let zplFields=Array.from(new Set(allFields))//去重
    
        for (let v of zplFields) {
            if(v in obj){//v为样本字段名称，同时也是属性名称
                let  business=obj[v];
                template=template.replace(new RegExp(v,"g"),business);//正则全部替换
            }
        }
        
        //替换变量后：引入中文字符集
        let characterTarStr=`^LS0`;
        let characterUtf8=`^LS0\r\n^CI28\r\n^CW1,E:SIMSUN.TTF`;
        let strTmp=template.replace(characterTarStr,characterUtf8)//加入字符集
        //更新打印字符版本
        let templateFinished=strTmp.replace(/A0N/g,'A1N');//将字符版本升为引入库版本
        return templateFinished
    }else{
        //TODO: 惠普、东芝等等，未来扩展
        return -1;
    }
    

}


module.exports.dataBinding = dataBinding; //数据模板绑定