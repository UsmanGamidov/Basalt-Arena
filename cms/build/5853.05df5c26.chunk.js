"use strict";(self.webpackChunkcms=self.webpackChunkcms||[]).push([[5853],{35853(I,D,_){_.r(D),_.d(D,{LoginEE:()=>T});var E=_(64749),a=_(868),O=_(91084),P=_(81148),M=_(35784),l=_(75363),i=_(8591),n=_(1473),d=_(7893),L=_(91438),C=_(61169),o=_(92363),h=_(56414),s=_(33808),A=_(25715),B=_(16646),t=_(83353),K=_(36447),m=_(75255),g=_(72534),x=_(90683),j=_(5871),f=_(31346),y=_(9481),c=_(6656),S=_(58436),$=_(85246),N=_(47944),F=_(57866),z=_(97304),G=_(42005),Q=_(35225),X=_(47010),Y=_(80571),Z=_(17988),H=_(41324),J=_(29165),V=_(35334),u=_(70584),p=_(78982),e=_(63698),w=_(30272),k=_(89396),b=_(58029),q=_(52393),__=_(62027),E_=_(37360),s_=_(20709),t_=_(41395),a_=_(92117),O_=_(93835),n_=_(3346),D_=_(67880),P_=_(10258),M_=_(94665),d_=_(44653);const r=(0,i.Ay)(O.c)`
  flex: 1;
`,T=R=>{const{formatMessage:U}=(0,l.A)(),{isLoading:W,data:v=[]}=(0,n.g)(void 0,{skip:!window.strapi.features.isEnabled(window.strapi.features.SSO)});return!window.strapi.features.isEnabled(window.strapi.features.SSO)||!W&&v.length===0?(0,E.jsx)(n.L,{...R}):(0,E.jsx)(n.L,{...R,children:(0,E.jsx)(a.a,{paddingTop:7,children:(0,E.jsxs)(P.s,{direction:"column",alignItems:"stretch",gap:7,children:[(0,E.jsxs)(P.s,{children:[(0,E.jsx)(r,{}),(0,E.jsx)(a.a,{paddingLeft:3,paddingRight:3,children:(0,E.jsx)(M.o,{variant:"sigma",textColor:"neutral600",children:U({id:"Auth.login.sso.divider"})})}),(0,E.jsx)(r,{})]}),(0,E.jsx)(d.S,{providers:v,displayAllProviders:!1})]})})})}},7893(I,D,_){_.d(D,{S:()=>L});var E=_(64749),a=_(88038),O=_(52067),P=_(81148),M=_(32973),l=_(35784),i=_(75363),n=_(24448),d=_(8591);const L=({providers:s,displayAllProviders:A})=>{const{formatMessage:B}=(0,i.A)();return A?(0,E.jsx)(a.x,{gap:4,children:s.map(t=>(0,E.jsx)(O.E,{col:4,children:(0,E.jsx)(o,{provider:t})},t.uid))}):s.length>2&&!A?(0,E.jsxs)(a.x,{gap:4,children:[s.slice(0,2).map(t=>(0,E.jsx)(O.E,{col:4,children:(0,E.jsx)(o,{provider:t})},t.uid)),(0,E.jsx)(O.E,{col:4,children:(0,E.jsx)(M.m,{label:B({id:"global.see-more"}),children:(0,E.jsx)(h,{as:n.N_,to:"/auth/providers",children:(0,E.jsx)("span",{"aria-hidden":!0,children:"\u2022\u2022\u2022"})})})})]}):(0,E.jsx)(C,{justifyContent:"center",children:s.map(t=>(0,E.jsx)(o,{provider:t},t.uid))})},C=(0,d.Ay)(P.s)`
  & a:not(:first-child):not(:last-child) {
    margin: 0 ${({theme:s})=>s.spaces[2]};
  }
  & a:first-child {
    margin-right: ${({theme:s})=>s.spaces[2]};
  }
  & a:last-child {
    margin-left: ${({theme:s})=>s.spaces[2]};
  }
`,o=({provider:s})=>(0,E.jsx)(M.m,{label:s.displayName,children:(0,E.jsx)(h,{href:`${window.strapi.backendURL}/admin/connect/${s.uid}`,children:s.icon?(0,E.jsx)("img",{src:s.icon,"aria-hidden":!0,alt:"",height:"32px"}):(0,E.jsx)(l.o,{children:s.displayName})})}),h=d.Ay.a`
  width: ${136/16}rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${48/16}rem;
  border: 1px solid ${({theme:s})=>s.colors.neutral150};
  border-radius: ${({theme:s})=>s.borderRadius};
  text-decoration: inherit;
  &:link {
    text-decoration: none;
  }
  color: ${({theme:s})=>s.colors.neutral600};
`}}]);
