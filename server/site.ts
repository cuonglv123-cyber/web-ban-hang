import {readFile} from "node:fs/promises";
import {load} from "cheerio";
import type {AnyNode} from "domhandler";
import {catalogUrl,defaults,isPriceService,plansFor,priceText,services,videoSource,type Plan,type SiteContent,type CatalogItem} from "../lib/site-data";
import {readContent} from "./db";
type Document=ReturnType<typeof load>;
let template:Promise<string>|undefined;
function applyCopy($:Document,data:SiteContent) {
 const copy=data.pageContent.index;
 const value=(path:string)=>{const [part,key]=path.split("/");return copy[part]?.[key];};
 function walk(nodes:AnyNode[]){
  for(const node of nodes){
   if(node.type==="comment"&&node.data.startsWith("cuong-copy:")&&node.next?.type==="text"){
    const text=value(node.data.slice(11));
    if(text!==undefined&&node.next.data.replace(/\s+/g," ").trim()!==text)node.next.data=(node.next.data.match(/^\s*/)?.[0]??"")+text+(node.next.data.match(/\s*$/)?.[0]??"");
   }
   if("children" in node)walk(node.children);
  }
 }
 walk($("body").contents().get());
 $("[data-cuong-placeholder]").each((_,node)=>{
  const element=$(node),text=value(element.attr("data-cuong-placeholder")!);
  if(text!==undefined)element.attr("placeholder",text);
 });
}
function applyContact($:Document,data:SiteContent){
 const info=data.contact,tel=info.hotline.replace(/[^\d+]/g,"");
 const replace=(text:string)=>text
   .replace(/Lê Văn Cường|LÊ VĂN CƯỜNG/g,match=>match===match.toUpperCase()?info.name.toUpperCase():info.name)
   .replace(/0967[ .]?87[ .]?79[ .]?79/g,()=>info.hotline)
   .replace(/Chuyên viên giải pháp doanh nghiệp số|Chuyên Viên Giải Pháp Doanh Nghiệp Số/gi,match=>info.role===defaults.contact.role?match:info.role);
 function walk(nodes:AnyNode[]){
  for(const node of nodes){
   if(node.type==="text")node.data=replace(node.data);
   else if(node.type!=="style"&&node.type!=="script"&&"children" in node)walk(node.children);
  }
 }
 walk($("body").contents().get());
 $("a[href^='tel:']").attr("href","tel:"+tel).each((_,node)=>{
  if($(node).attr("aria-label"))$(node).attr("aria-label",replace($(node).attr("aria-label")!));
 });
 $(".hero-portrait").attr({src:info.portrait,alt:info.name+" tại văn phòng Viettel"});
 $(".tammi-brand-qr img").attr({src:info.qr,alt:"Mã QR TAMMI của "+info.name}).removeAttr("width height");
 $(".footer-address").text("Địa chỉ: "+info.address);
 const email=$(".footer-details a[href^='mailto:']");
 if(info.publicEmail)email.attr("href","mailto:"+info.publicEmail).text(info.publicEmail);
 else email.parent().remove();
}

