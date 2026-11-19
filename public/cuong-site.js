(() => {
 "use strict";
 const byId=id=>document.getElementById(id);
 const config=JSON.parse(byId("cuong-config").textContent);
 const catalog=new Map(config.options.map(item=>[item.id,item]));
 const prices=new Map(config.plans.map(plan=>[plan.serviceId+":"+plan.id,plan]));
 const form=byId("pc-form"),inline=byId("inline-consult-form"),dialog=byId("package-consult");
 let active=null,returnFocus,oldOverflow="";
 const selections=new WeakMap(),requests=new WeakMap();
 const money=value=>value===null?"Liên hệ báo giá":new Intl.NumberFormat("vi-VN").format(value)+" ₫";
 function open(target){
  if(!target||target===active)return;
  if(!active){returnFocus=document.activeElement;oldOverflow=document.body.style.overflow;}
  else active.close();
  active=target;target.showModal();document.body.style.overflow="hidden";
  document.body.classList.toggle("consultation-is-open",target===dialog);
 }
 for(const item of document.querySelectorAll("dialog")){
  item.addEventListener("close",()=>{
   if(item!==active||item.open)return;
   active=null;document.body.style.overflow=oldOverflow;
   document.body.classList.remove("consultation-is-open");
   returnFocus?.focus({preventScroll:true});
  });
 }
 function selectionText(){
  const selected=selections.get(form),service=catalog.get(form.elements.product.value);
  byId("pc-selection").textContent=selected?service.name+" — "+selected.name+" — "+money(selected.price):service?.name||"";
 }
 function consult(serviceId,plan){
  form.elements.product.value=serviceId||"";
  if(plan)selections.set(form,plan);else selections.delete(form);
  selectionText();byId("pc-status").textContent="";open(dialog);
 }
 for(const current of [form,inline]){
  current.elements.product.addEventListener("change",()=>{selections.delete(current);if(current===form)selectionText();});
 }
 const requested=new URLSearchParams(location.search),serviceId=requested.get("san-pham"),requestedPlan=prices.get(serviceId+":"+requested.get("goi"));
 if(catalog.has(serviceId)){inline.elements.product.value=serviceId;if(requestedPlan)selections.set(inline,requestedPlan);}
 const priceDialogs={ca:"ca-prices",contract:"vc-prices",invoice:"invoice-prices",ftth:"net-prices"};
 document.addEventListener("click",event=>{
  const target=event.target.closest("[data-close],[data-open-consult],[data-open-price],[data-plan-id],[data-open-qr]");
  if(!target)return;
  event.preventDefault();
  if("close" in target.dataset)active?.close();
  else if("openQr" in target.dataset)open(byId("tammi"));
  else if("openConsult" in target.dataset)consult();
  else if(target.dataset.openPrice)open(byId(priceDialogs[target.dataset.openPrice]));
  else {
   const plan=prices.get(target.dataset.planOwner+":"+target.dataset.planId);
   if(plan)consult(target.closest("#ca-prices")?"ca":plan.serviceId,plan);
  }
 });
 for(const button of document.querySelectorAll("[data-ca-tab]")){
  button.onclick=()=>{
   const choice=button.dataset.caTab,combo=choice==="combo";
   document.querySelectorAll("[data-ca-tab]").forEach(tab=>tab.setAttribute("aria-selected",String(tab===button)));
   byId("ca-usb").hidden=combo;byId("ca-combo").hidden=!combo;
   if(!combo)byId("ca-usb").querySelectorAll("article").forEach(card=>card.hidden=card.dataset.caAudience!==choice);
  };
 }
 for(const kind of ["hsm","mobile"]){
  for(const button of document.querySelectorAll("[data-ca-"+kind+"]")){
   button.onclick=()=>{
    const selected=button.getAttribute("data-ca-"+kind);
    document.querySelectorAll("[data-ca-"+kind+"]").forEach(tab=>tab.setAttribute("aria-pressed",String(tab===button)));
    byId("ca-"+kind).querySelectorAll("article").forEach(card=>card.hidden=card.dataset.caAudience!==selected);
   };
  }
 }
 for(const button of document.querySelectorAll("[data-price-tab]")){
  button.onclick=()=>{
   const choice=button.dataset.priceTab;
   document.querySelectorAll("[data-price-tab]").forEach(tab=>tab.setAttribute("aria-selected",String(tab===button)));
   byId("price-single").hidden=choice!=="single";byId("price-combo").hidden=choice!=="combo";
  };
 }
 const slides=[...document.querySelectorAll(".business-slide")],dots=[...document.querySelectorAll("[data-business-slide]")];
 if(slides.length>1){
  let index=0,paused=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pause=document.querySelector(".business-slider-pause");
  function show(next){
   index=next;
   slides.forEach((slide,i)=>{slide.classList.toggle("is-active",i===index);slide.setAttribute("aria-hidden",String(i!==index));});
   dots.forEach((dot,i)=>dot.setAttribute("aria-pressed",String(i===index)));
  }
  function feedback(){pause.textContent=paused?"▶":"Ⅱ";pause.setAttribute("aria-label",paused?"Tiếp tục chuyển ảnh":"Tạm dừng chuyển ảnh");}
  dots.forEach((dot,i)=>dot.onclick=()=>show(i));
  pause.onclick=()=>{paused=!paused;feedback();};
  feedback();
  setInterval(()=>{if(!paused&&!document.hidden)show((index+1)%slides.length);},5000);
 }
 const videoData=config.videos,player=byId("solution-video-player");
 if(player){
  const buttons=[...document.querySelectorAll("[data-solution-video]")];
  let current=0,locked=false;
  const lock=()=>{locked=true;};
  function show(index){
   const video=videoData[index];
   current=index;player.querySelector("video")?.pause();
   byId("solution-video-title").textContent=video.name||video.title;
   byId("solution-video-description").textContent=video.description;
   player.replaceChildren();
   if(video.kind==="mp4"){
    const element=document.createElement("video");
    element.src=video.url;element.controls=true;element.playsInline=true;element.preload="metadata";
    element.setAttribute("aria-label",video.title);element.addEventListener("play",lock);element.addEventListener("ended",lock);
    player.append(element);
   }else{
    const element=document.createElement("iframe"),url=new URL(video.embed);
    url.searchParams.set("enablejsapi","1");url.searchParams.set("origin",location.origin);
    element.src=url.href;element.title=video.title;element.loading="lazy";
    element.allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    element.allowFullscreen=true;element.referrerPolicy="strict-origin-when-cross-origin";
    element.addEventListener("load",()=>{
     for(const message of [{event:"listening",id:"cuong-video"},{event:"command",func:"addEventListener",args:["onStateChange"]}])
      element.contentWindow?.postMessage(JSON.stringify(message),"https://www.youtube.com");
    });
    player.append(element);
   }
   const link=byId("solution-video-youtube");
   link.href=video.url;link.textContent=video.kind==="mp4"?"Mở video trong cửa sổ mới ↗":"Xem trên YouTube ↗";
   buttons.forEach((button,i)=>button.setAttribute("aria-pressed",String(i===index)));
  }
  buttons.forEach((button,i)=>button.onclick=()=>{lock();show(i);});
  player.addEventListener("pointerdown",lock);player.addEventListener("keydown",lock);
  window.addEventListener("blur",()=>{if(player.contains(document.activeElement))lock();});
  window.addEventListener("message",event=>{
   const frame=player.querySelector("iframe");
   if(event.origin!=="https://www.youtube.com"||!frame||event.source!==frame.contentWindow)return;
   let data;try{data=typeof event.data==="string"?JSON.parse(event.data):event.data;}catch{return;}
   if(data?.event==="onStateChange"&&[0,1,2,3].includes(data.info))lock();
   if(data?.event==="infoDelivery"&&[0,1,2,3].includes(data.info?.playerState))lock();
  });
  document.querySelector(".solution-video-consult").onclick=()=>consult(videoData[current].service);
  show(0);
  setInterval(()=>{if(!locked&&!document.hidden)show((current+1)%videoData.length);},5000);
 }
 for(const current of [form,inline]){
  current.addEventListener("submit",async event=>{
   event.preventDefault();
   const submit=current.querySelector("[type=submit]");
   if(submit.disabled)return;
   const values=new FormData(current),id=values.get("product"),plan=selections.get(current);
   if(!catalog.has(id))return;
   const products=[id];
   if(plan&&!products.includes(plan.serviceId))products.push(plan.serviceId);
   if(plan?.combo&&catalog.has("ca")&&!products.includes("ca"))products.push("ca");
   const payload={
    name:values.get("name"),phone:values.get("phone"),email:values.get("email")||"",products,consent:values.has("consent"),
    company:"",needs:"",website:values.get("website")||"",quotes:plan?[{serviceId:plan.serviceId,planId:plan.id}]:[]
   };
   const signature=JSON.stringify(payload),last=requests.get(current);
   const requestId=last?.signature===signature?last.requestId:crypto.randomUUID();
   requests.set(current,{signature,requestId});
   const status=current.querySelector("[role=status]");
   status.textContent="Đang gửi đăng ký…";submit.disabled=true;
   try{
    const response=await fetch("/api/consult",{
     method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,requestId}),signal:AbortSignal.timeout(20000)
    });
    const result=await response.json();
    if(!response.ok)throw Error(result.error||"Chưa thể ghi nhận yêu cầu.");
    byId("summary").textContent=["Mã đăng ký: "+result.id,"Họ tên: "+payload.name,"Sản phẩm: "+result.products.join(", ")].join("\n");
    byId("emailStatus").textContent=payload.email?"Yêu cầu đã được lưu. Hệ thống sẽ gửi email xác nhận.":"Yêu cầu đã được lưu. Chuyên viên sẽ liên hệ theo số điện thoại bạn cung cấp.";
    open(byId("success"));current.reset();selections.delete(current);requests.delete(current);
    status.textContent="Đã tiếp nhận yêu cầu.";
   }catch(error){
    status.textContent=error.name==="TimeoutError"?"Kết nối quá lâu. Bạn có thể thử gửi lại.":error.message;
   }finally{submit.disabled=false;}
  });
 }
 const home=document.querySelector(".navigation-return-home");
 home.onclick=()=>{
  active?.close();home.hidden=true;
  if(location.hash)history.replaceState(null,"",location.pathname+location.search);
  window.scrollTo({top:0,behavior:"smooth"});
 };
 document.querySelectorAll(".top-nav-button[href]").forEach(link=>link.addEventListener("click",()=>{home.hidden=false;}));
})();
