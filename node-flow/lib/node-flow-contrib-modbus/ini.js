/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-10-20 09:43:22
 * @LastEditTime: 2019-12-05 15:10:53
 * @LastEditors: Please set LastEditors
 */
const ini = require('ini');
const fs = require('fs');

//读取配置文件内容：返回配置文件对象
 function readIniFile() {
    return new Promise((resolve, reject) => {
        fs.readFile('./modbusTCP_cfg.ini','utf-8',function(err,data){
            if(err){
                reject(err);
            }
            else{
                let file=ini.parse(data);
                resolve(file);
            }
        });
    });
}


//接口导出：
module.exports.readIniFile = readIniFile; //读文件
