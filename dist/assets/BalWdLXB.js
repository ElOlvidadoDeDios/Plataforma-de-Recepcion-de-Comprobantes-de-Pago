import{r as R,a as d}from"./Bx4hmdWq.js";var y={exports:{}},u={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var x;function h(){if(x)return u;x=1;var t=R(),m=Symbol.for("react.element"),a=Symbol.for("react.fragment"),f=Object.prototype.hasOwnProperty,s=t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,c={key:!0,ref:!0,__self:!0,__source:!0};function l(o,e,p){var r,n={},i=null,k=null;p!==void 0&&(i=""+p),e.key!==void 0&&(i=""+e.key),e.ref!==void 0&&(k=e.ref);for(r in e)f.call(e,r)&&!c.hasOwnProperty(r)&&(n[r]=e[r]);if(o&&o.defaultProps)for(r in e=o.defaultProps,e)n[r]===void 0&&(n[r]=e[r]);return{$$typeof:m,type:o,key:i,ref:k,props:n,_owner:s.current}}return u.Fragment=a,u.jsx=l,u.jsxs=l,u}var v;function C(){return v||(v=1,y.exports=h()),y.exports}var E=C();/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var w={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),_=(t,m)=>{const a=d.forwardRef(({color:f="currentColor",size:s=24,strokeWidth:c=2,absoluteStrokeWidth:l,className:o="",children:e,...p},r)=>d.createElement("svg",{ref:r,...w,width:s,height:s,stroke:f,strokeWidth:l?Number(c)*24/Number(s):c,className:["lucide",`lucide-${b(t)}`,o].join(" "),...p},[...m.map(([n,i])=>d.createElement(n,i)),...Array.isArray(e)?e:[e]]));return a.displayName=`${t}`,a};/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=_("CheckCircle",[["path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14",key:"g774vq"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=_("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=_("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);export{j as C,O as X,L as a,E as j};
