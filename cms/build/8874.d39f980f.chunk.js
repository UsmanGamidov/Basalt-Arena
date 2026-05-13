(self.webpackChunkcms=self.webpackChunkcms||[]).push([[8874],{38949(w){function G(u,s,_,L){for(var I=-1,U=u==null?0:u.length;++I<U;){var b=u[I];s(L,b,_(b),u)}return L}w.exports=G},13177(w,G,u){var s=u(95041);function _(L,I,U,b){return s(L,function(y,S,k){I(b,y,U(y),k)}),b}w.exports=_},74316(w,G,u){var s=u(38949),_=u(13177),L=u(55201),I=u(44653);function U(b,y){return function(S,k){var ce=I(S)?s:_,ue=y?y():{};return ce(S,b,L(k,2),ue)}}w.exports=U},33102(w,G,u){var s=u(50276),_=u(74316),L=Object.prototype,I=L.hasOwnProperty,U=_(function(b,y,S){I.call(b,S)?b[S].push(y):s(b,S,[y])});w.exports=U},48874(w,G,u){"use strict";u.d(G,{P:()=>Bs});var s=u(64749),_=u(83353),L=u(23148),I=u(36979),U=u(9284),b=u(6400),y=u(868),S=u(96326),k=u(61068),ce=u(88038),ue=u(52067),Ve=u(17204),we=u(58505),He=u(93439),Fe=u(2458),A=u(81148),Ge=u(80988),_e=u(48788),q=u(11278),Xe=u(32128),N=u(35784),ye=u(91438),je=u(76193),pe=u(80571),M=u(6656),ie=u(19268),ee=u(42005),H=u(58436),W=u(75363),X=u(1473),Je=u(99990),Ye=u(33808),he=u(33102),Oe=u(5871),D=u(8591),Qe=u(71714),Ze=u(86482),ze=u(38857),qe=u(40270),es=u(23698),ss=u(49448),ts=u(17988);const[ns,os]=(0,Je.q)("PermissionsDataManager"),Z=()=>os("usePermissionsDataManager"),Ae=e=>Array.isArray(e)?e.reduce((t,o)=>(Array.isArray(o)?t.push(...Ae(o)):t.push(o),t),[]):[],Y=e=>(0,X.F)(e)?Ae(Object.values(e).map(t=>(0,X.F)(t)?Y(t):t)):[],Ee=(e,t,o)=>e.find(n=>n.action===t&&n.subject===o),is=e=>{const t=be(e.plugins),o=be(e.settings),n=Me(e.collectionTypes),r=Me(e.singleTypes);return[...t,...o,...n,...r]},be=e=>Object.values(e).reduce((t,o)=>{const n=Object.values(o).reduce((r,a)=>{const d=Object.entries(a).reduce((i,[l,{conditions:c,properties:{enabled:p}}])=>(p&&i.push({action:l,subject:null,conditions:ge(c),properties:{}}),i),[]);return[...r,...d]},[]);return[...t,...n]},[]),Me=e=>Object.entries(e).reduce((o,n)=>{const[r,a]=n,d=Object.entries(a).reduce((i,l)=>{const[c,p]=l;if(!Y(p).some(m=>m))return i;if(!p?.properties?.enabled){const m=Object.entries(p.properties).reduce((f,x)=>{const[h,C]=x;return f.properties[h]=Pe(C),f},{action:c,subject:r,conditions:ge(p.conditions),properties:{}});return[...i,m]}return p.properties.enabled&&i.push({action:c,subject:r,properties:{},conditions:ge(p.conditions)}),i},[]);return[...o,...d]},[]),Pe=(e,t="")=>Object.entries(e).reduce((o,n)=>{const[r,a]=n;return(0,X.F)(a)?[...o,...Pe(a,`${t}${r}.`)]:(a&&!(0,X.F)(a)&&o.push(`${t}${r}`),o)},[]),ge=e=>Object.entries(e).filter(([,t])=>t).map(([t])=>t),ve=(e,t=[])=>e.reduce((o,n)=>(o[n.id]=t.indexOf(n.id)!==-1,o),{}),Te=(e,t,o=[])=>e.reduce((n,{categoryId:r,childrenForm:a})=>{const d=a.reduce((i,l)=>(i[l.subCategoryId]=l.actions.reduce((c,p)=>{const g=Ee(o,p.action,null);return c[p.action]={properties:{enabled:g!==void 0},conditions:ve(t,g?.conditions??[])},c},{}),i),{});return n[r]=d,n},{}),rs=(e,t,o)=>{const n=({children:r=[]},a,d="")=>r.reduce((i,l)=>{if(l.children)return{...i,[l.value]:n(l,a,`${d}${l.value}.`)};const c=a.indexOf(`${d}${l.value}`)!==-1;return i[l.value]=c,i},{});return e.reduce((r,a)=>{const d=t.properties.find(({value:i})=>i===a);if(d){const i=o?.properties[d.value]??[],l=n(d,i);r.properties[a]=l}return r},{properties:{}})},Se=({subjects:e,actions:t=[]},o,n=[])=>t.reduce((r,a)=>{const d=a.subjects.reduce((l,c)=>{const p=e.find(({uid:g})=>g===c)||null;return p&&(l[c]=p),l},{});if(ee(d))return r;const i=Object.keys(d).reduce((l,c)=>{const{actionId:p,applyToProperties:g}=a,x=d[c].properties.map(({value:P})=>P).every(P=>(g||[]).indexOf(P)===-1),h=Ee(n,p,c),C=ve(o,h?.conditions??[]);if(l[c]||(l[c]={}),ee(g)||x)return l[c][p]={properties:{enabled:h!==void 0},conditions:C},l;const j=rs(g,d[c],h);return l[c][p]={...j,conditions:C},l},{});return Ye(r,i)},{}),De=(e,t)=>Object.entries(he(e,t)).map(([o,n])=>({category:o,categoryId:o.split(" ").join("-"),childrenForm:Object.entries(he(n,"subCategory")).map(([r,a])=>({subCategoryName:r,subCategoryId:r.split(" ").join("-"),actions:a}))})),re=e=>Object.keys(e).reduce((t,o)=>{const n=e[o];if((0,X.F)(n)&&!ie(n,"conditions"))return{...t,[o]:re(n)};if((0,X.F)(n)&&ie(n,"conditions")&&!Y(Oe(n,"conditions")).some(a=>a)){const a=Object.keys(n.conditions).reduce((d,i)=>(d[i]=!1,d),{});return{...t,[o]:{...n,conditions:a}}}return t[o]=n,t},{}),se=(e,t,o=!1)=>Object.keys(e).reduce((n,r)=>{const a=e[r];return r==="conditions"&&!o?(n[r]=a,n):(0,X.F)(a)?{...n,[r]:se(a,t,r==="fields")}:(n[r]=t,n)},{}),F=`${120/16}rem`,me=`${200/16}rem`,ae=`${53/16}rem`,Ce=e=>e?Object.entries(e).reduce((t,[o,n])=>(o!=="conditions"&&(t[o]=n),t),{}):null,Q=e=>{const t=Ce(e),o=Y(t);if(!o.length)return{hasAllActionsSelected:!1,hasSomeActionsSelected:!1};const n=o.every(a=>a),r=o.some(a=>a)&&!n;return{hasAllActionsSelected:n,hasSomeActionsSelected:r}},le=e=>e.charAt(0).toUpperCase()+e.slice(1),$e=(0,D.Ay)(A.s)`
  padding-right: ${({theme:e})=>e.spaces[2]};
  overflow: hidden;
  flex: 1;
  ${({isCollapsable:e})=>e&&"cursor: pointer;"}
`,fe=D.Ay.div`
  width: ${F};
`,Le=()=>(0,s.jsx)(y.a,{color:"danger700",paddingLeft:1,children:"*"}),Re=({checkboxName:e="",children:t,isActive:o=!1,isCollapsable:n=!1,isFormDisabled:r=!1,label:a,onChange:d,onClick:i,someChecked:l=!1,value:c})=>{const{formatMessage:p}=(0,W.A)();return(0,s.jsxs)(A.s,{alignItems:"center",paddingLeft:6,width:me,shrink:0,children:[(0,s.jsx)(y.a,{paddingRight:2,children:(0,s.jsx)(b.J,{name:e,"aria-label":p({id:"Settings.permissions.select-all-by-permission",defaultMessage:"Select all {label} permissions"},{label:a}),disabled:r,onValueChange:g=>d({target:{name:e,value:g}}),indeterminate:l,value:c})}),(0,s.jsxs)($e,{title:a,alignItems:"center",isCollapsable:n,...n&&{onClick:i,"aria-expanded":o,onKeyDown:({key:g})=>(g==="Enter"||g===" ")&&i(),tabIndex:0,role:"button"},children:[(0,s.jsx)(N.o,{fontWeight:o?"bold":void 0,textColor:o?"primary600":"neutral800",ellipsis:!0,children:le(a)}),t]})]})},as=({availableActions:e=[],childrenForm:t=[],isFormDisabled:o,label:n,pathToData:r,propertyName:a})=>{const d=(0,_.useMemo)(()=>e.map(i=>{const l=Array.isArray(i.applyToProperties)&&i.applyToProperties.indexOf(a)!==-1&&i.isDisplayed;return{label:i.label,actionId:i.actionId,isActionRelatedToCurrentProperty:l}}),[e,a]);return(0,s.jsxs)(A.s,{display:"inline-flex",direction:"column",minWidth:0,children:[(0,s.jsx)(Cs,{label:n,headers:d}),(0,s.jsx)(y.a,{children:t.map(({children:i,label:l,value:c,required:p},g)=>(0,s.jsx)(ls,{childrenForm:i,label:l,isFormDisabled:o,name:c,required:p,propertyActions:d,pathToData:r,propertyName:a,isOdd:g%2===0},c))})]})},ls=({childrenForm:e=[],label:t,isFormDisabled:o=!1,name:n,required:r=!1,pathToData:a,propertyActions:d,propertyName:i,isOdd:l=!1})=>{const{formatMessage:c}=(0,W.A)(),[p,g]=_.useState(null),{modifiedData:m,onChangeCollectionTypeLeftActionRowCheckbox:f,onChangeParentCheckbox:x,onChangeSimpleCheckbox:h}=Z(),C=p===n,j=(0,_.useMemo)(()=>Array.isArray(e)?e:[],[e]),P=j.length>0,$=_.useCallback(()=>{P&&g(v=>v===n?null:n)},[P,n]),O=({target:{value:v}})=>{f(a,i,n,v)},{hasAllActionsSelected:E,hasSomeActionsSelected:T}=(0,_.useMemo)(()=>ds(d,m,a,i,n),[d,m,a,i,n]);return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(cs,{alignItems:"center",isCollapsable:P,isActive:C,background:l?"neutral100":"neutral0",children:(0,s.jsxs)(A.s,{children:[(0,s.jsxs)(Re,{onChange:O,onClick:$,isCollapsable:P,isFormDisabled:o,label:t,someChecked:T,value:E,isActive:C,children:[r&&(0,s.jsx)(Le,{}),(0,s.jsx)(te,{$isActive:C})]}),(0,s.jsx)(A.s,{children:d.map(({label:v,isActionRelatedToCurrentProperty:B,actionId:K})=>{if(!B)return(0,s.jsx)(fe,{},v);const R=[...a.split(".."),K,"properties",i,n];if(!P){const V=M(m,R,!1);return(0,s.jsx)(A.s,{width:F,position:"relative",justifyContent:"center",alignItems:"center",children:(0,s.jsx)(b.J,{disabled:o,name:R.join(".."),"aria-label":c({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${n} ${v}`}),onValueChange:Ks=>{h({target:{name:R.join(".."),value:Ks}})},value:V})},K)}const z=M(m,R,{}),{hasAllActionsSelected:J,hasSomeActionsSelected:oe}=Q(z);return(0,s.jsx)(A.s,{width:F,position:"relative",justifyContent:"center",alignItems:"center",children:(0,s.jsx)(b.J,{disabled:o,name:R.join(".."),onValueChange:V=>{x({target:{name:R.join(".."),value:V}})},"aria-label":c({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${n} ${v}`}),value:J,indeterminate:oe})},v)})})]})}),C&&(0,s.jsx)(Be,{childrenForm:j,isFormDisabled:o,parentName:n,pathToDataFromActionRow:a,propertyName:i,propertyActions:d,recursiveLevel:0})]})},ds=(e,t,o,n,r)=>{const d=e.reduce((i,l)=>(l.isActionRelatedToCurrentProperty&&i.push(l.actionId),i),[]).reduce((i,l)=>{const c=M(t,[...o.split(".."),l,"properties",n,r],!1);return i[l]=c,i},{});return Q(d)},cs=(0,D.Ay)(A.s)`
  height: ${ae};
  flex: 1;

  ${({isCollapsable:e,theme:t})=>e&&`
      ${te} {
        display: block;
        color: ${t.colors.neutral100};
      }
      &:hover {
        ${ne(t)}
      }
  `}
  ${({isActive:e,theme:t})=>e&&ne(t)};
`,te=(0,D.Ay)(Qe.A)`
  display: none;
  width: ${10/16}rem;
  transform: rotate(${({$isActive:e})=>e?"180":"0"}deg);
  margin-left: ${({theme:e})=>e.spaces[2]};
`,Be=({childrenForm:e=[],isFormDisabled:t,recursiveLevel:o,pathToDataFromActionRow:n,propertyActions:r,parentName:a,propertyName:d})=>{const{formatMessage:i}=(0,W.A)(),{modifiedData:l,onChangeParentCheckbox:c,onChangeSimpleCheckbox:p}=Z(),[g,m]=_.useState(null),f=h=>{m(C=>C===h?null:h)},x=(0,_.useMemo)(()=>g?e.find(({value:h})=>h===g):null,[g,e]);return(0,s.jsxs)(y.a,{paddingLeft:"2rem",children:[(0,s.jsx)(hs,{}),e.map(({label:h,value:C,required:j,children:P},$)=>{const O=$+1<e.length,E=Array.isArray(P),T=g===C;return(0,s.jsxs)(us,{isVisible:O,children:[(0,s.jsxs)(A.s,{height:ae,children:[(0,s.jsx)(gs,{children:(0,s.jsx)(ms,{width:"20",height:"23",viewBox:"0 0 20 23",fill:"none",xmlns:"http://www.w3.org/2000/svg",color:"primary200",children:(0,s.jsx)("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M7.02477 14.7513C8.65865 17.0594 11.6046 18.6059 17.5596 18.8856C18.6836 18.9384 19.5976 19.8435 19.5976 20.9688V20.9688C19.5976 22.0941 18.6841 23.0125 17.5599 22.9643C10.9409 22.6805 6.454 20.9387 3.75496 17.1258C0.937988 13.1464 0.486328 7.39309 0.486328 0.593262H4.50974C4.50974 7.54693 5.06394 11.9813 7.02477 14.7513Z",fill:"#D9D8FF"})})}),(0,s.jsxs)(A.s,{style:{flex:1},children:[(0,s.jsx)(ps,{level:o,isActive:T,isCollapsable:E,children:(0,s.jsxs)($e,{alignItems:"center",isCollapsable:E,...E&&{onClick:()=>f(C),"aria-expanded":T,onKeyDown:({key:v})=>(v==="Enter"||v===" ")&&f(C),tabIndex:0,role:"button"},title:h,children:[(0,s.jsx)(N.o,{ellipsis:!0,children:le(h)}),j&&(0,s.jsx)(Le,{}),(0,s.jsx)(te,{$isActive:T})]})}),(0,s.jsx)(A.s,{style:{flex:1},children:r.map(({actionId:v,label:B,isActionRelatedToCurrentProperty:K})=>{if(!K)return(0,s.jsx)(fe,{},v);const R=[...n.split(".."),v,"properties",d,...a.split(".."),C],z=M(l,R,!1);if(!P)return(0,s.jsx)(A.s,{position:"relative",width:F,justifyContent:"center",alignItems:"center",children:(0,s.jsx)(b.J,{disabled:t,name:R.join(".."),"aria-label":i({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${a} ${h} ${B}`}),onValueChange:V=>{p({target:{name:R.join(".."),value:V}})},value:z})},B);const{hasAllActionsSelected:J,hasSomeActionsSelected:oe}=Q(z);return(0,s.jsx)(A.s,{position:"relative",width:F,justifyContent:"center",alignItems:"center",children:(0,s.jsx)(b.J,{disabled:t,name:R.join(".."),"aria-label":i({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${a} ${h} ${B}`}),onValueChange:V=>{c({target:{name:R.join(".."),value:V}})},value:J,indeterminate:oe},B)},B)})})]})]}),x&&T&&(0,s.jsx)(y.a,{paddingBottom:2,children:(0,s.jsx)(Be,{isFormDisabled:t,parentName:`${a}..${C}`,pathToDataFromActionRow:n,propertyActions:r,propertyName:d,recursiveLevel:o+1,childrenForm:x.children})})]},C)})]})},us=(0,D.Ay)(y.a)`
  border-left: ${({isVisible:e,theme:t})=>e?`4px solid ${t.colors.primary200}`:"4px solid transparent"};
`,ps=(0,D.Ay)(A.s)`
  padding-left: ${({theme:e})=>e.spaces[4]};
  width: ${({level:e})=>145-e*36}px;

  ${({isCollapsable:e,theme:t})=>e&&`
      ${te} {
        display: block;
        color: ${t.colors.neutral100};
      }
      &:hover {
        ${ne(t)}
      }
  `}
  ${({isActive:e,theme:t})=>e&&ne(t)};
`,hs=D.Ay.div`
  padding-top: ${({theme:e})=>e.spaces[2]};
  margin-top: ${({theme:e})=>e.spaces[2]};
  width: ${4/16}rem;
  background-color: ${({theme:e})=>e.colors.primary200};
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
`,gs=(0,D.Ay)(y.a)`
  transform: translate(-4px, -12px);

  &:before {
    content: '';
    width: ${4/16}rem;
    height: ${12/16}rem;
    background: ${({theme:e})=>e.colors.primary200};
    display: block;
  }
`,ms=D.Ay.svg`
  position: relative;
  flex-shrink: 0;
  transform: translate(-0.5px, -1px);

  * {
    fill: ${({theme:e,color:t})=>e.colors[t]};
  }
`,Cs=({headers:e=[],label:t})=>{const{formatMessage:o}=(0,W.A)();return(0,s.jsxs)(A.s,{children:[(0,s.jsx)(A.s,{width:me,height:ae,shrink:0,alignItems:"center",paddingLeft:6,children:(0,s.jsx)(N.o,{variant:"sigma",textColor:"neutral500",children:o({id:"Settings.roles.form.permission.property-label",defaultMessage:"{label} permissions"},{label:t})})}),e.map(n=>n.isActionRelatedToCurrentProperty?(0,s.jsx)(A.s,{width:F,shrink:0,justifyContent:"center",children:(0,s.jsx)(N.o,{variant:"sigma",textColor:"neutral500",children:o({id:`Settings.roles.form.permissions.${n.label.toLowerCase()}`,defaultMessage:n.label})})},n.label):(0,s.jsx)(A.s,{width:F,shrink:0},n.label))]})},ne=e=>(0,D.AH)`
  ${N.o} {
    color: ${e.colors.primary600};
    font-weight: ${e.fontWeights.bold};
  }
  ${te} {
    display: block;

    path {
      fill: ${e.colors.primary600};
    }
  }
`,fs=({onClick:e,className:t,hasConditions:o=!1,variant:n="tertiary"})=>{const{formatMessage:r}=(0,W.A)();return(0,s.jsx)(xs,{hasConditions:o,className:t,children:(0,s.jsx)(S.$,{variant:n,startIcon:(0,s.jsx)(qe.A,{}),onClick:e,children:r({id:"global.settings",defaultMessage:"Settings"})})})},xs=(0,D.Ay)(y.a)`
  ${({hasConditions:e,disabled:t,theme:o})=>e&&`
    &:before {
      content: '';
      position: absolute;
      top: -3px;
      left: -10px;
      width: 6px;
      height: 6px;
      border-radius: ${20/16}rem;;
      background: ${t?o.colors.neutral100:o.colors.primary600};
    }
  `}
`,de=(0,D.Ay)(fs)``,Ie=({actions:e=[],headerBreadCrumbs:t=[],isFormDisabled:o,onClosed:n,onToggle:r})=>{const{formatMessage:a}=(0,W.A)(),{availableConditions:d,modifiedData:i,onChangeConditions:l}=Z(),c=_.useMemo(()=>Object.entries(he(d,"category")),[d]),p=e.filter(({isDisplayed:h,hasSomeActionsSelected:C,hasAllActionsSelected:j})=>h&&Boolean(C||j)),[g,m]=_.useState(_s(p,i,c)),f=(h,C)=>{m((0,je.Ay)(j=>{j[h]||(j[h]={}),j[h].default||(j[h].default={}),j[h].default=C}))},x=()=>{const h=Object.entries(g).reduce((C,j)=>{const[P,$]=j,O=Object.values($).reduce((E,T)=>({...E,...T}),{});return C[P]=O,C},{});l(h),r()};return(0,s.jsxs)(Ve.k,{labelledBy:"condition-modal-breadcrumbs",onClose:n,children:[(0,s.jsx)(we.r,{children:(0,s.jsx)(es.B,{id:"condition-modal-breadcrumbs",label:t.join(", "),children:t.map((h,C,j)=>(0,s.jsx)(ss.m,{isCurrent:C===j.length-1,children:ts(a({id:h,defaultMessage:h}))},h))})}),(0,s.jsxs)(Fe.c,{children:[p.length===0&&(0,s.jsx)(N.o,{children:a({id:"Settings.permissions.conditions.no-actions",defaultMessage:"You first need to select actions (create, read, update, ...) before defining conditions on them."})}),(0,s.jsx)("ul",{children:p.map(({actionId:h,label:C,pathToConditionsObject:j},P)=>{const $=j.join("..");return(0,s.jsx)(ys,{arrayOfOptionsGroupedByCategory:c,label:C,isFormDisabled:o,isGrey:P%2===0,name:$,onChange:f,value:M(g,$,{})},h)})})]}),(0,s.jsx)(He.j,{startActions:(0,s.jsx)(S.$,{variant:"tertiary",onClick:r,children:a({id:"app.components.Button.cancel",defaultMessage:"Cancel"})}),endActions:(0,s.jsx)(S.$,{onClick:x,children:a({id:"Settings.permissions.conditions.apply",defaultMessage:"Apply"})})})]})},_s=(e,t,o)=>e.reduce((n,r)=>{const a=M(t,[...r.pathToConditionsObject,"conditions"],{}),d=o.reduce((i,l)=>{const[c,p]=l,g=p.reduce((m,f)=>(m[f.id]=M(a,f.id,!1),m),{});return i[c]=g,i},{});return n[r.pathToConditionsObject.join("..")]=d,n},{}),ys=({arrayOfOptionsGroupedByCategory:e,isFormDisabled:t=!1,isGrey:o=!1,label:n,name:r,onChange:a,value:d})=>{const{formatMessage:i}=(0,W.A)(),l=c=>{a&&a(r,As(e,c))};return(0,s.jsxs)(A.s,{as:"li",background:o?"neutral100":"neutral0",paddingBottom:3,paddingTop:3,children:[(0,s.jsxs)(A.s,{paddingLeft:6,style:{width:180},children:[(0,s.jsxs)(N.o,{variant:"sigma",textColor:"neutral600",children:[i({id:"Settings.permissions.conditions.can",defaultMessage:"Can"}),"\xA0"]}),(0,s.jsx)(N.o,{variant:"sigma",title:n,textColor:"primary600",ellipsis:!0,children:i({id:`Settings.roles.form.permissions.${n.toLowerCase()}`,defaultMessage:n})}),(0,s.jsxs)(N.o,{variant:"sigma",textColor:"neutral600",children:["\xA0",i({id:"Settings.permissions.conditions.when",defaultMessage:"When"})]})]}),(0,s.jsx)(y.a,{style:{maxWidth:430,width:"100%"},children:(0,s.jsx)(Ge.B,{id:r,customizeContent:(c=[])=>`${c.length} currently selected`,onChange:l,value:js(d),options:Os(e),disabled:t})})]})},js=e=>Object.values(e).map(t=>Object.entries(t).filter(([,o])=>o).map(([o])=>o)).flat(),Os=e=>e.reduce((t,[o,n])=>(t.push({label:le(o),children:n.map(r=>({label:r.displayName,value:r.id}))}),t),[]),As=(e,t)=>e.map(([,o])=>o).flat().reduce((o,n)=>({[n.id]:t.includes(n.id),...o}),{}),Es=({actions:e=[],isFormDisabled:t,pathToData:o,subjects:n=[]})=>{const[r,a]=_.useState(null),d=i=>()=>{a(r===i?null:i)};return(0,s.jsx)(s.Fragment,{children:n.map(({uid:i,label:l,properties:c},p)=>{const g=r===i,m=e.map(f=>({...f,isDisplayed:Array.isArray(f.subjects)&&f.subjects.indexOf(i)!==-1}));return(0,s.jsxs)(A.s,{direction:"column",display:"inline-flex",minWidth:"100%",borderColor:"primary600",borderWidth:g?1:0,children:[(0,s.jsx)(bs,{availableActions:m,isActive:g,isGrey:p%2===0,isFormDisabled:t,label:l,onClickToggle:d(i),pathToData:[o,i].join("..")}),g&&c.map(({label:f,value:x,children:h})=>(0,s.jsx)(as,{availableActions:m,childrenForm:h,isFormDisabled:t,label:f,pathToData:[o,i].join(".."),propertyName:x},x))]},i)})})},bs=({availableActions:e=[],isActive:t=!1,isGrey:o=!1,isFormDisabled:n=!1,label:r,onClickToggle:a,pathToData:d})=>{const[i,l]=_.useState(!1),{formatMessage:c}=(0,W.A)(),{modifiedData:p,onChangeParentCheckbox:g,onChangeSimpleCheckbox:m}=Z(),f=()=>{l(E=>!E)},x=()=>{l(!1)},h=M(p,d.split(".."),{}),C=_.useMemo(()=>Object.keys(h).reduce((E,T)=>(E[T]=Oe(h[T],"conditions"),E),{}),[h]),{hasAllActionsSelected:j,hasSomeActionsSelected:P}=Q(C),$=_.useMemo(()=>Ms(e,p,d),[e,p,d]),O=$.some(E=>E.hasConditions);return(0,s.jsxs)(Ps,{isActive:t,children:[(0,s.jsxs)(ke,{height:ae,flex:1,alignItems:"center",background:o?"neutral100":"neutral0",children:[(0,s.jsx)(Re,{isCollapsable:!0,isFormDisabled:n,label:r,checkboxName:d,onChange:g,onClick:a,someChecked:P,value:j,isActive:t,children:(0,s.jsx)(Ke,{paddingLeft:2,children:t?(0,s.jsx)(ze.A,{}):(0,s.jsx)(Ze.A,{})})}),(0,s.jsx)(A.s,{style:{flex:1},children:$.map(({actionId:E,hasSomeActionsSelected:T,isDisplayed:v,...B})=>{if(!v)return(0,s.jsx)(fe,{},E);const{hasConditions:K,hasAllActionsSelected:R,isParentCheckbox:z,checkboxName:J,label:oe}=B;return z?(0,s.jsxs)(We,{justifyContent:"center",alignItems:"center",children:[K&&(0,s.jsx)(y.a,{as:"span",position:"absolute",top:"-6px",left:"37px",width:"6px",height:"6px",borderRadius:"20px",background:"primary600"}),(0,s.jsx)(b.J,{disabled:n,name:J,"aria-label":c({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${oe} ${r}`}),onValueChange:V=>{g({target:{name:J,value:V}})},indeterminate:T,value:R})]},E):(0,s.jsxs)(We,{justifyContent:"center",alignItems:"center",children:[K&&(0,s.jsx)(y.a,{as:"span",position:"absolute",top:"-6px",left:"37px",width:"6px",height:"6px",borderRadius:"20px",background:"primary600"}),(0,s.jsx)(b.J,{disabled:n,indeterminate:K,name:J,onValueChange:V=>{m({target:{name:J,value:V}})},value:R})]},E)})}),i&&(0,s.jsx)(Ie,{headerBreadCrumbs:[r,"Settings.permissions.conditions.conditions"],actions:$,isFormDisabled:n,onClosed:x,onToggle:f})]}),(0,s.jsx)(y.a,{transform:"translateY(10px)",right:"9px",position:"absolute",children:(0,s.jsx)(de,{onClick:f,hasConditions:O})})]})},Ms=(e,t,o)=>e.map(({actionId:n,isDisplayed:r,applyToProperties:a,label:d})=>{if(!r)return{actionId:n,hasSomeActionsSelected:!1,isDisplayed:r};const i=[...o.split(".."),n],l=ee(a)?[...i,"properties","enabled"]:i,c=M(t,[...i,"conditions"],null),p={actionId:n,checkboxName:l.join(".."),hasConditions:Y(c).some(x=>x),isDisplayed:r,label:d,pathToConditionsObject:i};if(ee(a)){const x=M(t,l,!1);return{...p,hasAllActionsSelected:x,hasSomeActionsSelected:x,isParentCheckbox:!1}}const g=M(t,l,null),{hasAllActionsSelected:m,hasSomeActionsSelected:f}=Q(g);return{...p,hasAllActionsSelected:m,hasSomeActionsSelected:f,isParentCheckbox:!0}}),xe=(e,t)=>`
  ${ke} {
    background-color: ${e.colors.primary100};
    color: ${e.colors.primary600};
    border-radius: ${t?"2px 2px 0 0":"2px"};
  }
  ${Ke} {
    display: flex;
  }
  ${de} {
    display: block;
  }
  &:hover {
    ${ne(e)}
  }

  &:focus-within {
    ${()=>xe(e,t)}
  }
`,ke=(0,D.Ay)(A.s)`
  border: 1px solid transparent;
`,Ps=D.Ay.div`
  display: inline-flex;
  min-width: 100%;

  ${de} {
    display: none;
  }
  ${({isActive:e,theme:t})=>e&&xe(t,e)}
  &:hover {
    ${({theme:e,isActive:t})=>xe(e,t)}
  }
`,We=(0,D.Ay)(A.s)`
  width: ${F};
  position: relative;
`,Ke=(0,D.Ay)(y.a)`
  display: none;
  svg {
    width: 11px;
  }
  * {
    fill: ${({theme:e})=>e.colors.primary600};
  }
`,vs=({actions:e=[],isFormDisabled:t,kind:o})=>{const{formatMessage:n}=(0,W.A)(),{modifiedData:r,onChangeCollectionTypeGlobalActionCheckbox:a}=Z(),d=e.filter(({subjects:l})=>l&&l.length),i=_.useMemo(()=>{const l=d.map(({actionId:m})=>m),c=r[o],p=l.reduce((m,f)=>(Object.keys(c).forEach(x=>{const h=M(c,[x,f]),C={[x]:Ce(h)};m[f]?m[f]={...m[f],...C}:m[f]=C}),m),{});return Object.keys(p).reduce((m,f)=>(m[f]=Q(p[f]),m),{})},[r,d,o]);return(0,s.jsx)(y.a,{paddingBottom:4,paddingTop:6,style:{paddingLeft:me},children:(0,s.jsx)(A.s,{gap:0,children:d.map(({label:l,actionId:c})=>(0,s.jsxs)(A.s,{shrink:0,width:F,direction:"column",alignItems:"center",justifyContent:"center",gap:3,children:[(0,s.jsx)(N.o,{variant:"sigma",textColor:"neutral500",children:n({id:`Settings.roles.form.permissions.${l.toLowerCase()}`,defaultMessage:l})}),(0,s.jsx)(b.J,{disabled:t,onValueChange:p=>{a(o,c,p)},name:c,"aria-label":n({id:"Settings.permissions.select-all-by-permission",defaultMessage:"Select all {label} permissions"},{label:n({id:`Settings.roles.form.permissions.${l.toLowerCase()}`,defaultMessage:l})}),value:M(i,[c,"hasAllActionsSelected"],!1),indeterminate:M(i,[c,"hasSomeActionsSelected"],!1)})]},c))})})},Ue=({isFormDisabled:e,kind:t,layout:{actions:o,subjects:n}})=>{const r=[...n].sort((a,d)=>a.label.localeCompare(d.label));return(0,s.jsxs)(Ts,{background:"neutral0",children:[(0,s.jsx)(vs,{actions:o,kind:t,isFormDisabled:e}),(0,s.jsx)(Es,{actions:o,isFormDisabled:e,pathToData:t,subjects:r})]})},Ts=(0,D.Ay)(y.a)`
  overflow-x: auto;
`,Ne=({layout:e,...t})=>{const[o,n]=_.useState(null),r=a=>{n(a===o?null:a)};return(0,s.jsx)(y.a,{padding:6,background:"neutral0",children:e.map(({category:a,categoryId:d,childrenForm:i},l)=>(0,s.jsx)(Ss,{childrenForm:i,isOpen:o===a,isWhite:l%2===1,name:a,onOpenCategory:r,pathToData:[t.kind,d],...t},a))})},Ss=({childrenForm:e,kind:t,name:o,isOpen:n=!1,isFormDisabled:r=!1,isWhite:a,onOpenCategory:d,pathToData:i})=>{const{formatMessage:l}=(0,W.A)(),c=()=>{d(o)},p=o.split("::").pop()??"";return(0,s.jsxs)(L.n,{expanded:n,onToggle:c,id:`accordion-${o}`,variant:a?"primary":"secondary",children:[(0,s.jsx)(U.P,{title:le(p),description:`${l({id:"Settings.permissions.category",defaultMessage:p},{category:p})} ${t==="plugins"?"plugin":t}`}),(0,s.jsx)(I.u,{children:(0,s.jsx)(y.a,{padding:6,children:e.map(({actions:g,subCategoryName:m,subCategoryId:f})=>(0,s.jsx)(Ds,{actions:g,categoryName:p,isFormDisabled:r,subCategoryName:m,pathToData:[...i,f]},m))})})]})},Ds=({actions:e=[],categoryName:t,isFormDisabled:o,subCategoryName:n,pathToData:r})=>{const[a,d]=_.useState(!1),{modifiedData:i,onChangeParentCheckbox:l,onChangeSimpleCheckbox:c}=Z(),{formatMessage:p}=(0,W.A)(),g=M(i,r,{}),m=_.useMemo(()=>Object.keys(g).reduce((O,E)=>(O[E]=Ce(g[E]),O),{}),[g]),{hasAllActionsSelected:f,hasSomeActionsSelected:x}=Q(m),h=()=>{d(O=>!O)},C=()=>{d(!1)},j=_.useMemo(()=>e.map(O=>{const E=[...r,O.action,"properties","enabled"],T=M(i,E,!1),v=M(i,[...r,O.action,"conditions"],{}),B=Y(v).some(K=>K);return{...O,isDisplayed:T,checkboxName:E.join(".."),hasSomeActionsSelected:T,value:T,hasConditions:B,label:O.displayName,actionId:O.action,pathToConditionsObject:[...r,O.action]}}),[e,i,r]),P=M(i,[...r],{}),$=Y(Object.entries(P).reduce((O,E)=>{const[T,{conditions:v}]=E;return O[T]=v,O},{})).some(O=>O);return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(y.a,{children:[(0,s.jsxs)(A.s,{justifyContent:"space-between",alignItems:"center",children:[(0,s.jsx)(y.a,{paddingRight:4,children:(0,s.jsx)(N.o,{variant:"sigma",textColor:"neutral600",children:n})}),(0,s.jsx)($s,{flex:1}),(0,s.jsx)(y.a,{paddingLeft:4,children:(0,s.jsx)(k.S,{name:r.join(".."),disabled:o,onValueChange:O=>{l({target:{name:r.join(".."),value:O}})},indeterminate:x,value:f,children:p({id:"app.utils.select-all",defaultMessage:"Select all"})})})]}),(0,s.jsxs)(A.s,{paddingTop:6,paddingBottom:6,children:[(0,s.jsx)(ce.x,{gap:2,style:{flex:1},children:j.map(({checkboxName:O,value:E,action:T,displayName:v,hasConditions:B})=>(0,s.jsx)(ue.E,{col:3,children:(0,s.jsx)(Ls,{disabled:o,hasConditions:B,children:(0,s.jsx)(k.S,{name:O,disabled:o,onValueChange:K=>{c({target:{name:O,value:K}})},value:E,children:v})})},T))}),(0,s.jsx)(de,{hasConditions:$,onClick:h})]})]}),a&&(0,s.jsx)(Ie,{headerBreadCrumbs:[t,n],actions:j,isFormDisabled:o,onClosed:C,onToggle:h})]})},$s=(0,D.Ay)(y.a)`
  align-self: center;
  border-top: 1px solid ${({theme:e})=>e.colors.neutral150};
`,Ls=D.Ay.div`
  position: relative;
  word-break: keep-all;
  ${({hasConditions:e,disabled:t,theme:o})=>e&&`
    &:before {
      content: '';
      position: absolute;
      top: ${-4/16}rem;
      left: ${-8/16}rem;
      width: ${6/16}rem;
      height: ${6/16}rem;
      border-radius: ${20/16}rem;
      background: ${t?o.colors.neutral100:o.colors.primary600};
    }
  `}
`,Rs=[{labelId:"app.components.LeftMenuLinkContainer.collectionTypes",defaultMessage:"Collection Types",id:"collectionTypes"},{labelId:"app.components.LeftMenuLinkContainer.singleTypes",id:"singleTypes",defaultMessage:"Single Types"},{labelId:"app.components.LeftMenuLinkContainer.plugins",defaultMessage:"Plugins",id:"plugins"},{labelId:"app.components.LeftMenuLinkContainer.settings",defaultMessage:"Settings",id:"settings"}],Bs=_.forwardRef(({layout:e,isFormDisabled:t,permissions:o=[]},n)=>{const[{initialData:r,layouts:a,modifiedData:d},i]=_.useReducer(ks,Is,()=>Ws(e,o)),{formatMessage:l}=(0,W.A)();_.useImperativeHandle(n,()=>({getPermissions(){const x=(0,ye.iv)(r.collectionTypes,d.collectionTypes),h=(0,ye.iv)(r.singleTypes,d.singleTypes),C={...x,...h};let j;return ee(C)?j=!1:j=Object.values(C).some((P={})=>Object.values(P).some($=>ie($,"conditions"))),{permissionsToSend:is(d),didUpdateConditions:j}},resetForm(){i({type:"RESET_FORM"})},setFormAfterSubmit(){i({type:"SET_FORM_AFTER_SUBMIT"})}}));const c=(x,h,C,j)=>{i({type:"ON_CHANGE_COLLECTION_TYPE_ROW_LEFT_CHECKBOX",pathToCollectionType:x,propertyName:h,rowName:C,value:j})},p=(x,h,C)=>{i({type:"ON_CHANGE_COLLECTION_TYPE_GLOBAL_ACTION_CHECKBOX",collectionTypeKind:x,actionId:h,value:C})},g=x=>{i({type:"ON_CHANGE_CONDITIONS",conditions:x})},m=_.useCallback(({target:{name:x,value:h}})=>{i({type:"ON_CHANGE_SIMPLE_CHECKBOX",keys:x,value:h})},[]),f=_.useCallback(({target:{name:x,value:h}})=>{i({type:"ON_CHANGE_TOGGLE_PARENT_CHECKBOX",keys:x,value:h})},[]);return(0,s.jsx)(ns,{availableConditions:e.conditions,modifiedData:d,onChangeConditions:g,onChangeSimpleCheckbox:m,onChangeParentCheckbox:f,onChangeCollectionTypeLeftActionRowCheckbox:c,onChangeCollectionTypeGlobalActionCheckbox:p,children:(0,s.jsxs)(Xe.f,{id:"tabs",label:l({id:"Settings.permissions.users.tabs.label",defaultMessage:"Tabs Permissions"}),children:[(0,s.jsx)(_e.t,{children:Rs.map(x=>(0,s.jsx)(_e.o,{children:l({id:x.labelId,defaultMessage:x.defaultMessage})},x.id))}),(0,s.jsxs)(q.T,{style:{position:"relative"},children:[(0,s.jsx)(q.K,{children:(0,s.jsx)(Ue,{layout:a.collectionTypes,kind:"collectionTypes",isFormDisabled:t})}),(0,s.jsx)(q.K,{children:(0,s.jsx)(Ue,{layout:a.singleTypes,kind:"singleTypes",isFormDisabled:t})}),(0,s.jsx)(q.K,{children:(0,s.jsx)(Ne,{layout:a.plugins,kind:"plugins",isFormDisabled:t})}),(0,s.jsx)(q.K,{children:(0,s.jsx)(Ne,{layout:a.settings,kind:"settings",isFormDisabled:t})})]})]})})}),Is={initialData:{},modifiedData:{},layouts:{}},ks=(e,t)=>(0,je.Ay)(e,o=>{switch(t.type){case"ON_CHANGE_COLLECTION_TYPE_GLOBAL_ACTION_CHECKBOX":{const{collectionTypeKind:n,actionId:r,value:a}=t,d=["modifiedData",n];Object.keys(M(e,d)).forEach(i=>{const l=M(e,[...d,i,r],void 0);if(l){let c=se(l,a);if(!a&&c.conditions){const p=se(c.conditions,!1);c={...c,conditions:p}}H(o,[...d,i,r],c)}});break}case"ON_CHANGE_COLLECTION_TYPE_ROW_LEFT_CHECKBOX":{const{pathToCollectionType:n,propertyName:r,rowName:a,value:d}=t;let i=pe(e.modifiedData);const l=n.split(".."),c=M(i,l,{});Object.keys(c).forEach(p=>{if(ie(c[p],`properties.${r}`)){const g=M(c,[p,"properties",r,a]),m=[...l,p,"properties",r,a];if(!(0,X.F)(g))H(i,m,d);else{const f=se(g,d);H(i,m,f)}}}),d||(i=re(i)),H(o,"modifiedData",i);break}case"ON_CHANGE_CONDITIONS":{Object.entries(t.conditions).forEach(n=>{const[r,a]=n;H(o,["modifiedData",...r.split(".."),"conditions"],a)});break}case"ON_CHANGE_SIMPLE_CHECKBOX":{let n=pe(e.modifiedData);H(n,[...t.keys.split("..")],t.value),t.value||(n=re(n)),H(o,"modifiedData",n);break}case"ON_CHANGE_TOGGLE_PARENT_CHECKBOX":{const{keys:n,value:r}=t,a=[...n.split("..")];let d=pe(e.modifiedData);const i=M(d,a,{}),l=se(i,r);H(d,a,l),r||(d=re(d)),H(o,["modifiedData"],d);break}case"RESET_FORM":{o.modifiedData=e.initialData;break}case"SET_FORM_AFTER_SUBMIT":{o.initialData=e.modifiedData;break}default:return o}}),Ws=(e,t)=>{const{conditions:o,sections:{collectionTypes:n,singleTypes:r,plugins:a,settings:d}}=e,i={collectionTypes:n,singleTypes:r,plugins:De(a,"plugin"),settings:De(d,"category")},l={collectionTypes:Se(n,o,t),singleTypes:Se(r,o,t),plugins:Te(i.plugins,o,t),settings:Te(i.settings,o,t)};return{initialData:l,modifiedData:l,layouts:i}}},80988(w,G,u){"use strict";u.d(G,{B:()=>I});var s=u(64749),_=u(8591),L=u(93117);const I=({options:b,...y})=>(0,s.jsx)(L.KF,{...y,children:b.map(S=>"children"in S?(0,s.jsx)(L.np,{label:S.label,values:S.children.map(k=>k.value.toString()),children:S.children.map(k=>(0,s.jsx)(U,{value:k.value,children:k.label},k.value))},S.label):(0,s.jsx)(L.fe,{value:S.value,children:S.label},S.value))}),U=(0,_.Ay)(L.fe)`
  padding-left: ${({theme:b})=>b.spaces[7]};
`}}]);
