"use strict";(self.webpackChunkcms=self.webpackChunkcms||[]).push([[8187],{58927(A,O,s){s.d(O,{B:()=>K,D:()=>B,H:()=>U,R:()=>y});var t=s(64749),E=s(11106),D=s(92389),g=s(85379),M=s(34956),P=s(81148),m=s(35784),i=s(91438),r=s(18087),o=s(71714),l=s(75363),d=s(1473),T=s(83811),_=s(8591);const c=(0,_.Ay)(P.s)`
  svg path {
    fill: ${({theme:a})=>a.colors.neutral600};
  }
`,W=({name:a})=>(0,t.jsxs)(P.s,{background:"primary100",borderStyle:"dashed",borderColor:"primary600",borderWidth:"1px",gap:3,hasRadius:!0,padding:3,shadow:"tableShadow",width:(0,i.a8)(300),children:[(0,t.jsx)(c,{alignItems:"center",background:"neutral200",borderRadius:"50%",height:6,justifyContent:"center",width:6,children:(0,t.jsx)(o.A,{width:`${8/16}rem`})}),(0,t.jsx)(m.o,{fontWeight:"bold",children:a})]}),B=()=>(0,t.jsx)(d.P,{renderItem:a=>{if(a.type===T.D.STAGE)return(0,t.jsx)(W,{name:typeof a.item=="string"?a.item:null})}}),y=({children:a})=>(0,t.jsx)(E.P,{children:(0,t.jsx)(M.g,{tabIndex:-1,children:(0,t.jsx)(D.s,{children:a})})}),K=({href:a})=>{const{formatMessage:h}=(0,l.A)();return(0,t.jsx)(i.N_,{startIcon:(0,t.jsx)(r.A,{}),to:a,children:h({id:"global.back",defaultMessage:"Back"})})},U=({title:a,subtitle:h,navigationAction:L,primaryAction:C})=>(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(i.x7,{name:a}),(0,t.jsx)(g.Q,{navigationAction:L,primaryAction:C,title:a,subtitle:h})]})},28187(A,O,s){s.d(O,{ProtectedReviewWorkflowsPage:()=>V});var t=s(64749),E=s(83353),D=s(19476),g=s(94946),M=s(81148),P=s(12560),m=s(89008),i=s(32182),r=s(84570),o=s(70044),l=s(37741),d=s(35784),T=s(63052),_=s(91438),c=s(51658),W=s(14993),B=s(79393),y=s(75363),K=s(10474),U=s(8591),a=s(1473),h=s(10667),L=s(58927),C=s(89587),G=s(83811),Y=s(18279),ls=s(61169),Es=s(92363),ds=s(56414),Ds=s(33808),Ms=s(25715),Ps=s(16646),Os=s(36447),gs=s(75255),ms=s(72534),cs=s(90683),vs=s(5871),fs=s(31346),Ts=s(9481),hs=s(6656),Cs=s(58436),As=s(85246),Ws=s(47944),Ls=s(57866),Rs=s(97304),Is=s(42005),Bs=s(35225),ys=s(47010),Ks=s(80571),Us=s(17988),js=s(41324),xs=s(29165),us=s(35334),ws=s(70584),ps=s(78982),Ss=s(63698),$s=s(30272),Ns=s(89396),Fs=s(58029),zs=s(52393),Qs=s(62027),Gs=s(37360),Ys=s(20709),Xs=s(41395),Hs=s(92117),Vs=s(93835),Zs=s(3346),Js=s(67880),ks=s(10258),bs=s(94665),qs=s(44653),st=s(21615);const X=(0,U.Ay)(_.N_)`
  align-items: center;
  height: ${(0,_.a8)(32)};
  display: flex;
  justify-content: center;
  padding: ${({theme:e})=>`${e.spaces[2]}}`};
  width: ${(0,_.a8)(32)};

  svg {
    height: ${(0,_.a8)(12)};
    width: ${(0,_.a8)(12)};

    path {
      fill: ${({theme:e})=>e.colors.neutral500};
    }
  }

  &:hover,
  &:focus {
    svg {
      path {
        fill: ${({theme:e})=>e.colors.neutral800};
      }
    }
  }
`,H=()=>{const{formatMessage:e}=(0,y.A)(),{push:R}=(0,K.W6)(),{trackUsage:p}=(0,_.z1)(),[j,x]=E.useState(null),[Z,I]=E.useState(!1),{collectionTypes:J,singleTypes:k,isLoading:b}=(0,h.u)(),{meta:v,workflows:S,isLoading:u,deleteWorkflow:q}=(0,Y.u)(),[ss,$]=E.useState(!1),{_unstableFormatAPIError:ts}=(0,_.wq)(),w=(0,_.hN)(),{getFeature:os,isLoading:N}=(0,a.m)(),es=(0,a.j)(n=>n.admin_app.permissions.settings?.["review-workflows"]),{allowedActions:{canCreate:F,canDelete:ns}}=(0,_.ec)(es),f=os("review-workflows")?.[G.C],_s=n=>[...J,...k].find(Q=>Q.uid===n)?.info.displayName,as=n=>{x(n)},is=()=>{x(null)},rs=async()=>{if(j)try{$(!0);const n=await q({id:j});if("error"in n){w({type:"warning",message:ts(n.error)});return}x(null),w({type:"success",message:{id:"notification.success.deleted",defaultMessage:"Deleted"}})}catch{w({type:"warning",message:{id:"notification.error.unexpected",defaultMessage:"An error occurred"}})}finally{$(!1)}};return E.useEffect(()=>{!u&&!N&&f&&v&&v?.workflowCount>parseInt(f,10)&&I(!0)},[N,u,v,v?.workflowCount,f]),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(L.H,{primaryAction:F&&(0,t.jsx)(_.z9,{startIcon:(0,t.jsx)(W.A,{}),size:"S",to:"/settings/review-workflows/create",onClick:n=>{f&&v&&v?.workflowCount>=parseInt(f,10)?(n.preventDefault(),I(!0)):p("willCreateWorkflow")},children:e({id:"Settings.review-workflows.list.page.create",defaultMessage:"Create new workflow"})}),subtitle:e({id:"Settings.review-workflows.list.page.subtitle",defaultMessage:"Manage your content review process"}),title:e({id:"Settings.review-workflows.list.page.title",defaultMessage:"Review Workflows"})}),(0,t.jsxs)(L.R,{children:[u||b?(0,t.jsx)(M.s,{justifyContent:"center",children:(0,t.jsx)(g.a,{children:e({id:"Settings.review-workflows.page.list.isLoading",defaultMessage:"Workflows are loading"})})}):(0,t.jsxs)(P.X,{colCount:3,footer:F&&(0,t.jsx)(l.S,{icon:(0,t.jsx)(W.A,{}),onClick:()=>{f&&v&&v?.workflowCount>=parseInt(f,10)?I(!0):(R("/settings/review-workflows/create"),p("willCreateWorkflow"))},children:e({id:"Settings.review-workflows.list.page.create",defaultMessage:"Create new workflow"})}),rowCount:1,children:[(0,t.jsx)(i.d,{children:(0,t.jsxs)(r.Tr,{children:[(0,t.jsx)(o.Th,{children:(0,t.jsx)(d.o,{variant:"sigma",children:e({id:"Settings.review-workflows.list.page.list.column.name.title",defaultMessage:"Name"})})}),(0,t.jsx)(o.Th,{children:(0,t.jsx)(d.o,{variant:"sigma",children:e({id:"Settings.review-workflows.list.page.list.column.stages.title",defaultMessage:"Stages"})})}),(0,t.jsx)(o.Th,{children:(0,t.jsx)(d.o,{variant:"sigma",children:e({id:"Settings.review-workflows.list.page.list.column.contentTypes.title",defaultMessage:"Content Types"})})}),(0,t.jsx)(o.Th,{children:(0,t.jsx)(T.s,{children:e({id:"Settings.review-workflows.list.page.list.column.actions.title",defaultMessage:"Actions"})})})]})}),(0,t.jsx)(m.N,{children:S?.map(n=>(0,E.createElement)(r.Tr,{...(0,_.qM)({fn(z){z.target.nodeName!=="BUTTON"&&R(`/settings/review-workflows/${n.id}`)}}),key:`workflow-${n.id}`},(0,t.jsx)(o.Td,{width:(0,_.a8)(250),children:(0,t.jsx)(d.o,{textColor:"neutral800",fontWeight:"bold",ellipsis:!0,children:n.name})}),(0,t.jsx)(o.Td,{children:(0,t.jsx)(d.o,{textColor:"neutral800",children:n.stages.length})}),(0,t.jsx)(o.Td,{children:(0,t.jsx)(d.o,{textColor:"neutral800",children:(n?.contentTypes??[]).map(_s).join(", ")})}),(0,t.jsx)(o.Td,{children:(0,t.jsxs)(M.s,{alignItems:"center",justifyContent:"end",children:[(0,t.jsx)(X,{to:`/settings/review-workflows/${n.id}`,"aria-label":e({id:"Settings.review-workflows.list.page.list.column.actions.edit.label",defaultMessage:"Edit {name}"},{name:n.name}),children:(0,t.jsx)(c.A,{})}),S.length>1&&ns&&(0,t.jsx)(D.K,{"aria-label":e({id:"Settings.review-workflows.list.page.list.column.actions.delete.label",defaultMessage:"Delete {name}"},{name:"Default workflow"}),icon:(0,t.jsx)(B.A,{}),noBorder:!0,onClick:()=>{as(String(n.id))}})]})})))})]}),(0,t.jsx)(_.TM,{bodyText:{id:"Settings.review-workflows.list.page.delete.confirm.body",defaultMessage:"If you remove this worfklow, all stage-related information will be removed for this content-type. Are you sure you want to remove it?"},isConfirmButtonLoading:ss,isOpen:!!j,onToggleDialog:is,onConfirm:rs}),(0,t.jsxs)(C.L.Root,{isOpen:Z,onClose:()=>I(!1),children:[(0,t.jsx)(C.L.Title,{children:e({id:"Settings.review-workflows.list.page.workflows.limit.title",defaultMessage:"You\u2019ve reached the limit of workflows in your plan"})}),(0,t.jsx)(C.L.Body,{children:e({id:"Settings.review-workflows.list.page.workflows.limit.body",defaultMessage:"Delete a workflow or contact Sales to enable more workflows."})})]})]})]})},V=()=>{const e=(0,a.j)(R=>R.admin_app.permissions.settings?.["review-workflows"]?.main);return(0,t.jsx)(_.kz,{permissions:e,children:(0,t.jsx)(H,{})})}},10667(A,O,s){s.d(O,{u:()=>m});var t=s(83353),E=s(91438),D=s(1473);const g=D.n.injectEndpoints({endpoints:i=>({getComponents:i.query({query:()=>({url:"/content-manager/components",method:"GET"}),transformResponse:r=>r.data}),getContentTypes:i.query({query:()=>({url:"/content-manager/content-types",method:"GET"}),transformResponse:r=>r.data})}),overrideExisting:!1}),{useGetComponentsQuery:M,useGetContentTypesQuery:P}=g;function m(){const{_unstableFormatAPIError:i}=(0,E.wq)(),r=(0,E.hN)(),o=M(),l=P();t.useEffect(()=>{l.error&&r({type:"warning",message:i(l.error)})},[l.error,i,r]),t.useEffect(()=>{o.error&&r({type:"warning",message:i(o.error)})},[o.error,i,r]);const d=o.isLoading||l.isLoading,T=t.useMemo(()=>(l?.data??[]).filter(c=>c.kind==="collectionType"&&c.isDisplayed),[l?.data]),_=t.useMemo(()=>(l?.data??[]).filter(c=>c.kind!=="collectionType"&&c.isDisplayed),[l?.data]);return{isLoading:d,components:t.useMemo(()=>o?.data??[],[o?.data]),collectionTypes:T,singleTypes:_}}},18279(A,O,s){s.d(O,{u:()=>E});var t=s(21615);function E(D={}){const{id:g="",...M}=D,{data:P,isLoading:m}=(0,t.c)({id:g,populate:"stages",...M}),[i]=(0,t.d)(),[r]=(0,t.e)(),[o]=(0,t.f)(),{workflows:l,meta:d}=P??{};return{meta:d,workflows:l,isLoading:m,createWorkflow:i,updateWorkflow:r,deleteWorkflow:o}}},37741(A,O,s){s.d(O,{S:()=>r});var t=s(64749),E=s(8591),D=s(868),g=s(91084),M=s(81148),P=s(35784);const m=(0,E.Ay)(D.a)`
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
    fill: ${({theme:o})=>o.colors.primary600};
  }
`,i=(0,E.Ay)(D.a)`
  border-radius: 0 0 ${({theme:o})=>o.borderRadius} ${({theme:o})=>o.borderRadius};
  display: block;
  width: 100%;
  border: none;
`,r=({children:o,icon:l,...d})=>(0,t.jsxs)("div",{children:[(0,t.jsx)(g.c,{}),(0,t.jsx)(i,{as:"button",background:"primary100",padding:5,...d,children:(0,t.jsxs)(M.s,{children:[(0,t.jsx)(m,{"aria-hidden":!0,background:"primary200",children:l}),(0,t.jsx)(D.a,{paddingLeft:3,children:(0,t.jsx)(P.o,{variant:"pi",fontWeight:"bold",textColor:"primary600",children:o})})]})})]})}}]);
