"use strict";(self.webpackChunkcms=self.webpackChunkcms||[]).push([[1705],{37741(dt,S,s){s.d(S,{S:()=>N});var t=s(64749),_=s(8591),P=s(868),X=s(91084),F=s(81148),G=s(35784);const w=(0,_.Ay)(P.a)`
  height: ${24/16}rem;
  width: ${24/16}rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    height: ${10/16}rem;
    width: ${10/16}rem;
  }

  svg path {
    fill: ${({theme:C})=>C.colors.primary600};
  }
`,m=(0,_.Ay)(P.a)`
  border-radius: 0 0 ${({theme:C})=>C.borderRadius} ${({theme:C})=>C.borderRadius};
  display: block;
  width: 100%;
  border: none;
`,N=({children:C,icon:z,...I})=>(0,t.jsxs)("div",{children:[(0,t.jsx)(X.c,{}),(0,t.jsx)(m,{as:"button",background:"primary100",padding:5,...I,children:(0,t.jsxs)(F.s,{children:[(0,t.jsx)(w,{"aria-hidden":!0,background:"primary200",children:z}),(0,t.jsx)(P.a,{paddingLeft:3,children:(0,t.jsx)(G.o,{variant:"pi",fontWeight:"bold",textColor:"primary600",children:C})})]})})]})},51705(dt,S,s){s.r(S),s.d(S,{default:()=>Nt});var t=s(64749),_=s(868),P=s(96326),X=s(45852),F=s(19476),G=s(92389),w=s(85379),m=s(81148),N=s(12560),C=s(32182),z=s(84570),I=s(70044),ct=s(37741),E=s(35784),d=s(91438),ht=s(18087),_t=s(84259),pt=s(76895),gt=s(12652),ut=s(65872),Y=s(51658),W=s(14993),mt=s(79393),D=s(6656),Et=s(19268),J=s(47944),q=s(17988),R=s(75363),H=s(10474),L=s(83353),r=s(47783),f=s(8591),kt=s(16646),Zt=s(98530),Vt=s(58436),Xt=s(61312),Gt=s(21699),wt=s(82952),Ht=s(80571),Qt=s(90683),Yt=s(33102),Jt=s(42831),qt=s(36447),te=s(91638),ee=s(31346),se=s(9888),ne=s(9891),oe=s(41324),ae=s(47010),ie=s(72534),le=s(5871),re=s(9067);const ft=(0,f.Ay)(_.a)`
  table {
    width: 100%;
    white-space: nowrap;
  }

  thead {
    border-bottom: 1px solid ${({theme:e})=>e.colors.neutral150};

    tr {
      border-top: 0;
    }
  }

  tr {
    border-top: 1px solid ${({theme:e})=>e.colors.neutral150};

    & td,
    & th {
      padding: ${({theme:e})=>e.spaces[4]};
    }

    & td:first-of-type,
    & th:first-of-type {
      padding: 0 ${({theme:e})=>e.spaces[1]};
    }
  }

  th,
  td {
    vertical-align: middle;
    text-align: left;
    color: ${({theme:e})=>e.colors.neutral600};
    outline-offset: -4px;
  }
`,tt=f.Ay.tr`
  &.component-row,
  &.dynamiczone-row {
    position: relative;
    border-top: none !important;

    table tr:first-child {
      border-top: none;
    }

    > td:first-of-type {
      padding: 0 0 0 ${(0,d.a8)(20)};
      position: relative;

      &::before {
        content: '';
        width: ${(0,d.a8)(4)};
        height: calc(100% - 40px);
        position: absolute;
        top: -7px;
        left: 1.625rem;
        border-radius: 4px;

        ${({isFromDynamicZone:e,isChildOfDynamicZone:n,theme:o})=>n?`background-color: ${o.colors.primary200};`:e?`background-color: ${o.colors.primary200};`:`background: ${o.colors.neutral150};`}
      }
    }
  }

  &.dynamiczone-row > td:first-of-type {
    padding: 0;
  }
`,et=({customRowComponent:e,component:n,isFromDynamicZone:o=!1,isNestedInDZComponent:a=!1,firstLoopComponentUid:c})=>{const{modifiedData:l}=(0,r.u)(),{schema:{attributes:p}}=D(l,["components",n],{schema:{attributes:[]}});return(0,t.jsx)(tt,{isChildOfDynamicZone:o,className:"component-row",children:(0,t.jsx)("td",{colSpan:12,children:(0,t.jsx)(nt,{customRowComponent:e,items:p,targetUid:n,firstLoopComponentUid:c||n,editTarget:"components",isFromDynamicZone:o,isNestedInDZComponent:a,isSub:!0,secondLoopComponentUid:c?n:null})})})},xt=({isActive:e=!1,icon:n="cube"})=>(0,t.jsx)(m.s,{alignItems:"center",background:e?"primary200":"neutral200",justifyContent:"center",height:8,width:8,borderRadius:"50%",children:(0,t.jsx)(X.I,{as:r.C[n]||r.C.cube,height:5,width:5})}),st=(0,f.Ay)(_.a)`
  position: absolute;
  display: none;
  top: 5px;
  right: ${(0,d.a8)(8)};

  svg {
    width: ${(0,d.a8)(10)};
    height: ${(0,d.a8)(10)};

    path {
      fill: ${({theme:e})=>e.colors.primary600};
    }
  }
`,Mt=(0,f.Ay)(m.s)`
  width: ${(0,d.a8)(140)};
  height: ${(0,d.a8)(80)};
  position: relative;
  border: 1px solid ${({theme:e})=>e.colors.neutral200};
  background: ${({theme:e})=>e.colors.neutral100};
  border-radius: ${({theme:e})=>e.borderRadius};
  max-width: 100%;

  &.active,
  &:focus,
  &:hover {
    border: 1px solid ${({theme:e})=>e.colors.primary200};
    background: ${({theme:e})=>e.colors.primary100};

    ${st} {
      display: block;
    }

    ${E.o} {
      color: ${({theme:e})=>e.colors.primary600};
    }

    /* > ComponentIcon */
    > div:first-child {
      background: ${({theme:e})=>e.colors.primary200};
      color: ${({theme:e})=>e.colors.primary600};

      svg {
        path {
          fill: ${({theme:e})=>e.colors.primary600};
        }
      }
    }
  }
`,yt=({component:e,dzName:n,index:o,isActive:a=!1,isInDevelopmentMode:c=!1,onClick:l})=>{const{modifiedData:p,removeComponentFromDynamicZone:j}=(0,r.u)(),{schema:{icon:M,displayName:x}}=D(p,["components",e],{schema:{}}),g=i=>{i.stopPropagation(),j(n,o)};return(0,t.jsxs)(Mt,{alignItems:"center",direction:"column",className:a?"active":"",borderRadius:"borderRadius",justifyContent:"center",paddingLeft:4,paddingRight:4,shrink:0,onClick:l,role:"tab",tabIndex:a?0:-1,cursor:"pointer","aria-selected":a,"aria-controls":`dz-${n}-panel-${o}`,id:`dz-${n}-tab-${o}`,children:[(0,t.jsx)(xt,{icon:M,isActive:a}),(0,t.jsx)(_.a,{marginTop:1,maxWidth:"100%",children:(0,t.jsx)(E.o,{variant:"pi",fontWeight:"bold",ellipsis:!0,children:x})}),c&&(0,t.jsx)(st,{as:"button",onClick:g,children:(0,t.jsx)(pt.A,{})})]})},Dt=(0,f.Ay)(W.A)`
  width: ${(0,d.a8)(32)};
  height: ${(0,d.a8)(32)};
  padding: ${(0,d.a8)(9)};
  border-radius: ${(0,d.a8)(64)};
  background: ${({theme:e})=>e.colors.primary100};
  path {
    fill: ${({theme:e})=>e.colors.primary600};
  }
`,jt=(0,f.Ay)(_.a)`
  height: ${(0,d.a8)(90)};
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
`,Ct=(0,f.Ay)(m.s)`
  width: 100%;
  overflow-x: auto;
`,Ot=(0,f.Ay)(_.a)`
  padding-top: ${(0,d.a8)(90)};
`,Pt=(0,f.Ay)(m.s)`
  flex-shrink: 0;
  width: ${(0,d.a8)(140)};
  height: ${(0,d.a8)(80)};
  justify-content: center;
  align-items: center;
`,At=({customRowComponent:e,components:n=[],addComponent:o,name:a,targetUid:c})=>{const{isInDevelopmentMode:l}=(0,r.u)(),[p,j]=(0,L.useState)(0),{formatMessage:M}=(0,R.A)(),x=i=>{p!==i&&j(i)},g=()=>{o(a)};return(0,t.jsx)(tt,{className:"dynamiczone-row",isFromDynamicZone:!0,children:(0,t.jsxs)("td",{colSpan:12,children:[(0,t.jsx)(jt,{paddingLeft:8,children:(0,t.jsxs)(Ct,{gap:2,children:[l&&(0,t.jsx)("button",{type:"button",onClick:g,children:(0,t.jsxs)(Pt,{direction:"column",alignItems:"stretch",gap:1,children:[(0,t.jsx)(Dt,{}),(0,t.jsx)(E.o,{variant:"pi",fontWeight:"bold",textColor:"primary600",children:M({id:(0,r.g)("button.component.add"),defaultMessage:"Add a component"})})]})}),(0,t.jsx)(m.s,{role:"tablist",gap:2,children:n.map((i,h)=>(0,t.jsx)(yt,{dzName:a||"",index:h,component:i,isActive:p===h,isInDevelopmentMode:l,onClick:()=>x(h)},i))})]})}),(0,t.jsx)(Ot,{children:n.map((i,h)=>{const u={customRowComponent:e,component:i};return(0,t.jsx)(_.a,{id:`dz-${a}-panel-${h}`,role:"tabpanel","aria-labelledby":`dz-${a}-tab-${h}`,style:{display:p===h?"block":"none"},children:(0,t.jsx)("table",{children:(0,t.jsx)("tbody",{children:(0,L.createElement)(et,{...u,isFromDynamicZone:!0,component:c,key:i})})})},i)})})]})})},Tt=(0,f.Ay)(_.a)`
  height: ${24/16}rem;
  width: ${24/16}rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    height: ${10/16}rem;
    width: ${10/16}rem;
  }

  svg path {
    fill: ${({theme:e,color:n})=>e.colors[`${n}600`]};
  }
`,vt=(0,f.Ay)(_.a)`
  border-radius: 0 0 ${({theme:e})=>e.borderRadius} ${({theme:e})=>e.borderRadius};
  display: block;
  width: 100%;
  border: none;
  position: relative;
  left: -0.25rem;
`,bt=({children:e,icon:n,color:o,...a})=>(0,t.jsx)(vt,{paddingBottom:4,paddingTop:4,as:"button",type:"button",...a,children:(0,t.jsxs)(m.s,{children:[(0,t.jsx)(Tt,{color:o,"aria-hidden":!0,background:`${o}200`,children:n}),(0,t.jsx)(_.a,{paddingLeft:3,children:(0,t.jsx)(E.o,{variant:"pi",fontWeight:"bold",textColor:`${o}600`,children:e})})]})}),nt=({addComponentToDZ:e,customRowComponent:n,editTarget:o,firstLoopComponentUid:a,isFromDynamicZone:c=!1,isMain:l=!1,isNestedInDZComponent:p=!1,isSub:j=!1,items:M=[],secondLoopComponentUid:x,targetUid:g})=>{const{formatMessage:i}=(0,R.A)(),{trackUsage:h}=(0,d.z1)(),{isInDevelopmentMode:u,modifiedData:B,isInContentTypeView:A}=(0,r.u)(),{onOpenModalAddField:v}=(0,r.a)(),O=()=>{h("hasClickedCTBAddFieldBanner"),v({forTarget:o,targetUid:g})};return g?M.length===0&&l?(0,t.jsxs)(N.X,{colCount:2,rowCount:2,children:[(0,t.jsx)(C.d,{children:(0,t.jsxs)(z.Tr,{children:[(0,t.jsx)(I.Th,{children:(0,t.jsx)(E.o,{variant:"sigma",textColor:"neutral600",children:i({id:"global.name",defaultMessage:"Name"})})}),(0,t.jsx)(I.Th,{children:(0,t.jsx)(E.o,{variant:"sigma",textColor:"neutral600",children:i({id:"global.type",defaultMessage:"Type"})})})]})}),(0,t.jsx)(d.m5,{action:(0,t.jsx)(P.$,{onClick:O,size:"L",startIcon:(0,t.jsx)(W.A,{}),variant:"secondary",children:i({id:(0,r.g)("table.button.no-fields"),defaultMessage:"Add new field"})}),colSpan:2,content:A?{id:(0,r.g)("table.content.no-fields.collection-type"),defaultMessage:"Add your first field to this Collection-Type"}:{id:(0,r.g)("table.content.no-fields.component"),defaultMessage:"Add your first field to this component"}})]}):(0,t.jsxs)(ft,{children:[(0,t.jsx)(_.a,{paddingLeft:6,paddingRight:l?6:0,...l&&{style:{overflowX:"auto"}},children:(0,t.jsxs)("table",{children:[l&&(0,t.jsx)("thead",{children:(0,t.jsxs)("tr",{children:[(0,t.jsx)("th",{children:(0,t.jsx)(E.o,{variant:"sigma",textColor:"neutral600",children:i({id:"global.name",defaultMessage:"Name"})})}),(0,t.jsx)("th",{colSpan:2,children:(0,t.jsx)(E.o,{variant:"sigma",textColor:"neutral600",children:i({id:"global.type",defaultMessage:"Type"})})})]})}),(0,t.jsx)("tbody",{children:M.map(T=>{const{type:$}=T,K=n;return(0,t.jsxs)(L.Fragment,{children:[(0,t.jsx)(K,{...T,isNestedInDZComponent:p,targetUid:g,editTarget:o,firstLoopComponentUid:a,isFromDynamicZone:c,secondLoopComponentUid:x}),$==="component"&&(0,t.jsx)(et,{...T,customRowComponent:n,targetUid:g,isNestedInDZComponent:c,editTarget:o,firstLoopComponentUid:a}),$==="dynamiczone"&&(0,t.jsx)(At,{...T,customRowComponent:n,addComponent:e,targetUid:g})]},T.name)})})]})}),l&&u&&(0,t.jsx)(ct.S,{icon:(0,t.jsx)(W.A,{}),onClick:O,children:i({id:(0,r.g)(`form.button.add.field.to.${B.contentType?B.contentType.schema.kind:o||"collectionType"}`),defaultMessage:"Add another field"})}),j&&u&&!c&&(0,t.jsx)(bt,{icon:(0,t.jsx)(W.A,{}),onClick:O,color:c?"primary":"neutral",children:i({id:(0,r.g)("form.button.add.field.to.component"),defaultMessage:"Add another field"})})]}):(0,t.jsxs)(N.X,{colCount:2,rowCount:2,children:[(0,t.jsx)(C.d,{children:(0,t.jsxs)(z.Tr,{children:[(0,t.jsx)(I.Th,{children:(0,t.jsx)(E.o,{variant:"sigma",textColor:"neutral600",children:i({id:"global.name",defaultMessage:"Name"})})}),(0,t.jsx)(I.Th,{children:(0,t.jsx)(E.o,{variant:"sigma",textColor:"neutral600",children:i({id:"global.type",defaultMessage:"Type"})})})]})}),(0,t.jsx)(d.m5,{colSpan:2,content:{id:(0,r.g)("table.content.create-first-content-type"),defaultMessage:"Create your first Collection-Type"}})]})},Bt=(0,f.Ay)(_.a)`
  position: absolute;
  left: -1.125rem;
  top: 0px;

  &:before {
    content: '';
    width: ${4/16}rem;
    height: ${12/16}rem;
    background: ${({theme:e,color:n})=>e.colors[n]};
    display: block;
  }
`,$t=f.Ay.svg`
  position: relative;
  flex-shrink: 0;
  transform: translate(-0.5px, -1px);

  * {
    fill: ${({theme:e,color:n})=>e.colors[n]};
  }
`,It=e=>(0,t.jsx)(Bt,{children:(0,t.jsx)($t,{width:"20",height:"23",viewBox:"0 0 20 23",fill:"none",xmlns:"http://www.w3.org/2000/svg",...e,children:(0,t.jsx)("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M7.02477 14.7513C8.65865 17.0594 11.6046 18.6059 17.5596 18.8856C18.6836 18.9384 19.5976 19.8435 19.5976 20.9688V20.9688C19.5976 22.0941 18.6841 23.0125 17.5599 22.9643C10.9409 22.6805 6.454 20.9387 3.75496 17.1258C0.937988 13.1464 0.486328 7.39309 0.486328 0.593262H4.50974C4.50974 7.54693 5.06394 11.9813 7.02477 14.7513Z"})})}),Rt=({type:e,customField:n=null,repeatable:o=!1})=>{const{formatMessage:a}=(0,R.A)();let c=e;return["integer","biginteger","float","decimal"].includes(e)?c="number":["string"].includes(e)&&(c="text"),n?(0,t.jsx)(E.o,{children:a({id:(0,r.g)("attribute.customField"),defaultMessage:"Custom field"})}):(0,t.jsxs)(E.o,{children:[a({id:(0,r.g)(`attribute.${c}`),defaultMessage:e}),"\xA0",o&&a({id:(0,r.g)("component.repeatable"),defaultMessage:"(repeatable)"})]})},Wt=({content:e})=>(0,t.jsx)(t.Fragment,{children:q(e)}),Lt=(0,f.Ay)(_.a)`
  position: relative;
`,Kt=(0,L.memo)(({configurable:e=!0,customField:n=null,editTarget:o,firstLoopComponentUid:a=null,isFromDynamicZone:c=!1,name:l,onClick:p,relation:j="",repeatable:M=!1,secondLoopComponentUid:x=null,target:g=null,targetUid:i=null,type:h})=>{const{contentTypes:u,isInDevelopmentMode:B,removeAttribute:A}=(0,r.u)(),{formatMessage:v}=(0,R.A)(),O=h==="relation"&&j.includes("morph"),T=["integer","biginteger","float","decimal"].includes(h)?"number":h,$=D(u,[g],{}),K=D($,["schema","displayName"],""),U=D($,"plugin"),Q=g?"relation":T,k=()=>{O||e!==!1&&p(o,x||a||i,l,h,n)};let b;return x&&a?b=2:a?b=1:b=0,(0,t.jsxs)(Lt,{as:"tr",...(0,d.qM)({fn:k,condition:B&&e&&!O}),children:[(0,t.jsxs)("td",{style:{position:"relative"},children:[b!==0&&(0,t.jsx)(It,{color:c?"primary200":"neutral150"}),(0,t.jsxs)(m.s,{paddingLeft:2,gap:4,children:[(0,t.jsx)(r.A,{type:Q,customField:n}),(0,t.jsx)(E.o,{fontWeight:"bold",children:l})]})]}),(0,t.jsx)("td",{children:g?(0,t.jsxs)(E.o,{children:[v({id:(0,r.g)(`modelPage.attribute.${O?"relation-polymorphic":"relationWith"}`),defaultMessage:"Relation with"}),"\xA0",(0,t.jsxs)("span",{style:{fontStyle:"italic"},children:[(0,t.jsx)(Wt,{content:K}),"\xA0",U&&`(${v({id:(0,r.g)("from"),defaultMessage:"from"})}: ${U})`]})]}):(0,t.jsx)(Rt,{type:h,customField:n,repeatable:M})}),(0,t.jsx)("td",{children:B?(0,t.jsx)(m.s,{justifyContent:"flex-end",...d.dG,children:e?(0,t.jsxs)(m.s,{gap:1,children:[!O&&(0,t.jsx)(F.K,{onClick:k,label:`${v({id:"app.utils.edit",defaultMessage:"Edit"})} ${l}`,noBorder:!0,icon:(0,t.jsx)(Y.A,{})}),(0,t.jsx)(F.K,{onClick:Z=>{Z.stopPropagation(),A(o,l,x||a||"")},label:`${v({id:"global.delete",defaultMessage:"Delete"})} ${l}`,noBorder:!0,icon:(0,t.jsx)(mt.A,{})})]}):(0,t.jsx)(ut.A,{})}):(0,t.jsx)(_.a,{height:(0,d.a8)(32)})})]})}),Ut=e=>{let n;switch(e){case"date":case"datetime":case"time":case"timestamp":n="date";break;case"integer":case"biginteger":case"decimal":case"float":n="number";break;case"string":case"text":n="text";break;case"":n="relation";break;default:n=e}return n},St={collectionTypesConfigurations:[{action:"plugin::content-manager.collection-types.configure-view",subject:null}],componentsConfigurations:[{action:"plugin::content-manager.components.configure-layout",subject:null}],singleTypesConfigurations:[{action:"plugin::content-manager.single-types.configure-view",subject:null}]},Ft=(0,L.memo)(({disabled:e,isTemporary:n=!1,isInContentTypeView:o=!0,contentTypeKind:a="collectionType",targetUid:c=""})=>{const{formatMessage:l}=(0,R.A)(),{push:p}=(0,H.W6)(),{collectionTypesConfigurations:j,componentsConfigurations:M,singleTypesConfigurations:x}=St,g=l({id:"content-type-builder.form.button.configure-view",defaultMessage:"Configure the view"});let i=j;const h=()=>(n||p(o?`/content-manager/collection-types/${c}/configurations/edit`:`/content-manager/components/${c}/configurations/edit`),!1);return o&&a==="singleType"&&(i=x),o||(i=M),(0,t.jsx)(d.d4,{permissions:i,children:(0,t.jsx)(P.$,{startIcon:(0,t.jsx)(gt.A,{}),variant:"tertiary",onClick:h,disabled:n||e,children:g})})}),Nt=()=>{const{initialData:e,modifiedData:n,isInDevelopmentMode:o,isInContentTypeView:a,submitData:c}=(0,r.u)(),{formatMessage:l}=(0,R.A)(),{trackUsage:p}=(0,d.z1)(),j=(0,H.W5)("/plugins/content-type-builder/:kind/:currentUID"),{onOpenModalAddComponentsToDZ:M,onOpenModalAddField:x,onOpenModalEditField:g,onOpenModalEditSchema:i,onOpenModalEditCustomField:h}=(0,r.a)(),u=a?"contentType":"component",B=[u,"schema","attributes"],A=D(n,[u,"uid"]),v=D(n,[u,"isTemporary"],!1),O=D(n,[u,"schema","kind"],null),T=D(n,B,[]),$=Et(e,[u,"plugin"]),K=!J(n,e),U=a?"contentType":"component",Q=y=>{M({dynamicZoneTarget:y,targetUid:A})},k=async(y,ot,at,it,lt)=>{const rt=Ut(it);lt?h({forTarget:y,targetUid:ot,attributeName:at,attributeType:rt,customFieldUid:lt}):g({forTarget:y,targetUid:ot,attributeName:at,attributeType:rt,step:it==="component"?"2":null})};let b=D(n,[u,"schema","displayName"],"");const Z=D(n,[u,"schema","kind"],""),V=j?.params.currentUID==="create-content-type";!b&&V&&(b=l({id:(0,r.g)("button.model.create"),defaultMessage:"Create new collection type"}));const zt=()=>{const y=Z||u;y==="collectionType"&&p("willEditNameOfContentType"),y==="singleType"&&p("willEditNameOfSingleType"),i({modalType:u,forTarget:u,targetUid:A,kind:y})};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(H.XG,{message:y=>y.hash==="#back"?!1:l({id:(0,r.g)("prompt.unsaved")}),when:K}),(0,t.jsx)(w.Q,{id:"title",primaryAction:o&&(0,t.jsxs)(m.s,{gap:2,children:[!V&&(0,t.jsx)(P.$,{startIcon:(0,t.jsx)(W.A,{}),variant:"secondary",onClick:()=>{x({forTarget:U,targetUid:A})},children:l({id:(0,r.g)("button.attributes.add.another"),defaultMessage:"Add another field"})}),(0,t.jsx)(P.$,{startIcon:(0,t.jsx)(_t.A,{}),onClick:async()=>await c(),type:"submit",disabled:J(n,e),children:l({id:"global.save",defaultMessage:"Save"})})]}),secondaryAction:o&&!$&&!V&&(0,t.jsx)(P.$,{startIcon:(0,t.jsx)(Y.A,{}),variant:"tertiary",onClick:zt,children:l({id:"app.utils.edit",defaultMessage:"Edit"})}),title:q(b),subtitle:l({id:(0,r.g)("listView.headerLayout.description"),defaultMessage:"Build the data architecture of your content"}),navigationAction:(0,t.jsx)(d.N_,{startIcon:(0,t.jsx)(ht.A,{}),to:"/plugins/content-type-builder/",children:l({id:"global.back",defaultMessage:"Back"})})}),(0,t.jsx)(G.s,{children:(0,t.jsxs)(m.s,{direction:"column",alignItems:"stretch",gap:4,children:[(0,t.jsx)(m.s,{justifyContent:"flex-end",children:(0,t.jsx)(m.s,{gap:2,children:(0,t.jsx)(Ft,{targetUid:A,isTemporary:v,isInContentTypeView:a,contentTypeKind:O,disabled:V},"link-to-cm-settings-view")})}),(0,t.jsx)(_.a,{background:"neutral0",shadow:"filterShadow",hasRadius:!0,children:(0,t.jsx)(nt,{items:T,customRowComponent:y=>(0,t.jsx)(Kt,{...y,onClick:k}),addComponentToDZ:Q,targetUid:A,editTarget:U,isMain:!0})})]})})]})}}}]);
