(self.webpackChunkreal_estate_map=self.webpackChunkreal_estate_map||[]).push([[179],{2201:(e,t,n)=>{"use strict";n(5666);var r,i,o,a=n(655),u=n(3379),s=n.n(u),c=n(9163);function l(e){return(l="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function f(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function h(e,t){return(h=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function p(e,t){return!t||"object"!==l(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function y(e){return(y=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}s()(c.Z,{insert:"head",singleton:!1}),c.Z.locals,function(e){e.townhouse="townhouse",e.unitApartment="unit+apartment",e.house="house",e.retirement="retire",e.blockOfUnits="unitblock",e.acreage="acreage",e.villa="villa"}(r||(r={})),function(e){e.rent="rent",e.buy="buy"}(i||(i={})),function(e){e.priceAsc="price-asc",e.priceDesc="price-desc"}(o||(o={})),n(2526),n(1817),n(2165),n(6992),n(489),n(1539),n(2419),n(9714),n(8783),n(3948);var v=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&h(e,t)}(a,google.maps.OverlayView);var t,n,r,i,o=(r=a,i=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=y(r);if(i){var n=y(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return p(this,e)});function a(e,t){var n;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,a),(n=o.call(this)).wrapper=n.createDiv(),n.orchestrator=t,n.setMap(e),n}return t=a,(n=[{key:"onAdd",value:function(){this.getPanes().overlayLayer.appendChild(this.wrapper),this.orchestrator.begin({overlayView:this,wrapper:this.wrapper}),this.getMap().addListener("zoom",(function(e){return console.log("event",e)}))}},{key:"draw",value:function(){}},{key:"onRemove",value:function(){this.orchestrator.reset(),this.wrapper.remove()}},{key:"createDiv",value:function(){var e=document.createElement("div");return e.style.position="absolute",e}}])&&f(t.prototype,n),a}();function d(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}n(2222),n(9600),n(1249),n(9575),n(7941),n(8674),n(9743),n(2990),n(8927),n(3105),n(5035),n(4345),n(7174),n(2846),n(4731),n(7209),n(6319),n(8867),n(7789),n(3739),n(9368),n(4483),n(2056),n(3462),n(678),n(7462),n(3824),n(5021),n(2974),n(5016);var m=function(){function e(t,n,r,i){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.url=t,this.radius=n,this.tileSize=r,this.searchOptions=i}var t,n;return t=e,(n=[{key:"renderTile",value:function(e){return(0,a.mG)(this,void 0,void 0,regeneratorRuntime.mark((function t(){var n,r,i;return regeneratorRuntime.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return n={searchOptions:JSON.stringify(this.searchOptions),tile:JSON.stringify(e),radius:"".concat(this.radius),tileSize:"".concat(this.tileSize)},t.next=3,fetch("".concat(this.url,"?").concat(this.createQueryString(n)));case 3:return r=t.sent,t.next=6,r.json();case 6:return i=t.sent,t.abrupt("return",new Uint8ClampedArray(i));case 8:case"end":return t.stop()}}),t,this)})))}},{key:"createQueryString",value:function(e){return Object.keys(e).map((function(t){return"".concat(t,"=").concat(encodeURIComponent(e[t]))})).join("&")}}])&&d(t.prototype,n),e}(),b=(n(6541),n(7327),n(9826),n(9554),n(1038),n(7042),n(5212),n(5735),n(8309),n(4747),n(3753),n(6486)),g=n(1939),w=n(7640),C=n(109),k=n(3884),x=n(4379),A=n(5709),z=n(1993),S=n(1931),E=n(5315),M=n(7746),O=n(1558),P=n(6008),T=n(2556),j=n(7614),R=n(7232),I=n(8170),L=n(7504);function D(e){return(D="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function _(e,t){return e.x===t.x&&e.y===t.y}function U(e){var t=e.zoom,n=e.point,r=n.x,i=n.y;return"".concat(t,"-").concat(r,"-").concat(i)}function V(e,t){return e.zoom===t.zoom&&_(e.point,t.point)}function Z(e,t){var n=t.latitude,r=t.longitude,i=Math.sin(n*Math.PI/180),o=Math.min(Math.max(i,-.9999),.9999);return{x:e*(.5+r/360),y:e*(.5-Math.log((1+o)/(1-o))/(4*Math.PI))}}function N(e,t,n){return function(e,t,n){var r=n.x,i=n.y,o=1<<t;return{x:Math.floor(r*o/e),y:Math.floor(i*o/e)}}(e,t,Z(e,n))}function B(e,t,n){return function(e,t){var n=t.x,r=t.y,i=Math.pow(Math.E,2*Math.PI),o=Math.pow(Math.E,4*r*Math.PI/e),a=(i-o)/(i+o);return{latitude:180*Math.asin(a)/Math.PI,longitude:360*(n/e-.5)}}(e,function(e,t,n){var r=1<<t;return{x:n.x*e/r,y:n.y*e/r}}(e,t,n))}function J(e,t,n){var r=N(e,t,n.northWest),i=r.x,o=r.y,a=N(e,t,n.southEast);return function(e,t,n,r){var i=[];return function(e,t,n,r,i){for(var o=Math.floor((e+t)/2),a=Math.floor((n+r)/2),u=function(n){return n>=e&&n<=t},s=function(e){return e>=n&&e<=r},c=!0,l=0;c;l++){if(c=!1,s(a-l))for(var f=-l;f<=l;f++)u(o+f)&&(c=!0,i(o+f,a-l));if(u(o+l))for(var h=1-l;h<=l;h++)s(a+h)&&(c=!0,i(o+l,a+h));if(s(a+l))for(var p=l-1;p>=-l;p--)u(o+p)&&(c=!0,i(o+p,a+l));if(u(o-l))for(var y=l-1;y>-l;y--)s(a+y)&&(c=!0,i(o-l,a+y))}}(e,t,n,r,(function(e,t){return i.push({x:e,y:t})})),i}(i,a.x,o,a.y).map((function(e){return{point:e,zoom:t}}))}function W(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(e)){var n=[],r=!0,i=!1,o=void 0;try{for(var a,u=e[Symbol.iterator]();!(r=(a=u.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(e){i=!0,o=e}finally{try{r||null==u.return||u.return()}finally{if(i)throw o}}return n}}(e,t)||function(e,t){if(e){if("string"==typeof e)return Y(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Y(e,t):void 0}}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function Y(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function $(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}var Q=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.wrapper=null,this.overlayView=null,this.subscription=null,this.unsubscribed$=new g.xQ,this.layers=[],this.canvases=[],this.tileSize=t.tileSize,this.renderer=t.renderer}var t,n;return t=e,(n=[{key:"begin",value:function(e){this.overlayView=e.overlayView,this.wrapper=e.wrapper,this.subscription=this.initialize()}},{key:"reset",value:function(){this.wrapper=null,this.overlayView=null,this.layers.forEach((function(e){return e.element.remove()})),this.layers=[],this.canvases=[],this.unsubscribed$.next(),this.subscription&&this.subscription.unsubscribe()}},{key:"initialize",value:function(){var e=this;if(!this.overlayView)throw new Error("Could not initialize map. Overlay view was null");var t=this.observeEvent("zoom_changed").pipe((0,A.U)((function(){return e.getMapZoom()})),(0,z.O)(this.getMapZoom())),n=this.observeEvent("bounds_changed").pipe((0,A.U)((function(){return e.getMapBounds()})),(0,z.O)(this.getMapBounds())),r=(0,w.aj)([t.pipe((0,S.x)()),n.pipe((0,S.x)())]).pipe((0,E.e)(16),this.publishNow()).pipe((0,A.U)((function(t){var n=W(t,2),r=n[0],i=n[1];return e.getVisibleTiles(r,i)})),this.publishNow()),i=r.pipe((0,A.U)((function(t){return t.filter((function(t){return e.canvases.every((function(e){return!V(e.tile,t)}))}))})),this.publishNow()).pipe((0,M.zg)((function(t){return(0,C.D)(t).pipe((0,A.U)((function(t){return(n=e.renderer.renderTile(t),(0,R.b)(n)?n:n&&"object"===D(n)&&"function"==typeof n.then?(0,L.p)(n):(0,I.of)(n)).pipe((0,A.U)((function(e){return{image:e,tile:t}})),(0,O.R)(r.pipe((0,P.h)((function(e){return e.every((function(e){return!V(e,t)}))})))),e.publishNow());var n})))}))),o=this.observeEvent("idle").subscribe((function(){e.layers.forEach((function(t){e.updateLayerPosition(t)&&e.updateTilePositions(t)}))})),a=i.pipe((0,T.J)()).subscribe((function(t){e.findOrCreateLayer(t.tile.zoom),e.createAndRenderCanvas(t)})),u=r.subscribe((function(t){e.canvases=e.canvases.filter((function(n){var r=e.getMapZoom();if(n.tile.zoom===r){if(t.some((function(e){return V(n.tile,e)})))return!0}else if(e.getVisibleTiles(n.tile.zoom,e.getMapBounds()).some((function(e){return V(n.tile,e)})))return!0;return n.element.remove(),!1}))})),s=i.pipe((0,T.J)()).subscribe((function(){var t=e.getMapZoom();e.canvases=e.canvases.filter((function(n){return n.tile.zoom===t||!!J(e.tileSize,t,function(e,t){var n=t.zoom,r=t.point,i=r.x,o=r.y;return{northWest:B(e,n,{x:i,y:o}),southEast:B(e,n,{x:i+1,y:o+1})}}(e.tileSize,n.tile)).some((function(t){return!e.canvases.some((function(e){return V(t,e.tile)}))}))||(n.element.remove(),!1)}))}));return new k.w((function(){a.unsubscribe(),o.unsubscribe(),u.unsubscribe(),s.unsubscribe()}))}},{key:"getVisibleTiles",value:function(e,t){return J(this.tileSize,e,this.boundsToCoordinateArea(t))}},{key:"boundsToCoordinateArea",value:function(e){return{northWest:{longitude:e.west,latitude:e.north},southEast:{longitude:e.east,latitude:e.south}}}},{key:"createDiv",value:function(){var e=document.createElement("div");return e.style.position="absolute",e}},{key:"createCanvasElement",value:function(e){var t=document.createElement("canvas");return t.id=e,t.width=this.tileSize,t.height=this.tileSize,t.style.width="".concat(this.tileSize,"px"),t.style.height="".concat(this.tileSize,"px"),t.style.position="absolute",t}},{key:"findLayer",value:function(e){return this.layers.find((function(t){return t.zoom===e}))}},{key:"assignElementPosition",value:function(e,t){e.style.left="".concat(t.x,"px"),e.style.top="".concat(t.y,"px")}},{key:"calculateLayerPosition",value:function(e){var t=this.getMapBounds(),n={latitude:(0,b.mean)([t.north,t.south]),longitude:(0,b.mean)([t.east,t.west])};return W(J(this.tileSize,e,{northWest:n,southEast:n}),1)[0].point}},{key:"calculateLayerOffset",value:function(e,t){var n,r,i=this.getMapBounds(),o={latitude:(0,b.mean)([i.north,i.south]),longitude:(0,b.mean)([i.east,i.west])},a={x:(n=this.tileSize)*(r=t).x,y:n*r.y},u=function(e,t){var n=1<<e;return{x:t.x*n,y:t.y*n}}(e,Z(this.tileSize,o));return{x:a.x-u.x,y:a.y-u.y}}},{key:"updateLayerPosition",value:function(e){var t=this.calculateLayerPosition(e.zoom),n=this.calculateLayerOffset(e.zoom,t);return!_(n,e.position)&&(this.assignElementPosition(e.element,n),e.position=t,!0)}},{key:"createLayer",value:function(e){if(!this.wrapper)throw new Error("Could not create a layer. Wrapper was null");var t=this.createDiv();t.id="layer-".concat(e),this.wrapper.appendChild(t);var n={zoom:e,element:t,position:{x:0,y:0}};return this.updateLayerPosition(n),this.layers.push(n),n}},{key:"findOrCreateLayer",value:function(e){return this.findLayer(e)||this.createLayer(e)}},{key:"findCanvas",value:function(e){var t=this.canvases.find((function(t){return V(e,t.tile)}));return t?t.element:void 0}},{key:"calculateTilePosition",value:function(e,t){return{x:(e.point.x-t.x)*this.tileSize,y:(e.point.y-t.y)*this.tileSize}}},{key:"updateTilePosition",value:function(e,t,n){var r=this.calculateTilePosition(e,t);this.assignElementPosition(n,r)}},{key:"createCanvas",value:function(e){var t=this.findLayer(e.zoom);if(!t)throw new Error("Could not find layer for zoom ".concat(e.zoom));var n=this.createCanvasElement(U(e));return this.updateTilePosition(e,t.position,n),t.element.appendChild(n),this.canvases.push({tile:e,element:n}),n}},{key:"findOrCreateCanvas",value:function(e){return this.findCanvas(e)||this.createCanvas(e)}},{key:"renderImageToCanvas",value:function(e,t){var n=t.getContext("2d");if(n){var r=n.createImageData(this.tileSize,this.tileSize);r.data.set(e),n.putImageData(r,0,0)}else console.error("Could not render image to canvas. Context was null")}},{key:"createAndRenderCanvas",value:function(e){var t=this.findOrCreateCanvas(e.tile);return this.renderImageToCanvas(e.image,t),t}},{key:"updateTilePositions",value:function(e){var t=this;this.canvases.forEach((function(n){t.updateTilePosition(n.tile,e.position,n.element)}))}},{key:"publishNow",value:function(e){var t=this;return function(e){var n=(0,j.n)()(e.pipe((0,O.R)(t.unsubscribed$)));return n.connect(),n}}},{key:"observeEvent",value:function(e){var t=this;return new x.y((function(n){var r=t.getPlainMap().addListener(e,(function(e){return n.next(e)}));return function(){return r.remove()}}))}},{key:"getMapZoom",value:function(){return this.getPlainMap().getZoom()}},{key:"getMapBounds",value:function(){var e=this.getPlainMap().getBounds();if(!e)throw Error("Invalid bounds");return e.toJSON()}},{key:"getPlainMap",value:function(){if(!this.overlayView)throw new Error("Could not retrieve map. Overlay view was null");var e=this.overlayView.getMap();if(!(e instanceof google.maps.Map))throw Error("Cannot get the bounds of the map. Map class is incorrect.");return e}}])&&$(t.prototype,n),e}();function q(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}var G=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.cache={},this.renderer=t.renderer}var t,n;return t=e,(n=[{key:"renderTile",value:function(e){var t=U(e);return t in this.cache||(this.cache[t]=this.renderer.renderTile(e)),this.cache[t]}}])&&q(t.prototype,n),e}(),F={channel:i.buy};google.maps.event.addDomListener(window,"load",(function(){return(0,a.mG)(void 0,void 0,void 0,regeneratorRuntime.mark((function e(){var t,n,r,i,o;return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(t=document.getElementById("map")){e.next=3;break}throw new Error("Could not find #map element");case 3:n=new google.maps.Map(t,{zoom:13,center:{lat:-37.833552,lng:145.03358},mapTypeId:google.maps.MapTypeId.TERRAIN}),r=new m("https://australia-southeast1-real-estate-map-1546133439056.cloudfunctions.net/heatmap-generator",50,256,F),i=new G({renderer:r}),o=new Q({renderer:i,tileSize:256}),new v(n,o);case 8:case"end":return e.stop()}}),e)})))}))},9163:(e,t,n)=>{"use strict";n.d(t,{Z:()=>u});var r=n(4015),i=n.n(r),o=n(3645),a=n.n(o)()(i());a.push([e.id,"/* Optional: Makes the sample page fill the window. */\nhtml, body {\n  height: 100%;\n  margin: 0;\n  padding: 0;\n}\n\n/* Always set the map height explicitly to define the size of the div\n * element that contains the map. */\n#map {\n  height: 100%;\n}\n","",{version:3,sources:["webpack://./src/ui/index.css"],names:[],mappings:"AAAA,qDAAqD;AACrD;EACE,YAAY;EACZ,SAAS;EACT,UAAU;AACZ;;AAEA;mCACmC;AACnC;EACE,YAAY;AACd",sourcesContent:["/* Optional: Makes the sample page fill the window. */\nhtml, body {\n  height: 100%;\n  margin: 0;\n  padding: 0;\n}\n\n/* Always set the map height explicitly to define the size of the div\n * element that contains the map. */\n#map {\n  height: 100%;\n}\n"],sourceRoot:""}]);const u=a}},0,[[2201,666,216]]]);
//# sourceMappingURL=main.f38b7e60267a3346e742.js.map