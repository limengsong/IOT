(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-560d4c76"],{7889:function(e,t,i){"use strict";i.r(t);var s=function(){var e=this,t=e.$createElement,i=e._self._c||t;return i("div",{staticClass:"content"},[i("top-bottom",{scopedSlots:e._u([{key:"top",fn:function(){return[i("Card",{staticStyle:{height:"100%"},attrs:{title:"RFID列表"}},[i("ButtonGroup",[i("i-button",{attrs:{icon:"md-refresh"},on:{click:e.refresh}}),i("i-button",{attrs:{icon:"md-add-circle",disabled:e.testDis},on:{click:e.register}})],1),i("i-switch",{attrs:{disabled:e.testDis},on:{"on-change":e.testOpen},model:{value:e.testStatus,callback:function(t){e.testStatus=t},expression:"testStatus"}}),i("Table",{ref:"currentRowTable",attrs:{"highlight-row":"",columns:e.RfidColumns,data:e.RfidData},on:{"on-row-click":e.onClick}})],1)]},proxy:!0},{key:"bottom",fn:function(){return[i("Card",{style:e.logStyle},[i("p",{attrs:{slot:"title"},slot:"title"},[e._v(" 调试日志 ")]),i("p",{attrs:{slot:"extra"},slot:"extra"},[i("Button",{attrs:{icon:"ios-trash"},on:{click:e.trash}},[e._v("清空")])],1),e._l(e.logList,(function(t,s){return i("div",{key:s,style:{color:e.getColors(t)}},[e._v(" "+e._s(t)+" ")])}))],2)]},proxy:!0}])}),i("Modal",{attrs:{title:"注册"},model:{value:e.modalVisible,callback:function(t){e.modalVisible=t},expression:"modalVisible"}},[i("Form",{ref:"deviceItem",attrs:{model:e.deviceItem,rules:e.ruleDevice,"label-width":80}},[i("FormItem",{attrs:{label:"编码",prop:"code"}},[i("Input",{attrs:{placeholder:"请输入设备编码"},model:{value:e.deviceItem.code,callback:function(t){e.$set(e.deviceItem,"code",t)},expression:"deviceItem.code"}})],1),i("FormItem",{attrs:{label:"名称"}},[i("Input",{attrs:{disabled:"disabled",placeholder:"请输入设备名称"},model:{value:e.deviceItem.name,callback:function(t){e.$set(e.deviceItem,"name",t)},expression:"deviceItem.name"}})],1),i("FormItem",{attrs:{label:"类型"}},[i("Input",{attrs:{disabled:"disabled"},model:{value:e.deviceItem.type,callback:function(t){e.$set(e.deviceItem,"type",t)},expression:"deviceItem.type"}})],1),i("FormItem",{attrs:{label:"通信地址",prop:"wsAddress"}},[i("Select",{model:{value:e.deviceItem.wsAddress,callback:function(t){e.$set(e.deviceItem,"wsAddress",t)},expression:"deviceItem.wsAddress"}},e._l(e.RfidWsUrl,(function(t){return i("Option",{key:t.value,attrs:{value:t.text}},[e._v(" "+e._s(t.text)+" ")])})),1)],1),i("FormItem",{attrs:{label:"工作站"}},[i("Select",{model:{value:e.deviceItem.wkStation,callback:function(t){e.$set(e.deviceItem,"wkStation",t)},expression:"deviceItem.wkStation"}},e._l(e.allWks,(function(t){return i("Option",{key:t.code,attrs:{value:t.code}},[e._v(" "+e._s(t.name)+" ")])})),1)],1)],1),i("div",{attrs:{slot:"footer"},slot:"footer"},[i("Button",{attrs:{type:"text"},on:{click:function(t){return e.cancel("deviceItem")}}},[e._v("取消")]),i("Button",{directives:[{name:"click-time",rawName:"v-click-time"}],attrs:{type:"primary"},on:{click:function(t){return e.ok("deviceItem")}}},[e._v("确定")])],1)],1)],1)},n=[],a=(i("a4d3"),i("e01a"),i("d28b"),i("99af"),i("7db0"),i("caad"),i("b0c0"),i("d3b7"),i("4d63"),i("ac1f"),i("25f0"),i("2532"),i("3ca3"),i("5319"),i("ddb0"),i("53ca")),r=(i("96cf"),i("1da1")),o=i("23f4"),c=i("c6e7"),l=i("f121"),d={components:{topBottom:o["b"]},mixins:[c["a"]],data:function(){var e=this,t=function(t,i,s){if(!i)return s(new Error("code:".concat(i,"不能为空!")));var n='query($code:String!) {\n                                    db_exists(\n                                        type:"Device"\n                                        where:{\n                                        id_not:null\n                                        code: $code\n                                        }\n                                    )\n                                    }',a={query:n,variables:{code:i}};e.$ajax.post("webs/check",null,a).then((function(e){e.data.db_exists?s(new Error("code:".concat(i,"已经存在！"))):s()}))};return{testStatus:!1,modalVisible:!1,logStyle:{height:"100%"},localIpAdds:[],RfidWsUrl:[],allWks:[],testDis:!0,seenTcp:!1,seenSerial:!1,selectRow:{},RfidWS:{},RfidColumns:[{type:"index",width:60,align:"center"},{title:"Name",key:"name"},{title:"Address",key:"path"}],RfidData:[],logList:[],wkcInfo:[],deviceItem:{code:"",name:"",type:"",wsAddress:"",wkStation:""},ruleDevice:{code:[{validator:t,trigger:"blur"}],wsAddress:[{required:!0,message:"请选择设备通信地址"}]}}},methods:{cancel:function(e){this.modalVisible=!1,this.$refs[e].resetFields()},ok:function(e){var t=this;this.$refs[e].validate(function(){var i=Object(r["a"])(regeneratorRuntime.mark((function i(s){var n,a,r;return regeneratorRuntime.wrap((function(i){while(1)switch(i.prev=i.next){case 0:if(!s){i.next=16;break}return n={},n.code=t.$refs[e].model.code,n.name=t.$refs[e].model.name,n.deviceType=t.$refs[e].model.type,n.address=t.$refs[e].model.wsAddress,n.status="REGISTER",n.workStation={connect:{code:t.$refs[e].model.wkStation}},a="\n                            mutation ($create: DeviceCreateInput!){\n                            createDevice(\n                                data:$create\n                            )\n                            {\n                                id\n                                name\n                            }\n                            }\n                         ",{query:a,variables:{create:n}},i.next=12,t.regDevice(n);case 12:r=i.sent,r&&(t.$Message.success("创建设备".concat(r,"成功！")),t.modalVisible=!1),i.next=17;break;case 16:t.$Message.error("校验设备信息失败！");case 17:case"end":return i.stop()}}),i)})));return function(e){return i.apply(this,arguments)}}())},checkTarAdds:function(e){return""!==e&&void 0!==e&&!(!this.isValidIP(e)&&!this.isValidUrl(e))},isValidIP:function(e){var t=/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;return t.test(e)},isValidUrl:function(e){var t=/^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,i=new RegExp(t);return!!i.test(e)},testOpen:function(e){var t=this;if("{}"===JSON.stringify(this.selectRow))this.makeLog("未选中任何电子称"),this.testStatus=!1;else if(e){console.log("this.selectRow",this.selectRow);var i=l["a"].baseUrl.pro;i=i+"api"+this.selectRow.path,i=i.replace(/http/g,"ws"),console.log("addUrl",i),this.RfidWS=new WebSocket(i),this.RfidWS.onopen=function(){},this.RfidWS.onmessage=function(e){var i=e.data;t.makeLog(i)},this.RfidWS.onclose=function(){}}else this.RfidWS.close()},onClick:function(e,t){this.selectRow=e,this.selectRow.level=2,"tcpip"===this.selectRow.cfgType?(this.seenTcp=!0,this.seenSerial=!1):(this.seenTcp=!1,this.seenSerial=!0),this.testDis=!1},getColors:function(e){return 1===e.level?"black":2===e.level?"#CD4F39":3===e.level?"#CD2626":void 0},getDate:function(){var e=new Date,t=e.getFullYear(),i=e.getMonth()+1,s=e.getDate(),n=e.getHours(),a=e.getMinutes(),r=e.getSeconds();e.getSeconds();a=a>9?a:"0"+a,n>5&&n<12?n="上午"+n:n>11&&n<18?(n-=12,n="下午"+n):n>17&&n<24?(n-=12,n="晚上"+n):n="凌晨"+n,r=r>9?r:"0"+r;var o=t+"年"+i+"月"+s+"日   "+n+":"+a+":"+r;return o},makeLog:function(e){var t=this.getDate(),i="".concat(t,":")+"   "+"".concat(e);this.logList.unshift(i),this.logList.length>10&&(this.logStyle={})},trash:function(){this.logList=[],this.logStyle={height:"100%"}},refresh:function(){this.makeLog("从组态信息中导入数据"),this.RfidData=[],this.getRfidList(),this.testDis=!0},register:function(){if("{}"===JSON.stringify(this.selectRow))this.makeLog("未选中任何电子称"),this.testStatus=!1;else{this.$refs["deviceItem"].resetFields(),this.RfidWsUrl=[],this.deviceItem.name=this.selectRow.name,this.deviceItem.type="RFID"===this.selectRow.type?"BAND":"Unkown";var e=this.selectRow.path;if(this.localIpAdds.length>0){var t=!0,i=!1,s=void 0;try{for(var n,a=this.localIpAdds[Symbol.iterator]();!(t=(n=a.next()).done);t=!0){var r=n.value,o={};o.value="ws://".concat(r,":3000/api").concat(e),o.text="ws://".concat(r,":3000/api").concat(e),this.RfidWsUrl.push(o)}}catch(c){i=!0,s=c}finally{try{t||null==a.return||a.return()}finally{if(i)throw s}}}this.modalVisible=!0}},getRfidList:function(){var e=this;this.$ajax.get("/red/flows").then((function(t){e.RfidData=e.getRfidWSInfo(t)}))},getRfidWSInfo:function(e){var t=[];if(0===e.length)return-1;var i=e.find((function(e){return"RFID-Read"===e.type}));if(!i)return-1;var s=!0,n=!1,r=void 0;try{for(var o,c=function(){var s=o.value,n=[].concat.apply([],s.wires);if(n.includes(i.id)&&"ebr-websocket in"===s.type){var a=e.find((function(e){return e.id===s.server}));return a?(a.name=s.name,a.type="RFID",t.push(a),{v:t}):{v:-1}}},l=e[Symbol.iterator]();!(s=(o=l.next()).done);s=!0){var d=c();if("object"===Object(a["a"])(d))return d.v}}catch(u){n=!0,r=u}finally{try{s||null==l.return||l.return()}finally{if(n)throw r}}}},mounted:function(){var e=this;this.$nextTick(Object(r["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.getRfidList(),t.next=3,e.getLocalIP();case 3:return e.localIpAdds=t.sent,t.next=6,e.getAllWks();case 6:e.allWks=t.sent;case 7:case"end":return t.stop()}}),t)}))))},computed:{},watch:{}},u=d,f=(i("d3c8"),i("2877")),h=Object(f["a"])(u,s,n,!1,null,"77290dc4",null);t["default"]=h.exports},"9fb7":function(e,t,i){},d3c8:function(e,t,i){"use strict";var s=i("9fb7"),n=i.n(s);n.a}}]);