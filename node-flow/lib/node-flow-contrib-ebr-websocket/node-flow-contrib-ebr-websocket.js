/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-07-01 19:42:00
 * @LastEditTime: 2019-11-18 14:23:19
 * @LastEditors: Please set LastEditors
 */
/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var ws = require("ws");
    var inspect = require("util").inspect;
    var url = require("url");

    var serverUpgradeAdded = false;
    function handleServerUpgrade(request, socket, head) {
        const pathname = url.parse(request.url).pathname;
        if (listenerNodes.hasOwnProperty(pathname)) {
            listenerNodes[pathname].server.handleUpgrade(request, socket, head, function done(ws) {
                listenerNodes[pathname].server.emit('connection', ws, request);
            });
        } else {
            // Don't destroy the socket as other listeners may want to handle the
            // event.
        }
    }
    var listenerNodes = {};
    var activeListenerNodes = 0;


    // // A node red node that sets up a local websocket server
    function EBRWebSocketListenerNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);
        var node = this;

        // Store local copies of the node configuration (as defined in the .html)
        node.path = n.path;
        node.wholemsg = (n.wholemsg === "true");

        node._inputNodes = [];    // collection of nodes that want to receive events
        node._clients = {};
        // match absolute url
        node.isServer = !/^ws{1,2}:\/\//i.test(node.path);
        node.closing = false;
        node.tls = n.tls;

        function startconn() {    // Connect to remote endpoint
            node.tout = null;
            var options = {};
            if (node.tls) {
                var tlsNode = RED.nodes.getNode(node.tls);
                if (tlsNode) {
                    tlsNode.addTLSOptions(options);
                }
            }
            var socket = new ws(node.path,options);
            socket.setMaxListeners(0);
            node.server = socket; // keep for closing
            handleConnection(socket);
        }

        function handleConnection(/*socket*/socket) {
            var id = (1+Math.random()*4294967295).toString(16);
            if (node.isServer) {
                node._clients[id] = socket;
                node.emit('opened',{count:Object.keys(node._clients).length,id:id});
            }
            socket.on('open',function() {
                if (!node.isServer) {
                    node.emit('opened',{count:'',id:id});
                }
            });
            socket.on('close',function() {
                if (node.isServer) {
                    delete node._clients[id];
                    node.emit('closed',{count:Object.keys(node._clients).length,id:id});
                } else {
                    node.emit('closed',{count:'',id:id});
                }
                if (!node.closing && !node.isServer) {
                    clearTimeout(node.tout);
                    node.tout = setTimeout(function() { startconn(); }, 3000); // try to reconnect every 3 secs... bit fast ?
                }
            });
            socket.on('message',function(data,flags) {
                node.handleEvent(id,socket,'message',data,flags);
            });
            socket.on('error', function(err) {
                node.emit('erro',{err:err,id:id});
                if (!node.closing && !node.isServer) {
                    clearTimeout(node.tout);
                    node.tout = setTimeout(function() { startconn(); }, 3000); // try to reconnect every 3 secs... bit fast ?
                }
            });
        }

        if (node.isServer) {
            activeListenerNodes++;
            if (!serverUpgradeAdded) {
                RED.server.on('upgrade', handleServerUpgrade);
                serverUpgradeAdded = true
            }

            var path = RED.settings.httpNodeRoot || "/";
            path = path + (path.slice(-1) == "/" ? "":"/") + (node.path.charAt(0) == "/" ? node.path.substring(1) : node.path);
            node.fullPath = path;

            if (listenerNodes.hasOwnProperty(path)) {
                node.error(RED._("websocket.errors.duplicate-path",{path: node.path}));
                return;
            }
            listenerNodes[node.fullPath] = node;
            var serverOptions = {
                noServer: true
            }
            if (RED.settings.webSocketNodeVerifyClient) {
                serverOptions.verifyClient = RED.settings.webSocketNodeVerifyClient;
            }
            // Create a WebSocket Server
            node.server = new ws.Server(serverOptions);
            node.server.setMaxListeners(0);
            node.server.on('connection', handleConnection);
        }
        else {
            node.closing = false;
            startconn(); // start outbound connection
        }

        node.on("close", function() {
            if (node.isServer) {
                delete listenerNodes[node.fullPath];
                node.server.close();
                node._inputNodes = [];
                activeListenerNodes--;
                if (activeListenerNodes === 0 && serverUpgradeAdded) {
                    RED.server.removeListener('upgrade', handleServerUpgrade);
                    serverUpgradeAdded = false;
                }


            }
            else {
                node.closing = true;
                node.server.close();
                if (node.tout) {
                    clearTimeout(node.tout);
                    node.tout = null;
                }
            }
        });
    }
    RED.nodes.registerType("ebr-websocket-listener",EBRWebSocketListenerNode);
    RED.nodes.registerType("ebr-websocket-client",EBRWebSocketListenerNode);

    EBRWebSocketListenerNode.prototype.registerInputNode = function(/*Node*/handler) {
        this._inputNodes.push(handler);
    }

    EBRWebSocketListenerNode.prototype.removeInputNode = function(/*Node*/handler) {
        this._inputNodes.forEach(function(node, i, inputNodes) {
            if (node === handler) {
                inputNodes.splice(i, 1);
            }
        });
    }

    EBRWebSocketListenerNode.prototype.handleEvent = function(id,/*socket*/socket,/*String*/event,/*Object*/data,/*Object*/flags) {
        var msg;
        if (this.wholemsg) {
            try {
                msg = JSON.parse(data);
            }
            catch(err) {
                msg = { payload:data };
            }
        } else {
            msg = {
                payload:data
            };
        }
        msg._session = {type:"websocket",id:id};
        for (var i = 0; i < this._inputNodes.length; i++) {
            this._inputNodes[i].send(msg);
        }
    }

    EBRWebSocketListenerNode.prototype.broadcast = function(data) {
        try {
            if (this.isServer) {
                for (let client in this._clients) {
                    if (this._clients.hasOwnProperty(client)) {
                        this._clients[client].send(data);
                    }
                }
            }
            else {
                this.server.send(data);
            }
        }
        catch(e) { // swallow any errors
            this.warn("ws:"+i+" : "+e);
        }
    }

    EBRWebSocketListenerNode.prototype.reply = function(id,data) {
        var session = this._clients[id];
        if (session) {
            try {
                session.send(data);
            }
            catch(e) { // swallow any errors
            }
        }
    }

    function EBRWebSocketInNode(n) {
        RED.nodes.createNode(this,n);
        this.server = (n.client)?n.client:n.server;
        var node = this;
        this.serverConfig = RED.nodes.getNode(this.server);
        if (this.serverConfig) {
            this.serverConfig.registerInputNode(this);
            // TODO: nls
            this.serverConfig.on('opened', function(event) {
                node.status({
                    fill:"green",shape:"dot",text:RED._("websocket.status.connected",{count:event.count}),
                    event:"connect",
                    _session: {type:"websocket",id:event.id}
                });
                // node.send('count',{count:event.count});//lms
                // let aaa=event.count;
                // console.log('aaa',aaa);
                //  console.log('lms',event.count);
                let connect={};
                connect.count=event.count;//lms
                connect.event = "connect";
                connect._session = {type:"websocket",id:event.id};
                node.send(connect);
            });
            this.serverConfig.on('erro', function(event) {
                node.status({
                    fill:"red",shape:"ring",text:"common.status.error",
                    event:"error",
                    _session: {type:"websocket",id:event.id}
                });
            });
            this.serverConfig.on('closed', function(event) {
                var status;
                if (event.count > 0) {
                    status = {fill:"green",shape:"dot",text:RED._("websocket.status.connected",{count:event.count})};
                } else {
                    status = {fill:"red",shape:"ring",text:"common.status.disconnected"};
                }
                status.count=event.count;//lms
                status.event = "disconnect";
                status._session = {type:"websocket",id:event.id}
                node.status(status);
                node.send(status);
            });
        } else {
            this.error(RED._("websocket.errors.missing-conf"));
        }
        this.on('close', function() {
            if (node.serverConfig) {
                node.serverConfig.removeInputNode(node);
            }
            node.status({});
        });
    }
    RED.nodes.registerType("ebr-websocket in",EBRWebSocketInNode);

    function EBRWebSocketOutNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.server = (n.client)?n.client:n.server;
        this.serverConfig = RED.nodes.getNode(this.server);
        if (!this.serverConfig) {
            return this.error(RED._("websocket.errors.missing-conf"));
        }
        else {
            // TODO: nls
            this.serverConfig.on('opened', function(event) {
                node.status({
                    fill:"green",shape:"dot",text:RED._("websocket.status.connected",{count:event.count}),
                    event:"connect",
                    _session: {type:"websocket",id:event.id}
                }); 
            });
            this.serverConfig.on('erro', function(event) {
                node.status({
                    fill:"red",shape:"ring",text:"common.status.error",
                    event:"error",
                    _session: {type:"websocket",id:event.id}
                })
            });
            this.serverConfig.on('closed', function(event) {
                var status;
                if (event.count > 0) {
                    status = {fill:"green",shape:"dot",text:RED._("websocket.status.connected",{count:event.count})};
                } else {
                    status = {fill:"red",shape:"ring",text:"common.status.disconnected"};
                }
                status.event = "disconnect";
                status._session = {type:"websocket",id:event.id}
                node.status(status);
            });
        }
        this.on("input", function(msg) {
            var payload;
            if (this.serverConfig.wholemsg) {
                var sess;
                if (msg._session) { sess = JSON.stringify(msg._session); }
                delete msg._session;
                payload = JSON.stringify(msg);
                if (sess) { msg._session = JSON.parse(sess); }
            }
            else if (msg.hasOwnProperty("payload")) {
                if (!Buffer.isBuffer(msg.payload)) { // if it's not a buffer make sure it's a string.
                    payload = RED.util.ensureString(msg.payload);
                }
                else {
                    payload = msg.payload;
                }
            }
            if (payload) {
                if (msg._session && msg._session.type == "websocket") {
                    node.serverConfig.reply(msg._session.id,payload);
                } else {
                    node.serverConfig.broadcast(payload,function(error) {
                        if (!!error) {
                            node.warn(RED._("websocket.errors.send-error")+inspect(error));
                        }
                    });
                }
            }
        });
        this.on('close', function() {
            node.status({});
        });
    }
    RED.nodes.registerType("ebr-websocket out",EBRWebSocketOutNode);
}
