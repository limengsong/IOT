/*
 * @Description: 将HoliEBR终端应用做成windows自启动服务
 * @Author: limengsong
 * @Date: 2019-09-26 14:47:40
 * @LastEditTime: 2019-11-26 16:23:37
 * @LastEditors: Please set LastEditors
 */
let Service = require('node-windows').Service;
let svc = new Service({
    name: `external-device`, //服务名称
    description: `HoliEBR终端服务`, //描述
    script: 'app.js' //nodejs项目要启动的文件路径
});


svc.on('install', () => {
    svc.start();
    console.log('HoliEBR服务已启动');
});

console.log('HoliEBR服务状态:',svc.exists);
if(!svc.exists){
    svc.install();
}else{
    console.log('HoliEBR服务已启动')
}


//对象导出：
module.exports.svc= svc;