function comboGroups($:Document,container:string,items:Plan[]){
 const root=$(container);
 for(const group of ["new","renew"]){
  const entries=items.filter(plan=>"group" in plan&&plan.group===group);
  if(!entries.length)continue;
  const section=$("<section class='combo-group'>").append($("<h3>").text(group==="new"?"ĐĂNG KÝ MỚI":"GIA HẠN"));
  const years=[...new Set(entries.map(plan=>plan.years))];
  for(const year of years){
   const details=$("<details>");
   const action=group==="new"?"CẤP MỚI":"GIA HẠN";
   const duration=year===null?"THEO GÓI":year+" NĂM";
   details.append($("<summary>").text("GÓI COMBO "+action+" CA "+duration+" VÀ HÓA ĐƠN ĐIỆN TỬ"));
   const table=$("<table>").append("<thead><tr><th>TÊN GÓI</th><th>ĐƠN GIÁ</th><th>ĐĂNG KÝ</th></tr></thead>");
   const body=$("<tbody>");
   for(const plan of entries.filter(plan=>plan.years===year)){
    const title=plan.quantity===null?plan.name:"Combo "+plan.quantity+" hóa đơn "+(group==="new"?"đăng ký":"gia hạn");
    const name=$("<td>").text(title);
    if(plan.discount!==null)name.append("<br>",$("<span class='price-discount'>").text("-"+plan.discount+"%"));
    const price=$("<td>");
    if(plan.old!==null)price.append($("<del>").text(priceText(plan.old)));
    price.append($("<strong>").text(priceText(plan.price)));
    if(plan.vatNote&&plan.vatNote!=="Đã bao gồm VAT")price.append($("<small>").text(plan.vatNote));
    body.append($("<tr>").append(name,price,$("<td>").append(planButton($,"invoice",plan))));
   }
   details.append($("<div class='combo-table-wrap'>").append(table.append(body)));
   section.append(details);
  }
  root.append(section);
 }
}
function planButton($:Document,service:string,plan:Plan){
 return $("<button type='button' class='price-register'>").attr({"data-plan-owner":service,"data-plan-id":plan.id}).text("Đăng ký ngay");
}
function pricing($:Document,data:SiteContent,visible:Set<string>){
 const ca=visible.has("ca")?data.prices.ca.filter(plan=>plan.enabled):[];
 for(const method of ["usb","hsm","mobile"])for(const audience of ["org","person"]){
  const target=$("#ca-"+method);
  for(const plan of ca.filter(row=>row.group===method+"-"+audience)){
   const card=$("<article class='price-package'>").attr("data-ca-audience",audience).prop("hidden",audience!=="org");
   card.append($("<h3>").text(plan.name),$("<div class='price-amount'>").text(priceText(plan.price)));
   if(plan.details[0])card.append($("<p>").text(plan.details[0]));
   const list=$("<ul>");
   plan.details.slice(1).filter(Boolean).forEach(text=>list.append($("<li>").text(text)));
   if(!plan.details.length&&plan.term)list.append($("<li>").text("Thời gian sử dụng: "+plan.term));
   card.append(list,planButton($,"ca",plan));
   target.append(card);
  }
 }
 const invoices=visible.has("invoice")?data.prices.invoice.filter(plan=>plan.enabled):[];
 for(const plan of invoices.filter(row=>row.group==="single")){
  const card=$("<article class='price-package'>").append($("<h3>").text(plan.name),$("<div class='price-amount'>").text(priceText(plan.price)));
  const descriptions=$("<p>").text(plan.details.filter(Boolean).join(" · ")||(plan.quantity===null?"":("Gói "+plan.quantity+" hóa đơn điện tử")));
  card.append(descriptions);
  if(plan.vatNote)card.append($("<small>").text(plan.vatNote));
  card.append(planButton($,"invoice",plan));
  $("#price-single").append(card);
 }
 comboGroups($,"#price-combo",invoices);
 if(visible.has("ca"))comboGroups($,"#ca-combo-content",invoices);
 for(const plan of visible.has("contract")?data.prices.contract.filter(row=>row.enabled):[]){
  const card=$("<article class='vc-package'>").append($("<h3>").text(plan.name),$("<p class='vc-description'>").text(plan.description));
  const lines=$("<div class='vc-lines'>");
  if(plan.quantity!==null)lines.append($("<div>").append($("<span>").text("Số lượng HĐ"),$("<b>").text(plan.quantity.toLocaleString("vi-VN"))));
  const feeLines=plan.details.filter(text=>!text.startsWith("Số lượng HĐ"));
  feeLines.forEach(text=>{
   const match=text.match(/^(Phí gói|Phí chứng thực|Phí khởi tạo)(.+)$/);
   lines.append($("<div>").append($("<span>").text(match?.[1]??text),match?$("<b>").text(match[2]):""));
  });
  card.append(lines,$("<div class='vc-price'>").append("Giá bán",$("<small>").text(plan.vatNote),$("<strong>").text(priceText(plan.price))),
    $("<div class='vc-actions'>").append(planButton($,"contract",plan)),$("<p class='vc-note'>").text(plan.footnote));
  $("#vc-grid").append(card);
 }
 for(const [group,title] of [["static","Nhóm IP tĩnh / chuyên dụng"],["dynamic","Nhóm IP động / Mesh"]]){
  const rows=visible.has("ftth")?data.prices.ftth.filter(plan=>plan.enabled&&plan.group===group):[];
  if(!rows.length)continue;
  const table=$("<table class='net-price-table'>").append("<thead><tr><th>Gói</th><th>Trong nước<br>tối đa (Mbps)</th><th>Quốc tế<br>tối thiểu (Mbps)</th><th>IP / Mesh</th><th>Giá cước</th><th>Đăng ký</th></tr></thead>");
  const body=$("<tbody>");
  for(const plan of rows){
   const name=planButton($,"ftth",plan).removeClass("price-register").addClass("net-plan-link").text(plan.name);
   const price=name.clone().text(priceText(plan.price));
   body.append($("<tr>").append($("<td>").append(name),$("<td>").text(String(plan.domestic??"—")),$("<td>").text(String(plan.international??"—")),
    $("<td>").text(plan.option),$("<td>").append(price),$("<td>").append(planButton($,"ftth",plan))));
  }
  $("#net-price-groups").append($("<section>").append($("<h3>").text(title),$("<div class='net-table-wrap'>").append(table.append(body))));
 }
}

