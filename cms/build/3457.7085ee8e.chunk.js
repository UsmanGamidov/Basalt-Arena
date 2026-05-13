"use strict";(self.webpackChunkcms=self.webpackChunkcms||[]).push([[3457],{7893(W,M,_){_.d(M,{S:()=>A});var s=_(64749),a=_(88038),D=_(52067),h=_(81148),P=_(32973),C=_(35784),n=_(75363),d=_(24448),l=_(8591);const A=({providers:E,displayAllProviders:r})=>{const{formatMessage:B}=(0,n.A)();return r?(0,s.jsx)(a.x,{gap:4,children:E.map(t=>(0,s.jsx)(D.E,{col:4,children:(0,s.jsx)(o,{provider:t})},t.uid))}):E.length>2&&!r?(0,s.jsxs)(a.x,{gap:4,children:[E.slice(0,2).map(t=>(0,s.jsx)(D.E,{col:4,children:(0,s.jsx)(o,{provider:t})},t.uid)),(0,s.jsx)(D.E,{col:4,children:(0,s.jsx)(P.m,{label:B({id:"global.see-more"}),children:(0,s.jsx)(i,{as:d.N_,to:"/auth/providers",children:(0,s.jsx)("span",{"aria-hidden":!0,children:"\u2022\u2022\u2022"})})})})]}):(0,s.jsx)(v,{justifyContent:"center",children:E.map(t=>(0,s.jsx)(o,{provider:t},t.uid))})},v=(0,l.Ay)(h.s)`
  & a:not(:first-child):not(:last-child) {
    margin: 0 ${({theme:E})=>E.spaces[2]};
  }
  & a:first-child {
    margin-right: ${({theme:E})=>E.spaces[2]};
  }
  & a:last-child {
    margin-left: ${({theme:E})=>E.spaces[2]};
  }
`,o=({provider:E})=>(0,s.jsx)(P.m,{label:E.displayName,children:(0,s.jsx)(i,{href:`${window.strapi.backendURL}/admin/connect/${E.uid}`,children:E.icon?(0,s.jsx)("img",{src:E.icon,"aria-hidden":!0,alt:"",height:"32px"}):(0,s.jsx)(C.o,{children:E.displayName})})}),i=l.Ay.a`
  width: ${136/16}rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${48/16}rem;
  border: 1px solid ${({theme:E})=>E.colors.neutral150};
  border-radius: ${({theme:E})=>E.borderRadius};
  text-decoration: inherit;
  &:link {
    text-decoration: none;
  }
  color: ${({theme:E})=>E.colors.neutral600};
`},23457(W,M,_){_.r(M),_.d(M,{FORMS:()=>U});var s=_(64749),a=_(868),D=_(96326),h=_(91084),P=_(94946),C=_(34956),n=_(81148),d=_(35784),l=_(525),A=_(75363),v=_(24448),o=_(10474),i=_(8591),E=_(1473),r=_(7893),B=_(91438),t=_(61169),g=_(92363),x=_(56414),j=_(33808),c=_(25715),f=_(16646),y=_(83353),S=_(36447),$=_(75255),N=_(72534),F=_(90683),u=_(5871),z=_(31346),G=_(9481),Q=_(6656),X=_(58436),Y=_(85246),Z=_(47944),H=_(57866),J=_(97304),V=_(42005),e=_(35225),p=_(47010),k=_(80571),w=_(17988),b=_(41324),q=_(29165),__=_(35334),s_=_(70584),E_=_(78982),t_=_(63698),a_=_(30272),n_=_(89396),d_=_(58029),o_=_(52393),O_=_(62027),D_=_(37360),M_=_(20709),P_=_(41395),l_=_(92117),i_=_(93835),r_=_(3346),h_=_(67880),C_=_(10258),A_=_(94665),v_=_(44653);const T=()=>{const{push:I}=(0,o.W6)(),{formatMessage:O}=(0,A.A)(),{isLoading:m,data:L=[]}=(0,E.g)(void 0,{skip:!window.strapi.features.isEnabled(window.strapi.features.SSO)}),K=()=>{I("/auth/login")};return!window.strapi.features.isEnabled(window.strapi.features.SSO)||!m&&L.length===0?(0,s.jsx)(o.rd,{to:"/auth/login"}):(0,s.jsx)(E.U,{children:(0,s.jsxs)(C.g,{children:[(0,s.jsxs)(E.h,{children:[(0,s.jsxs)(E.C,{children:[(0,s.jsx)(E.i,{}),(0,s.jsx)(a.a,{paddingTop:6,paddingBottom:1,children:(0,s.jsx)(d.o,{as:"h1",variant:"alpha",children:O({id:"Auth.form.welcome.title"})})}),(0,s.jsx)(a.a,{paddingBottom:7,children:(0,s.jsx)(d.o,{variant:"epsilon",textColor:"neutral600",children:O({id:"Auth.login.sso.subtitle"})})})]}),(0,s.jsxs)(n.s,{direction:"column",alignItems:"stretch",gap:7,children:[m?(0,s.jsx)(n.s,{justifyContent:"center",children:(0,s.jsx)(P.a,{children:O({id:"Auth.login.sso.loading"})})}):(0,s.jsx)(r.S,{providers:L}),(0,s.jsxs)(n.s,{children:[(0,s.jsx)(R,{}),(0,s.jsx)(a.a,{paddingLeft:3,paddingRight:3,children:(0,s.jsx)(d.o,{variant:"sigma",textColor:"neutral600",children:O({id:"or"})})}),(0,s.jsx)(R,{})]}),(0,s.jsx)(D.$,{fullWidth:!0,size:"L",onClick:K,children:O({id:"Auth.form.button.login.strapi"})})]})]}),(0,s.jsx)(n.s,{justifyContent:"center",children:(0,s.jsx)(a.a,{paddingTop:4,children:(0,s.jsx)(l.N,{as:v.k2,to:"/auth/forgot-password",children:(0,s.jsx)(d.o,{variant:"pi",children:O({id:"Auth.link.forgot-password"})})})})})]})})},R=(0,i.Ay)(h.c)`
  flex: 1;
`,U={providers:T}}}]);
