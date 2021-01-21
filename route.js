// ---route.js 文件---


var express = require('express');
var http = require('http');
//如果第三方api是https，则以上为var https = require('https')
//下面的代码 http 处相应更改为 https，并将80端口更新为 443
let router = express.Router();
let _fn;
let apiHost ='';//TODO:应为传过来的地址
let token;
let urlMode; //ip 或者非ip


//转发 get 请求
router.get('/', function(req, res, next){
    var path = req.originalUrl;
    _fn.getData(path, function(data){
        res.send(data);
    });
});

//转发 post 请求
router.post('/', function(req, res, next){
    let path = req.originalUrl;
    let content = req.body;
    //判断转发API的功能类型
    if(path==='/webs/login'){
        path='/api/login';//处理登陆--只有登录带目标的IP地址
        apiHost= req.body.address;//login时候设置目标IP,logout清除目标IP
        urlMode=checkUrlType(apiHost);
        _fn.postLogin(path, content,urlMode, function(data){
            res.send(data);
        });
    }else if(path='/webs/wks'){
        if(apiHost===''){
            //若检测到apiHost为空,通知客户端清除token,强制重新登录
            let data={
                "err":'Fail',
                "info":"apiHost为空,请重新登录"
            }
            res.send(data);
            return;
        }
        path='/data/product';//处理获取工站、注册等操作
        _fn.postQql(path, content,urlMode, function(data){
            res.send(data);
        });
    }else if(path='/webs/reg'){
        path='/data/product';//注册设备到目标工作站
        if(apiHost===''){
            //若检测到apiHost为空,通知客户端清除token,强制重新登录
            let data={
                "err":'Fail',
                "info":"apiHost为空,请重新登录"
            }
            res.send(data);
            return;
        }
        _fn.postQql(path, content,urlMode,  function(data){
            res.send(data);
        });
    }else if(path='/webs/check'){
        path='/data/base';//检查设备编码唯一性
        if(apiHost===''){
            //若检测到apiHost为空,通知客户端清除token,强制重新登录
            let data={
                "err":'Fail',
                "info":"apiHost为空,请重新登录"
            }
            res.send(data);
            return;
        }
        _fn.postQql(path, content,urlMode,  function(data){
            res.send(data);
        });
    }
});

_fn = {
    getData: function(path, callback){
        http.get({
            hostname: apiHost,
            path: path
        }, function(res){
            var body = [];
            res.on('data', function(chunk){
                body.push(chunk);
            });
            res.on('end', function(){
                body = Buffer.concat(body);
                callback(body.toString());
            });
        });
    },
    // ebr服务端系统登录
    postLogin: function(path, data,urlMode,  callback){
        data = data || {};
        content = JSON.stringify(data);
        var options = {
            host: apiHost,
            port: urlMode===1?80:80,//ip对应3000端口，非IP 如域名 对应80端口
            path: path,
            method: 'POST',
            headers:{
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            }
        };
        var req =http.request(options, function(res){
            res.setEncoding('utf8'); 
            let postResult;
            res.on('data',  data =>{ 
                postResult=JSON.parse(data);
            }); 
            res.on('end',()=>{
                //请求结束
                token=postResult.data.token;
                callback(postResult);
            });

        });
        req.on('error', function (e) { 
            console.log('problem with request: ' + e.message); 
            callback(e.message);
        }); 
        req.write(content);
        req.end()




    },
    //ebr-Qraphql请求 查询工站+注册设备+查询编码唯一性
    postQql: function(path, data,urlMode,  callback){
        data = data || {};
        content = JSON.stringify(data);
        var options = {
            host: apiHost,
            port: urlMode===1?80:80,//ip对应3000端口，非IP 如域名 对应80端口
            path: path,
            method: 'POST',
            headers:{
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'x-access-token': token
            }
        };
        var req =http.request(options, function(res){
            res.setEncoding('utf8'); 
            let postResult;
            res.on('data',  data =>{ 
                postResult=data;
            }); 
            res.on('end',function(){
                //请求结束
                callback(JSON.parse(postResult));
            });

        });
        req.on('error', function (e) { 
            console.log('problem with request: ' + e.message); 
            callback(e.message);
        }); 
        req.write(content);
        req.end()




    }
   
};

function checkUrlType(url){
    const ipCheck = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;     
    //const domainCheck = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;
    let urlType;//1-ip ;2-非IP
    if(ipCheck.test(url)){
        urlType=1;
    }else{
        urlType=2;
    }
    return urlType;
}


module.exports = router; 