function home($:Document,data:SiteContent){
 applyCopy($,data);
 applyContact($,data);
 const catalog=data.serviceCatalog.filter(item=>item.enabled);
 const originals=$("#cards > .uniform-product-card").toArray().map(node=>$(node).clone());
 const originalIds=["ca","contract","invoice","ftth"];
 const host=$("#cards").empty();
 for(const item of catalog){
  const index=originalIds.indexOf(item.id),card=(originals[index]??originals[0]).clone();
  card.attr({id:"service-"+item.id,"data-service-id":item.id});
  card.find(".uniform-product-picture img").attr({src:item.image,alt:item.name});
  if(!item.image)card.find(".uniform-product-picture").remove();
  card.find("h3").text(item.detailTitle||item.name);
  card.find(".uniform-product-subtitle").text(item.category);
  card.find(".uniform-product-description").text(item.description);
  const button=card.find(".uniform-detail-button");
  if(isPriceService(item.id))button.attr({"data-open-price":item.id,"aria-label":"Xem chi tiết "+item.name});
  else button.replaceWith($("<a class='uniform-detail-button'>").attr("href",catalogUrl(item)).text("Xem chi tiết"));
  host.append(card);
 }
 const visible=new Set(catalog.map(row=>row.id));
 const intro=$(".intro-services"),source=intro.find(".intro-service").toArray().map(n=>$(n).clone());
 const order=["ca","invoice","contract","ftth"];
 intro.empty().attr("aria-label","Các giải pháp Viettel");
 for(const item of catalog){
  const element=(source[order.indexOf(item.id)]??source[0]).clone();
  element.find("span").text(item.name);
  intro.append(element);
 }
 const slides=data.slides.filter(item=>item.enabled);
 const slideSource=$(".business-slide").first().clone();
 $(".business-slide").remove();
 const dots=$(".business-slider-dots").empty();
 slides.forEach((item,index)=>{
  const image=slideSource.clone().attr({src:item.image,alt:item.title,"aria-hidden":String(index!==0)}).toggleClass("is-active",index===0);
  dots.before(image);
  dots.append($("<button type='button'>").attr({"aria-label":"Xem ảnh "+(index+1),"aria-pressed":String(index===0),"data-business-slide":String(index)}));
 });
 if(!slides.length)$("#journey").remove();
 if(slides.length<2)$(".business-slider-dots,.business-slider-pause").prop("hidden",true);
 pricing($,data,visible);
 const options=catalog.map(({id,name})=>({id,name}));
 $("form").each((_,element)=>{$(element).append("<input class='cuong-honeypot' name='website' tabindex='-1' autocomplete='off' aria-hidden='true'>");});
 $("#pc-status,#inline-pc-status").attr("role","status");
 for(const item of options)$("select[name=product]").append($("<option>").val(item.id).text(item.name));
 const videos=data.videos.filter(item=>item.enabled&&(!item.service||visible.has(item.service))).flatMap(item=>{
  const source=videoSource(item.link);
  return source?[{...item,...source}]:[];
 });
 const videoButtons=$("[data-solution-video]").toArray().map(node=>$(node).clone());
 const videoHost=$(".solution-video-options").empty();
 videos.forEach((item,index)=>{
  const originalIndex=data.videos.findIndex(row=>row.id===item.id),button=(videoButtons[originalIndex]??videoButtons[0]).clone();
  button.attr({"data-solution-video":String(index),"aria-pressed":String(index===0)});
  button.find("span").text(String(index+1).padStart(2,"0")+". "+item.title);
  if(originalIndex<0)button.find("b").text(item.name);
  videoHost.append(button);
 });
 if(!videos.length)$("#solution-videos,a[href='#solution-videos']").remove();
 $(".top-consult-position button.top-nav-button").attr("data-open-consult","");
 $("a[href^='https://zalo.me']").attr({href:"#tammi","data-open-qr":""}).removeAttr("target rel");
 $(".tammi-brand-qr img").wrap($("<button type='button' class='cuong-qr-trigger' data-open-qr aria-label='Mở mã QR TAMMI'>"));
 const qr=$("<dialog class='cuong-qr' id='tammi' aria-labelledby='tammi-title'>").append(
   $("<button class='pc-close' type='button' data-close aria-label='Đóng mã QR TAMMI'>").text("×"),
   $("<h2 id='tammi-title'>").text("Kết nối TAMMI với "+data.contact.name),
   $("<p>").text("Mở ứng dụng Viettel TAMMI, chọn Quét mã QR rồi quét mã bên dưới để kết nối."),
   $("<img>").attr({src:data.contact.qr,alt:"Mã QR TAMMI của "+data.contact.name}),
   $("<a class='btn' download>").attr("href",data.contact.qr.startsWith("/")?data.contact.qr:data.contact.qr+"?download=1").text("Tải ảnh mã QR")
 );
 $("#success p").not("#summary,#emailStatus").text("Thông tin yêu cầu của bạn đã được ghi nhận.");
 $("#success button,.pc-close,#net-price-close,#vc-price-close,#ca-price-close,#price-close").attr("data-close","");
 const plans=catalog.flatMap(item=>plansFor(data,item.id).filter(plan=>plan.enabled).map(plan=>({
  id:plan.id,serviceId:item.id,name:plan.name,price:plan.price,term:plan.term,
  combo:item.id==="invoice"&&"group" in plan&&plan.group!=="single"
 })));
 $("body").append(qr,$("<script id='cuong-config' type='application/json'>").text(JSON.stringify({options,videos,plans}).replace(/</g,"\\u003c")),
  $("<script src='/cuong-site.js' defer>"),$("<link rel='stylesheet' href='/cuong-site.css'>"));
}

