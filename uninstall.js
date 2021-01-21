/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-09-29 09:16:12
 * @LastEditTime: 2019-11-26 16:26:08
 * @LastEditors: Please set LastEditors
 */
const svc = require('./install.js').svc;

svc.on('uninstall', () => {
    console.log(`${svc.description}`);
    console.log(`${svc.description}服务状态：`, svc.exists);    
});



svc.uninstall();


