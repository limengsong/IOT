/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-08-22 15:18:15
 * @LastEditTime: 2019-11-26 15:24:34
 * @LastEditors: Please set LastEditors
 */
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var RED = require("node-red");
var debug = require('debug')('lms-app:server');
var http = require('http');
var cors = require('cors');
var app = express();
// var printer = require("./src/lib/printer/client"); //打印机相关的方法
var public = require("./src/lib/public"); //公共方法

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
var allowCors = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'x-requested-with,Content-Type,x-access-token');
  res.header('Access-Control-Allow-Credentials','true');
  next();
};
app.use(allowCors);//使用跨域中间件

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//TODO:拦截带webs字样的url---转发webserver上的API
var route = require('./route.js');
app.use('/webs/*', route);



// module.exports = app;
/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * 创建打印机相关的API
 */

//获取打印机列表
// app.get('/printer/getList', function (req, res) {
//   let printerList = printer.getPrinters();
//   res.json({
//     data: printerList
//   });

// })

// //打印
// app.post('/printer/print', function (req, res) {
//   let printerName = req.body.data.printerName;
//   let printerData = req.body.data.template;
//   if (printerName && printerData) {
//     let bPrintRlt = printer.printCode(req.body.data);
//     if (bPrintRlt.result) {
//       res.json({
//         data: bPrintRlt.zpl,
//         printer: printerName,
//         result: "success",
//       });
//     } else {
//       res.json({
//         data: bPrintRlt.zpl,
//         printer: printerName,
//         result: "fail"
//       });
//     }
//   } else {
//     res.json({
//       data: "数据格式不正确"
//     });
//   }
// })

//获取本机IP列表
app.get('/api/ips', function (req, res) {
  let IpList = public.getLocalIps();
  res.json({
    data: IpList
  });

})

//获取本机com列表
app.get('/coms', function (req, res) {
  public.portList().then(item => {
    //do something
    res.json({
      data: item
    });
  }).catch(err => {
    res.json({
      data: item
    });
  })

})


// Create the settings object - see default settings.js file for other options
var settings = {
  flowFile: `${__dirname}/node-flow/flows_lms-pc.json`,
  httpAdminRoot: "/red", //启用node-red页面
  //httpAdminRoot:'disableEditor',//禁用node-red页面
  httpNodeRoot: "/api",
  userDir: `${__dirname}/node-flow`,
  nodesDir: `${__dirname}/node-flow/lib`,
  functionGlobalContext: {}, // enables global context
  paletteCategories: [ 'input', 'output', 'function','EBR', 'SCALE' ],
  httpNodeCors: {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  }
};
// Create a server
var server = http.createServer(app);
// Initialise the runtime with a server and settings
RED.init(server, settings);
// Serve the editor UI from /red
app.use(settings.httpAdminRoot, RED.httpAdmin);
// Serve the http nodes UI from /api
app.use(settings.httpNodeRoot, RED.httpNode);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

RED.start();
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ?
    'Pipe ' + port :
    'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ?
    'pipe ' + addr :
    'port ' + addr.port;
  debug('Listening on ' + bind);
}