function detail($:Document,item:CatalogItem,data:SiteContent){
 $("title").text(item.detailTitle||item.name);
 $("body").empty().append($("<link rel='stylesheet' href='/cuong-site.css'>"));
 const url="/?san-pham="+encodeURIComponent(item.id);
 const main=$("<main class='cuong-detail'>").append($("<a href='/#solutions'>").text("← Xem các dịch vụ"),
  $("<h1>").text(item.detailTitle||item.name),$("<p>").text(item.detailIntro||item.description),
  $("<a class='btn'>").attr("href",url+"#register").text("Nhận tư vấn"));
 if(item.image)main.append($("<img>").attr({src:item.image,alt:item.name}));
 if(item.points.some(Boolean)){
  const points=$("<ul>");item.points.filter(Boolean).forEach(text=>points.append($("<li>").text(text)));main.append(points);
 }
 if(item.detailContent)main.append($("<p class='cuong-detail-copy'>").text(item.detailContent));
 if(item.official)main.append($("<a target='_blank' rel='noopener'>").attr("href",item.official).text("Website Viettel"));
 const plans=plansFor(data,item.id).filter(row=>row.enabled);
 if(plans.length){
  main.append($("<h2>").text("Báo giá"));
  const list=$("<div class='cuong-detail-plans'>");
  plans.forEach(plan=>list.append($("<article>").append($("<h3>").text(plan.name),$("<p>").text([priceText(plan.price),plan.term,plan.vatNote].filter(Boolean).join(" · ")),
   $("<p class='cuong-detail-copy'>").text(plan.details.join("\n")),$("<a class='btn'>").attr("href",url+"&goi="+encodeURIComponent(plan.id)+"#register").text("Chọn gói"))));
  main.append(list);
 }
 main.append($("<p>").append($("<a>").attr("href","tel:"+data.contact.hotline.replace(/[^\d+]/g,"")).text(data.contact.name+" · "+data.contact.hotline)));
 $("body").append(main);
}
export async function renderSite(slug?:string){
 let data=defaults;
 try{({data}=await readContent());}
 catch(error){console.error("Cường public content",(error as {code?:string})?.code??"unavailable");}
 const custom=slug&&data.serviceCatalog.find(item=>item.enabled&&!isPriceService(item.id)&&item.slug===slug);
 if(slug&&!custom)return new Response("Dịch vụ không còn hiển thị.",{status:404,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}});
 template??=readFile(process.cwd()+"/source/index.html","utf8");
 const $=load(await template);
 if(custom)detail($,custom,data);else home($,data);
 return new Response($.html(),{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","X-Frame-Options":"SAMEORIGIN"}});
}
