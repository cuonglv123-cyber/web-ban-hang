import { groups, services, type Service } from "./site-data";
type Option = readonly [string,string];
export type Field = {key:string;label:string;kind?:"text"|"area"|"lines"|"number"|"check"|"select"|"image";options?:readonly Option[];optional?:boolean;nullable?:boolean};
const field=(key:string,label:string,kind?:Field["kind"]):Field=>({key,label,kind});
const image=(key:string,label:string)=>field(key,label,"image");
const number=(key:string,label:string):Field=>({...field(key,label,"number"),nullable:true});
export const contactFields=[
  field("name","Tên chuyên viên"),field("role","Chức danh"),field("hotline","Hotline"),field("address","Địa chỉ"),
  {...field("publicEmail","Email công khai"),optional:true},{...field("email","Email nhận tư vấn"),optional:true},
  image("portrait","Ảnh đại diện"),image("qr","Ảnh QR TAMMI")
];
export const catalogFields=[
  field("name","Tên dịch vụ"),field("slug","Đường dẫn trang (để trống để tự tạo)"),field("category","Nhãn trên thẻ"),
  field("detailTitle","Tiêu đề trên thẻ và trang chi tiết"),field("description","Giới thiệu ngắn","area"),
  field("points","Lợi ích (mỗi dòng một mục)","lines"),{...image("image","Ảnh dịch vụ"),optional:true},
  field("detailIntro","Đoạn mở đầu trang chi tiết","area"),field("detailContent","Nội dung trang chi tiết","area"),field("official","Link Viettel")
];
export const customPlanFields=[
  field("name","Tên gói"),number("price","Giá (đ)"),field("vatNote","Ghi chú thuế"),field("term","Thời hạn"),
  field("details","Chi tiết (mỗi dòng một mục)","lines")
];
export const priceFields=Object.fromEntries(services.map(id=>[id,[
  ...customPlanFields,
  {...field("group","Nhóm báo giá","select"),options:Object.entries(groups[id])},
  ...(id==="invoice"?[number("old","Giá cũ (đ)"),number("discount","Giảm giá (%)")]:[]),
  ...(id==="ca"?[{...field("registration","Đăng ký","select"),options:[["new","Cấp mới"],["renew","Gia hạn"]]}]:[]),
  ...(id==="invoice"?[number("quantity","Số hóa đơn"),number("years","Số năm CA trong combo")]:[]),
  ...(id==="contract"?[number("quantity","Số hợp đồng"),field("description","Mô tả gói","area"),field("footnote","Ghi chú đăng ký kèm","area")]:[]),
  ...(id==="ftth"?[number("domestic","Trong nước tối đa (Mbps)"),number("international","Quốc tế tối thiểu (Mbps)"),field("option","Loại IP hoặc số bộ Mesh")]:[])
]])) as Record<Service,Field[]>;
export const listFields={
  slides:[field("title","Mô tả ảnh"),image("image","Ảnh trình chiếu")],
  videos:[field("title","Tiêu đề danh sách"),field("name","Tiêu đề phát video"),field("description","Mô tả","area"),
    field("link","Link hoặc ID YouTube, playlist, MP4"),field("service","Dịch vụ","select")]
};
