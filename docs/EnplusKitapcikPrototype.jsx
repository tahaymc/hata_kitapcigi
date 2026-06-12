import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search, Command, Star, X, Copy, Check, Sun, Moon, Eye, Calendar, Clock,
  TrendingUp, CornerDownLeft, ArrowUp, ArrowDown, BookOpen, Pin, LayoutGrid,
  Sparkles, FileText, AlertCircle, ChevronRight, ChevronLeft, ChevronDown,
  Monitor, Smartphone, Printer, Wifi, ScanLine, Image as ImageIcon, ZoomIn,
  Cpu, Calculator, Users, Truck, Store, Receipt, Landmark, Banknote,
  CalendarDays, Wallet, Boxes, RotateCcw, Tag, ShoppingCart, Wrench, ClipboardList
} from "lucide-react";

/* =========================================================================
   ENPLUS Çözüm Kitapçığı — Departman bazlı yapı + Trendyol tarzı üst mega-menü
   Ana kategori = Departman · alt kategoriler = onun konuları
   ========================================================================= */

const THEME = {
  light: { paper:"#F6F8FB", surface:"#FFFFFF", surface2:"#EEF2F8", ink:"#0B1220",
    inkSoft:"#475569", inkFaint:"#94A3B8", line:"#E6EBF2", accent:"#2563EB",
    accent2:"#0EA5E9", accentSoft:"#EFF4FF", ok:"#16A34A",
    shadow:"rgba(15,23,42,0.07)", shadowLg:"rgba(15,23,42,0.13)", glow:"rgba(37,99,235,0.10)" },
  dark: { paper:"#0A0F1C", surface:"#131A2A", surface2:"#1B2436", ink:"#F1F5F9",
    inkSoft:"#94A3B8", inkFaint:"#64748B", line:"#233047", accent:"#3B82F6",
    accent2:"#38BDF8", accentSoft:"#14213B", ok:"#4ADE80",
    shadow:"rgba(0,0,0,0.40)", shadowLg:"rgba(0,0,0,0.60)", glow:"rgba(59,130,246,0.16)" },
};

// ===== Departman > Alt kategori ağacı =====
const DEPARTMENTS = [
  { id:"bi", name:"Bilgi İşlem", icon:Cpu, hue:215, subs:[
    { id:"hitit",   name:"Hitit",        icon:Monitor,    hue:28  },
    { id:"omni",    name:"Omni Channel", icon:ScanLine,   hue:152 },
    { id:"mdi",     name:"MDI",          icon:Smartphone, hue:350 },
    { id:"donanim", name:"Donanım",      icon:Printer,    hue:199 },
    { id:"wifi",    name:"Wi-Fi",        icon:Wifi,       hue:262 },
  ]},
  { id:"muh", name:"Muhasebe", icon:Calculator, hue:160, subs:[
    { id:"fatura", name:"Fatura",        icon:Receipt,   hue:160 },
    { id:"cari",   name:"Cari Hesap",    icon:Landmark,  hue:175 },
    { id:"banka",  name:"Banka / Tahsilat", icon:Banknote, hue:145 },
  ]},
  { id:"ik", name:"İnsan Kaynakları", icon:Users, hue:280, subs:[
    { id:"izin",   name:"İzin",   icon:CalendarDays, hue:280 },
    { id:"bordro", name:"Bordro", icon:Wallet,       hue:295 },
    { id:"ozluk",  name:"Özlük",  icon:FileText,     hue:265 },
  ]},
  { id:"loj", name:"Lojistik / Sevkiyat", icon:Truck, hue:35, subs:[
    { id:"sevkiyat", name:"Sevkiyat", icon:Truck,    hue:35 },
    { id:"depo",     name:"Depo",     icon:Boxes,    hue:45 },
    { id:"iade",     name:"İade",     icon:RotateCcw,hue:20 },
  ]},
  { id:"sat", name:"Satış / Mağaza", icon:Store, hue:330, subs:[
    { id:"kampanya", name:"Kampanya", icon:Tag,          hue:330 },
    { id:"kasa",     name:"Kasa",     icon:ShoppingCart, hue:345 },
  ]},
];
const SUBS = DEPARTMENTS.flatMap(d => d.subs.map(s => ({ ...s, dept:d.id })));
const subOf  = (id) => SUBS.find(s => s.id === id) || SUBS[0];
const deptOf = (id) => DEPARTMENTS.find(d => d.id === id) || DEPARTMENTS[0];
function deptCol(deptId, dark) { const h = deptOf(deptId).hue; return {
  c:`hsl(${h} 70% ${dark?64:48}%)`, soft:`hsl(${h} ${dark?42:90}% ${dark?16:95}%)`, line:`hsl(${h} ${dark?45:70}% ${dark?30:80}%)` }; }

function makePhoto(label, hue) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='720' height='460'>
  <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue},32%,26%)'/><stop offset='1' stop-color='hsl(${hue},38%,13%)'/></linearGradient></defs>
  <rect width='720' height='460' fill='url(#g)'/>
  <rect x='250' y='130' width='220' height='160' rx='16' fill='none' stroke='hsl(${hue},55%,62%)' stroke-width='3'/>
  <circle cx='360' cy='200' r='30' fill='none' stroke='hsl(${hue},55%,62%)' stroke-width='3'/>
  <circle cx='415' cy='160' r='7' fill='hsl(${hue},55%,62%)'/>
  <text x='360' y='350' fill='hsl(${hue},30%,76%)' font-family='Inter,system-ui,sans-serif' font-size='24' font-weight='700' text-anchor='middle'>${label}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const fmtDate = (d) => { const x = new Date(d); return `${x.getDate()} ${AYLAR[x.getMonth()]} ${x.getFullYear()}`; };
const stepText = (s) => typeof s === "string" ? s : s.text;
const stepPhotos = (s) => typeof s === "string" ? [] : (s.photos || []);

// ===== Örnek veri (cat = alt kategori id, dept = departman id) =====
const ERRORS = [
  { id:1, code:"DONDU", dept:"bi", cat:"hitit", title:"Hitit Programı Yanıt Vermiyor", views:33, date:"2026-01-14",
    summary:"Ekranda tıkladığınız yerler çalışmıyor, fare imleci dönüp duruyor veya ekran beyazlaşıyorsa program kilitlenmiş demektir.", images:["Program ekranı"],
    steps:[ { text:"Görev Yöneticisi'ni açın (Ctrl+Shift+Esc).", photos:["Görev yöneticisi"] }, "Listeden Hitit uygulamasını seçin.", { text:"'Görevi sonlandır' deyip kapatın.", photos:["Görevi sonlandır","Onay penceresi"] }, "Programı yeniden başlatın." ] },
  { id:2, code:"82517", dept:"bi", cat:"omni", title:"Hatalı Telefon Numarası Girildi", views:13, date:"2026-01-13",
    summary:"Kargo barkodu oluşturulurken sistem telefon numarasını kabul etmedi. Boşluk, parantez veya fazladan rakam olabilir.", images:["El terminali"],
    steps:[ { text:"Müşteri kartından telefon alanını açın.", photos:["Müşteri kartı"] }, "Numarayı 10 hane olacak şekilde düzeltin.", "Barkodu tekrar oluşturun." ] },
  { id:3, code:"STORAGE", dept:"bi", cat:"mdi", title:"Low Storage", views:25, date:"2026-01-13",
    summary:"El terminalinin hafızası dolduğu için yeni işlem yapılamıyor. Chrome çok fazla geçici dosya biriktirdiğinde yaşanır.", images:["Terminal depolama","Chrome ayarları"],
    steps:[ "Ayarlar > Uygulamalar > Chrome'a gidin.", { text:"Depolama > Önbelleği temizle.", photos:["Önbelleği temizle"] }, "Terminali yeniden başlatın." ] },
  { id:4, code:"EXCEPTION", dept:"bi", cat:"mdi", title:"Sunucu Yanıt Vermiyor / Bağlantı Koptu", views:6, date:"2026-01-12",
    summary:"El terminali ana bilgisayara ulaşamadı. %90 ihtimalle Wi-Fi bağlantısı koptu.", images:["Bağlantı hatası"],
    steps:[ { text:"Wi-Fi simgesini kontrol edin.", photos:["Wi-Fi durumu"] }, "Ağa yeniden bağlanın.", "İşlemi tekrar deneyin." ] },
  { id:5, code:"GMP3", dept:"bi", cat:"donanim", title:"POS Cihazı Lisans Uyarısı", views:11, date:"2026-01-12",
    summary:"Yazar kasa POS cihazının yasal kullanım lisansının süresi dolmak üzere. Süre dolunca cihaz kilitlenir.", images:["POS ekranı"],
    steps:[ { text:"Cihaz menüsünden lisans durumunu görüntüleyin.", photos:["Lisans ekranı"] }, "Süre 30 günden azsa Donanım ekibine bildirin." ] },
  { id:6, code:"WIFI-LOW", dept:"bi", cat:"wifi", title:"Terminal Wi-Fi Sinyali Zayıf", views:9, date:"2026-01-11",
    summary:"El terminali sık ağdan düşüyor veya yavaşlıyor. Sinyal seviyesi düşük olabilir.", images:["Sinyal seviyesi"],
    steps:[ { text:"Ağ ayarlarını açın.", photos:["Ağ ayarları"] }, "Sinyal seviyesini kontrol edin." ] },
  // diğer departmanlar (mantığı göstermek için)
  { id:7, code:"MUH-105", dept:"muh", cat:"fatura", title:"e-Fatura Kesilemiyor – GİB Yanıtı Yok", views:18, date:"2026-01-15",
    summary:"Fatura onaylanırken GİB servisinden yanıt alınamadı. Entegratör bağlantısı kontrol edilmeli.", images:["Fatura ekranı"],
    steps:[ { text:"Entegratör servis durumunu kontrol edin.", photos:["Servis durumu"] }, "İmza sertifikası süresini doğrulayın.", "Faturayı tekrar gönderin." ] },
  { id:8, code:"CARI-09", dept:"muh", cat:"cari", title:"Cari Bakiye Tutmuyor", views:7, date:"2026-01-09",
    summary:"Cari hesap ekstresi ile sistem bakiyesi arasında fark var.", images:["Cari ekstre"],
    steps:[ "Açık fatura ve tahsilatları eşleştirin.", { text:"Mahsup fişlerini kontrol edin.", photos:["Mahsup fişi"] } ] },
  { id:9, code:"IK-22", dept:"ik", cat:"izin", title:"İzin Talebi Onaya Düşmüyor", views:12, date:"2026-01-10",
    summary:"Çalışan izin talebi oluşturdu ancak yöneticinin onay kutusuna düşmüyor.", images:["İzin ekranı"],
    steps:[ { text:"Çalışanın bağlı olduğu yöneticiyi kontrol edin.", photos:["Org şeması"] }, "Onay akışı tanımını doğrulayın." ] },
  { id:10, code:"LOJ-07", dept:"loj", cat:"sevkiyat", title:"Sevkiyat Barkodu Okunmuyor", views:5, date:"2026-01-08",
    summary:"El terminali sevkiyat barkodunu okuyamıyor veya 'geçersiz' diyor.", images:["Barkod okuma"],
    steps:[ { text:"Barkodun hasarsız olduğunu kontrol edin.", photos:["Barkod"] }, "Tarayıcı lensini temizleyin." ] },
];
const GUIDES = [
  { id:101, code:"KUR", dept:"bi", cat:"donanim", title:"Yeni POS cihazı kurulum kılavuzu", views:42, date:"2026-01-15",
    summary:"Kutudan çıkarma, kağıt takma, ağ ayarı ve ilk test fişi.", images:["Kurulum"],
    steps:[ { text:"Güç ve ağ kablosunu bağlayın.", photos:["Bağlantılar"] }, "Termal kağıt takın.", "Test fişi yazdırın." ] },
  { id:102, code:"BORDRO", dept:"ik", cat:"bordro", title:"Aylık bordro kapanış kontrol listesi", views:19, date:"2026-01-12",
    summary:"Puantaj, kesinti ve tahakkuk kontrolleri.", images:["Bordro"],
    steps:[ "Puantajı kontrol edin.", { text:"Kesintileri doğrulayın.", photos:["Kesinti tablosu"] }, "Tahakkuku kapatın." ] },
];
const ALL = [...ERRORS.map(e=>({...e,type:"error"})), ...GUIDES.map(g=>({...g,type:"guide"}))];

function highlight(text,q,color){ if(!q) return text; const i=text.toLowerCase().indexOf(q.toLowerCase()); if(i===-1) return text;
  return (<>{text.slice(0,i)}<mark style={{ background:"transparent", color, fontWeight:700 }}>{text.slice(i,i+q.length)}</mark>{text.slice(i+q.length)}</>); }
function useCountUp(target){ const [n,setN]=useState(0); useEffect(()=>{ let raf,start; const dur=900;
  const tick=(ts)=>{ if(!start)start=ts; const p=Math.min((ts-start)/dur,1); setN(Math.round((1-Math.pow(1-p,3))*target)); if(p<1)raf=requestAnimationFrame(tick); };
  raf=requestAnimationFrame(tick); return ()=>cancelAnimationFrame(raf); },[target]); return n; }

export default function App(){
  const [dark,setDark]=useState(true); const t=dark?THEME.dark:THEME.light;
  const [paletteOpen,setPaletteOpen]=useState(false);
  const [pq,setPq]=useState(""); const [pIndex,setPIndex]=useState(0);
  const [activeDept,setActiveDept]=useState(null); const [activeSub,setActiveSub]=useState(null);
  const [tab,setTab]=useState("error");
  const [favs,setFavs]=useState(()=>new Set([2,7]));
  const [popId,setPopId]=useState(null);
  const [selected,setSelected]=useState(null);
  const [checked,setChecked]=useState(()=>new Set());
  const [copied,setCopied]=useState(false);
  const [lightbox,setLightbox]=useState(null);
  const [openDept,setOpenDept]=useState(null);      // mega menü
  const [mobileMenu,setMobileMenu]=useState(false);
  const inputRef=useRef(null); const closeTimer=useRef();

  useEffect(()=>{ const onKey=(e)=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){ e.preventDefault(); setPaletteOpen(o=>!o); }
    if(e.key==="Escape"){ if(lightbox)setLightbox(null); else { setPaletteOpen(false); setSelected(null); setOpenDept(null); } }
    if(lightbox){ if(e.key==="ArrowRight")setLightbox(l=>({...l,index:(l.index+1)%l.photos.length})); if(e.key==="ArrowLeft")setLightbox(l=>({...l,index:(l.index-1+l.photos.length)%l.photos.length})); }
  }; window.addEventListener("keydown",onKey); return ()=>window.removeEventListener("keydown",onKey); },[lightbox]);
  useEffect(()=>{ if(paletteOpen){ setPq(""); setPIndex(0); setTimeout(()=>inputRef.current?.focus(),30); } },[paletteOpen]);

  const paletteResults=useMemo(()=>{ const q=pq.trim().toLowerCase();
    if(!q) return ALL.slice().sort((a,b)=>b.views-a.views).slice(0,6);
    return ALL.filter(i=>i.title.toLowerCase().includes(q)||i.code.toLowerCase().includes(q)||i.summary.toLowerCase().includes(q)).slice(0,8);
  },[pq]);
  const onPaletteKey=(e)=>{ if(e.key==="ArrowDown"){e.preventDefault();setPIndex(i=>Math.min(i+1,paletteResults.length-1));}
    if(e.key==="ArrowUp"){e.preventDefault();setPIndex(i=>Math.max(i-1,0));} if(e.key==="Enter"){const r=paletteResults[pIndex]; if(r)openItem(r);} };
  function openItem(i){ setPaletteOpen(false); setChecked(new Set()); setCopied(false); setSelected(i); }
  function toggleFav(id,e){ e?.stopPropagation(); setPopId(id); setTimeout(()=>setPopId(null),320); setFavs(prev=>{const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n;}); }
  function openLightbox(labels,hue,index=0,e){ e?.stopPropagation(); setLightbox({ photos:labels.map(l=>({label:l,src:makePhoto(l,hue)})), index }); }

  // mega menü hover yönetimi
  const openMenu=(id)=>{ clearTimeout(closeTimer.current); setOpenDept(id); };
  const scheduleClose=()=>{ closeTimer.current=setTimeout(()=>setOpenDept(null),130); };
  const selAll =()=>{ setActiveDept(null); setActiveSub(null); setOpenDept(null); setMobileMenu(false); };
  const selDept=(d)=>{ setActiveDept(d); setActiveSub(null); setOpenDept(null); setMobileMenu(false); };
  const selSub =(d,s)=>{ setActiveDept(d); setActiveSub(s); setOpenDept(null); setMobileMenu(false); };

  const source=tab==="error"?ERRORS:GUIDES;
  const list=source.filter(i=>(!activeDept||i.dept===activeDept)&&(!activeSub||i.cat===activeSub));
  const popular=[...source].sort((a,b)=>b.views-a.views).slice(0,3);
  const recent=[...source].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3);
  const favItems=ALL.filter(i=>favs.has(i.id));
  const deptCount=(d)=>source.filter(i=>i.dept===d).length;
  const subCount=(s)=>source.filter(i=>i.cat===s).length;
  const topItem=[...ALL].sort((a,b)=>b.views-a.views)[0];
  const crumb = activeSub ? `${deptOf(activeDept).name} › ${subOf(activeSub).name}` : (activeDept ? deptOf(activeDept).name : "Tüm kayıtlar");

  return (
    <div style={{ background:t.paper, color:t.ink, minHeight:"100vh", fontFamily:"'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;} .mono{font-family:ui-monospace,'SF Mono',Menlo,monospace;}
        ::selection{background:${t.accent};color:#fff;}
        .lift{transition:transform .2s cubic-bezier(.2,.8,.2,1),box-shadow .25s,border-color .2s;} .lift:hover{transform:translateY(-3px);}
        .fadeup{animation:fadeup .5s cubic-bezier(.2,.8,.2,1) both;} @keyframes fadeup{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
        .menuIn{animation:menuIn .2s cubic-bezier(.2,.8,.2,1) both;} @keyframes menuIn{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:none;}}
        .modalIn{animation:modalIn .3s cubic-bezier(.2,.8,.2,1) both;} @keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(12px);}to{opacity:1;transform:none;}}
        .popfx{animation:popfx .32s cubic-bezier(.2,1.3,.4,1);} @keyframes popfx{0%{transform:scale(1);}40%{transform:scale(1.35);}100%{transform:scale(1);}}
        .shine{position:relative;overflow:hidden;} .shine::after{content:'';position:absolute;inset:0;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.7) 50%,transparent 70%);transform:translateX(-150%);animation:shine 3.2s infinite;} @keyframes shine{to{transform:translateX(150%);}}
        .gradtext{background:linear-gradient(90deg,${t.accent},${t.accent2},${t.accent});background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:gx 7s linear infinite;} @keyframes gx{to{background-position:200% center;}}
        .scroll::-webkit-scrollbar{width:8px;height:8px;} .scroll::-webkit-scrollbar-thumb{background:${t.line};border-radius:8px;}
        .no-sb::-webkit-scrollbar{display:none;} .no-sb{scrollbar-width:none;}
        .thumb img{transition:transform .25s;} .thumb:hover img{transform:scale(1.08);}
      `}</style>

      <div style={{ position:"fixed", top:-160, left:"50%", transform:"translateX(-50%)", width:900, height:360, background:`radial-gradient(closest-side,${t.glow},transparent)`, pointerEvents:"none", zIndex:0 }} />

      {/* HEADER */}
      <header style={{ position:"sticky", top:0, zIndex:45, background:t.paper+"D9", backdropFilter:"blur(14px)", borderBottom:`1px solid ${t.line}` }}>
        <div style={{ maxWidth:1320, margin:"0 auto" }} className="flex items-center gap-4 px-5 py-3.5">
          <div className="flex items-center gap-2.5 select-none">
            <div className="shine flex items-center justify-center" style={{ width:40, height:40, background:`linear-gradient(135deg,${t.accent},${t.accent2})`, color:"#fff", borderRadius:14, boxShadow:`0 8px 22px ${t.accent}55` }}><BookOpen size={20} strokeWidth={2.5} /></div>
            <div className="leading-none">
              <div className="gradtext" style={{ fontWeight:900, letterSpacing:"-0.02em", fontSize:17 }}>ENPLUS Sistem</div>
              <div style={{ fontSize:10, color:t.inkFaint, fontWeight:800, letterSpacing:"0.18em", marginTop:3, textTransform:"uppercase" }}>Çözüm Kitapçığı</div>
            </div>
          </div>
          <button onClick={()=>setPaletteOpen(true)} className="flex items-center gap-3 flex-1 mx-2" style={{ maxWidth:560, height:44, background:t.surface, border:`1px solid ${t.line}`, borderRadius:14, padding:"0 14px", color:t.inkFaint, cursor:"pointer", boxShadow:`0 1px 2px ${t.shadow}` }}>
            <Search size={17} /><span style={{ fontSize:14, color:t.inkSoft }} className="flex-1 text-left">Tüm departmanlarda ara…</span>
            <span className="mono hidden sm:flex items-center gap-1" style={{ fontSize:11, color:t.inkFaint, border:`1px solid ${t.line}`, borderRadius:6, padding:"2px 6px" }}><Command size={11} /> K</span>
          </button>
          <button onClick={()=>setDark(d=>!d)} className="flex items-center justify-center" style={{ width:38, height:38, background:t.surface, border:`1px solid ${t.line}`, borderRadius:12, color:t.inkSoft }}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button>
        </div>

        {/* ===== DEPARTMAN MEGA-MENÜ ÇUBUĞU (Trendyol tarzı) ===== */}
        <div style={{ borderTop:`1px solid ${t.line}`, position:"relative" }} onMouseLeave={scheduleClose} onMouseEnter={()=>clearTimeout(closeTimer.current)}>
          <div style={{ maxWidth:1320, margin:"0 auto" }} className="flex items-center gap-1 px-5">
            <button onClick={selAll} className="flex items-center gap-2" style={{ padding:"12px 12px", fontSize:13.5, fontWeight:700, color:!activeDept?t.accent:t.inkSoft, borderBottom:`2px solid ${!activeDept?t.accent:"transparent"}` }}>
              <LayoutGrid size={15} /> Tümü
            </button>
            {/* masaüstü departmanlar */}
            <div className="hidden md:flex items-center gap-1">
              {DEPARTMENTS.map(d=>{ const dc=deptCol(d.id,dark); const on=activeDept===d.id; const open=openDept===d.id;
                return (
                  <button key={d.id} onMouseEnter={()=>openMenu(d.id)} onClick={()=>open?selDept(d.id):openMenu(d.id)}
                    className="flex items-center gap-2" style={{ padding:"12px 12px", fontSize:13.5, fontWeight:700, color:on||open?dc.c:t.inkSoft, borderBottom:`2px solid ${on?dc.c:"transparent"}` }}>
                    <d.icon size={15} /> {d.name}
                    <ChevronDown size={13} style={{ transition:"transform .2s", transform:open?"rotate(180deg)":"none", opacity:.7 }} />
                  </button>
                );
              })}
            </div>
            {/* mobil aç */}
            <button onClick={()=>setMobileMenu(m=>!m)} className="md:hidden flex items-center gap-2 ml-auto" style={{ padding:"10px 12px", fontSize:13.5, fontWeight:700, color:t.inkSoft }}>
              Departmanlar <ChevronDown size={14} style={{ transform:mobileMenu?"rotate(180deg)":"none", transition:"transform .2s" }} />
            </button>
            {/* sağda çözüm/kılavuz */}
            <div className="hidden md:block ml-auto" style={{ margin:"6px 0" }}>
              <TabSwitch t={t} tab={tab} setTab={setTab} counts={{ error:ERRORS.length, guide:GUIDES.length }} />
            </div>
          </div>

          {/* MEGA PANEL (masaüstü) */}
          {openDept && (
            <div className="hidden md:block menuIn" style={{ position:"absolute", left:0, right:0, top:"100%", zIndex:50 }}>
              <div style={{ maxWidth:1320, margin:"0 auto", padding:"0 20px" }}>
                <div style={{ background:t.surface, border:`1px solid ${t.line}`, borderRadius:16, boxShadow:`0 24px 50px ${t.shadowLg}`, padding:16, marginTop:-1 }}>
                  {(()=>{ const d=deptOf(openDept); const dc=deptCol(openDept,dark); return (
                    <>
                      <button onClick={()=>selDept(d.id)} className="flex items-center gap-2 mb-3" style={{ fontSize:13, fontWeight:800, color:dc.c }}>
                        <d.icon size={16} /> Tüm {d.name} kayıtları <ChevronRight size={15} /><span className="mono" style={{ fontSize:11, color:t.inkFaint }}>({deptCount(d.id)})</span>
                      </button>
                      <div className="grid gap-2" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))" }}>
                        {d.subs.map(s=>{ const k=dc; return (
                          <button key={s.id} onClick={()=>selSub(d.id,s.id)} className="flex items-center gap-3 lift" style={{ padding:"10px 12px", borderRadius:12, border:`1px solid ${t.line}`, background:t.paper, textAlign:"left" }}>
                            <span className="flex items-center justify-center flex-shrink-0" style={{ width:34, height:34, borderRadius:10, background:k.soft, color:k.c }}><s.icon size={17} /></span>
                            <span className="flex-1 min-w-0"><span style={{ display:"block", fontSize:13.5, fontWeight:700 }}>{s.name}</span><span style={{ fontSize:11, color:t.inkFaint }}>{subCount(s.id)} kayıt</span></span>
                          </button>
                        );})}
                      </div>
                    </>
                  );})()}
                </div>
              </div>
            </div>
          )}

          {/* MOBİL akordeon */}
          {mobileMenu && (
            <div className="md:hidden menuIn" style={{ borderTop:`1px solid ${t.line}`, background:t.surface, padding:12 }}>
              <button onClick={selAll} className="flex items-center gap-2 w-full mb-2" style={{ padding:"8px 10px", borderRadius:10, fontSize:13.5, fontWeight:700, color:!activeDept?t.accent:t.ink }}><LayoutGrid size={15} /> Tümü</button>
              {DEPARTMENTS.map(d=>{ const dc=deptCol(d.id,dark); return (
                <div key={d.id} style={{ marginBottom:6 }}>
                  <button onClick={()=>selDept(d.id)} className="flex items-center gap-2 w-full" style={{ padding:"8px 10px", borderRadius:10, fontSize:13.5, fontWeight:700, color:dc.c, background:dc.soft }}><d.icon size={15} /> {d.name} <span className="mono ml-auto" style={{ fontSize:11, opacity:.7 }}>{deptCount(d.id)}</span></button>
                  <div className="flex flex-wrap gap-1.5" style={{ padding:"8px 4px 4px 10px" }}>
                    {d.subs.map(s=>{ const k=dc; return (
                      <button key={s.id} onClick={()=>selSub(d.id,s.id)} className="flex items-center gap-1.5" style={{ fontSize:12, fontWeight:600, padding:"6px 10px", borderRadius:9, border:`1px solid ${t.line}`, color:k.c }}><s.icon size={12} /> {s.name}</button>
                    );})}
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>
      </header>

      {/* GÖVDE */}
      <div style={{ maxWidth:1320, margin:"0 auto", position:"relative", zIndex:1 }} className="px-5 py-6">
        {/* breadcrumb + aktif filtre */}
        <div className="flex items-center gap-2 mb-5" style={{ fontSize:13, color:t.inkFaint }}>
          <span>{tab==="error"?"Çözümler":"Kılavuzlar"}</span>
          <ChevronRight size={14} />
          <span style={{ color:t.ink, fontWeight:700 }}>{crumb}</span>
          {(activeDept||activeSub) && (
            <button onClick={selAll} className="flex items-center gap-1" style={{ marginLeft:8, fontSize:12, fontWeight:600, color:t.inkSoft, background:t.surface2, borderRadius:8, padding:"3px 9px" }}>filtreyi temizle <X size={12} /></button>
          )}
        </div>

        {/* mobil çözüm/kılavuz */}
        <div className="md:hidden mb-5">
          <TabSwitch t={t} tab={tab} setTab={setTab} counts={{ error:ERRORS.length, guide:GUIDES.length }} full />
        </div>

        {/* İSTATİSTİK */}
        <div className="grid gap-3 mb-7" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))" }}>
          <Stat t={t} Icon={LayoutGrid} label="Departman" value={DEPARTMENTS.length} grad delay={0} />
          <Stat t={t} Icon={AlertCircle} label="Toplam Çözüm" value={ERRORS.length} delay={1} />
          <Stat t={t} Icon={FileText} label="Toplam Kılavuz" value={GUIDES.length} delay={2} />
          <Stat t={t} Icon={TrendingUp} label="En çok görüntülenen" valueText={topItem.code} sub={`${topItem.views} görüntülenme`} delay={3} />
        </div>

        {favItems.length>0 && (
          <Section t={t} title="Sabitlenenler" Icon={Pin} accentTitle>
            <div className="grid gap-3" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))" }}>
              {favItems.map((it,i)=><MiniCard key={it.id} item={it} t={t} dark={dark} onOpen={openItem} onFav={toggleFav} fav={favs.has(it.id)} pop={popId===it.id} delay={i} />)}
            </div>
          </Section>
        )}

        {!activeDept && !activeSub && (
          <div className="grid gap-6 lg:grid-cols-2 mb-2">
            <Section t={t} title="Sık görüntülenen" Icon={TrendingUp}>
              <div className="grid gap-3">{popular.map((it,i)=><RowCard key={it.id} item={{...it,type:tab}} t={t} dark={dark} onOpen={openItem} onFav={toggleFav} fav={favs.has(it.id)} pop={popId===it.id} rank={i+1} delay={i} />)}</div>
            </Section>
            <Section t={t} title="Son eklenen" Icon={Clock}>
              <div className="grid gap-3">{recent.map((it,i)=><RowCard key={it.id} item={{...it,type:tab}} t={t} dark={dark} onOpen={openItem} onFav={toggleFav} fav={favs.has(it.id)} pop={popId===it.id} delay={i} />)}</div>
            </Section>
          </div>
        )}

        <Section t={t} title={crumb} count={list.length}>
          {list.length===0 ? (
            <div style={{ color:t.inkFaint }} className="py-16 text-center text-sm">Bu seçimde kayıt yok.</div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))" }}>
              {list.map((it,i)=><BigCard key={it.id} item={{...it,type:tab}} t={t} dark={dark} onOpen={openItem} onFav={toggleFav} fav={favs.has(it.id)} pop={popId===it.id} onPhoto={openLightbox} delay={i} />)}
            </div>
          )}
        </Section>
      </div>

      {/* KOMUT PALETİ */}
      {paletteOpen && (
        <div onClick={()=>setPaletteOpen(false)} style={{ position:"fixed", inset:0, zIndex:80, background:"rgba(2,6,23,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:"12vh" }}>
          <div onClick={e=>e.stopPropagation()} className="fadeup" style={{ width:"92%", maxWidth:620, background:t.surface, border:`1px solid ${t.line}`, borderRadius:16, overflow:"hidden", boxShadow:`0 30px 70px rgba(0,0,0,0.45)` }}>
            <div className="flex items-center gap-3 px-4" style={{ borderBottom:`1px solid ${t.line}`, height:58 }}>
              <Search size={19} color={t.accent} />
              <input ref={inputRef} value={pq} onChange={e=>{setPq(e.target.value);setPIndex(0);}} onKeyDown={onPaletteKey} placeholder="Hata kodu, başlık…" style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:16, color:t.ink }} />
              <span className="mono" style={{ fontSize:10, color:t.inkFaint, border:`1px solid ${t.line}`, borderRadius:6, padding:"3px 6px" }}>ESC</span>
            </div>
            <div className="scroll" style={{ maxHeight:360, overflowY:"auto", padding:8 }}>
              {!pq && <div className="px-3 pt-2 pb-1" style={{ fontSize:10, fontWeight:800, color:t.inkFaint, letterSpacing:"0.12em" }}>SIK GÖRÜNTÜLENEN</div>}
              {paletteResults.length===0 && <div style={{ color:t.inkFaint }} className="px-3 py-8 text-center text-sm">"{pq}" için sonuç yok.</div>}
              {paletteResults.map((r,i)=>{ const Icon=subOf(r.cat).icon; const k=deptCol(r.dept,dark); const sel=i===pIndex; return (
                <div key={r.type+r.id} onMouseEnter={()=>setPIndex(i)} onClick={()=>openItem(r)} className="flex items-center gap-3 px-3" style={{ height:54, borderRadius:11, cursor:"pointer", background:sel?k.soft:"transparent" }}>
                  <span className="mono flex items-center justify-center" style={{ minWidth:64, fontSize:12, fontWeight:700, padding:"5px 8px", borderRadius:8, background:sel?k.c:t.surface2, color:sel?"#fff":k.c, border:`1px solid ${sel?"transparent":t.line}` }}>{r.code}</span>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize:14, fontWeight:600, color:t.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{highlight(r.title,pq,k.c)}</div>
                    <div className="flex items-center gap-1.5" style={{ fontSize:11.5, color:t.inkFaint }}><Icon size={11} color={k.c} /> {deptOf(r.dept).name} › {subOf(r.cat).name}</div>
                  </div>
                  {sel && <CornerDownLeft size={15} color={k.c} />}
                </div>
              );})}
            </div>
            <div className="flex items-center gap-4 px-4" style={{ borderTop:`1px solid ${t.line}`, height:40, fontSize:11, color:t.inkFaint }}>
              <span className="flex items-center gap-1"><ArrowUp size={11}/><ArrowDown size={11}/> gez</span><span className="flex items-center gap-1"><CornerDownLeft size={11}/> aç</span><span className="ml-auto mono">{paletteResults.length} sonuç</span>
            </div>
          </div>
        </div>
      )}

      {/* DETAY MODAL */}
      {selected && (()=>{ const k=deptCol(selected.dept,dark); const Icon=subOf(selected.cat).icon; const hue=deptOf(selected.dept).hue; const total=selected.steps.length; const done=[...checked].length;
        return (
        <div onClick={()=>setSelected(null)} style={{ position:"fixed", inset:0, zIndex:70, display:"flex", alignItems:"center", justifyContent:"center", padding:18, background:"rgba(2,6,23,0.62)", backdropFilter:"blur(5px)" }}>
          <div onClick={e=>e.stopPropagation()} className="modalIn" style={{ position:"relative", width:"100%", maxWidth:620, maxHeight:"90vh", display:"flex", flexDirection:"column", background:t.surface, border:`1px solid ${t.line}`, borderRadius:22, overflow:"hidden", boxShadow:`0 40px 90px rgba(0,0,0,0.5)` }}>
            <div style={{ height:5, background:`linear-gradient(90deg,${k.c},${k.c}88)`, flexShrink:0 }} />
            <div className="scroll p-6" style={{ overflowY:"auto" }}>
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-2" style={{ fontSize:12, color:t.inkFaint }}><Icon size={14} color={k.c} /> {deptOf(selected.dept).name} › {subOf(selected.cat).name} · {fmtDate(selected.date)}</div>
                <button onClick={()=>setSelected(null)} className="flex items-center justify-center" style={{ width:32, height:32, borderRadius:12, border:`1px solid ${t.line}`, color:t.inkSoft }}><X size={17} /></button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="mono flex items-center" style={{ fontSize:17, fontWeight:700, color:"#fff", background:k.c, padding:"7px 15px", borderRadius:12, boxShadow:`0 6px 16px ${k.c}55` }}>{selected.code}</div>
                <button onClick={()=>{ navigator.clipboard?.writeText(selected.code); setCopied(true); setTimeout(()=>setCopied(false),1400); }} className="flex items-center gap-1.5" style={{ fontSize:12.5, fontWeight:600, color:copied?t.ok:t.inkSoft, border:`1px solid ${t.line}`, padding:"8px 12px", borderRadius:12, background:t.paper }}>{copied?<Check size={14}/>:<Copy size={14}/>}{copied?"Kopyalandı":"Kodu kopyala"}</button>
              </div>
              <h2 style={{ fontSize:23, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1.15, marginBottom:10 }}>{selected.title}</h2>
              <p style={{ fontSize:15, lineHeight:1.6, color:t.inkSoft, marginBottom:18 }}>{selected.summary}</p>
              <div className="flex items-center gap-3 mb-4">
                <div style={{ flex:1, height:7, background:t.surface2, borderRadius:7, overflow:"hidden" }}><div style={{ width:`${(done/total)*100}%`, height:"100%", background:t.ok, transition:"width .35s cubic-bezier(.2,.8,.2,1)" }} /></div>
                <span className="mono" style={{ fontSize:12, color:t.inkFaint }}>{done}/{total}</span>
              </div>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.12em", color:t.inkFaint, marginBottom:10 }}>ÇÖZÜM ADIMLARI</div>
              <div className="grid gap-2.5">
                {selected.steps.map((s,i)=>(
                  <StepItem key={i} s={s} i={i} on={checked.has(i)} t={t} hue={hue} k={k}
                    onToggle={()=>setChecked(prev=>{const n=new Set(prev); n.has(i)?n.delete(i):n.add(i); return n;})}
                    onPhoto={(idx)=>openLightbox(stepPhotos(s),hue,idx)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      );})()}

      {/* LIGHTBOX */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{ position:"fixed", inset:0, zIndex:95, background:"rgba(2,6,23,0.92)", backdropFilter:"blur(6px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div className="flex items-center justify-between w-full" style={{ maxWidth:900, marginBottom:14, color:"#cbd5e1" }} onClick={e=>e.stopPropagation()}>
            <span style={{ fontSize:14, fontWeight:600 }}>{lightbox.photos[lightbox.index].label}</span>
            <div className="flex items-center gap-3"><span className="mono" style={{ fontSize:13, color:"#94a3b8" }}>{lightbox.index+1} / {lightbox.photos.length}</span>
              <button onClick={()=>setLightbox(null)} className="flex items-center justify-center" style={{ width:38, height:38, borderRadius:12, background:"rgba(255,255,255,0.1)", color:"#fff" }}><X size={20} /></button></div>
          </div>
          <div className="flex items-center gap-3" onClick={e=>e.stopPropagation()}>
            {lightbox.photos.length>1 && <button onClick={()=>setLightbox(l=>({...l,index:(l.index-1+l.photos.length)%l.photos.length}))} className="flex items-center justify-center" style={{ width:46, height:46, borderRadius:14, background:"rgba(255,255,255,0.1)", color:"#fff", flexShrink:0 }}><ChevronLeft size={24} /></button>}
            <img src={lightbox.photos[lightbox.index].src} alt="" style={{ maxWidth:"min(900px,82vw)", maxHeight:"72vh", borderRadius:16, boxShadow:"0 30px 80px rgba(0,0,0,0.6)" }} />
            {lightbox.photos.length>1 && <button onClick={()=>setLightbox(l=>({...l,index:(l.index+1)%l.photos.length}))} className="flex items-center justify-center" style={{ width:46, height:46, borderRadius:14, background:"rgba(255,255,255,0.1)", color:"#fff", flexShrink:0 }}><ChevronRight size={24} /></button>}
          </div>
          {lightbox.photos.length>1 && (
            <div className="flex gap-2 mt-4 no-sb" style={{ overflowX:"auto", maxWidth:"82vw" }} onClick={e=>e.stopPropagation()}>
              {lightbox.photos.map((p,idx)=>(<img key={idx} src={p.src} alt="" onClick={()=>setLightbox(l=>({...l,index:idx}))} style={{ width:74, height:54, objectFit:"cover", borderRadius:9, cursor:"pointer", flexShrink:0, opacity:idx===lightbox.index?1:0.45, outline:idx===lightbox.index?"2px solid #fff":"none" }} />))}
            </div>
          )}
        </div>
      )}

      <button onClick={()=>setPaletteOpen(true)} className="sm:hidden flex items-center justify-center" style={{ position:"fixed", right:18, bottom:18, zIndex:50, width:56, height:56, borderRadius:18, background:`linear-gradient(135deg,${t.accent},${t.accent2})`, color:"#fff", boxShadow:`0 12px 30px ${t.accent}66` }}><Search size={24} /></button>
    </div>
  );
}

/* ---------- Alt bileşenler ---------- */
function TabSwitch({ t, tab, setTab, counts, full }) {
  const items = [
    { k:"error", label:"Çözümler", Icon:Wrench },
    { k:"guide", label:"Kılavuzlar", Icon:ClipboardList },
  ];
  const idx = items.findIndex(i => i.k === tab);
  return (
    <div style={{ position:"relative", display:"flex", background:t.surface2, border:`1px solid ${t.line}`, borderRadius:13, padding:4, width:full?"100%":"auto" }}>
      {/* kayan gösterge */}
      <div style={{ position:"absolute", top:4, bottom:4, left:4, width:`calc((100% - 8px) / 2)`,
        transform:`translateX(${idx*100}%)`, transition:"transform .28s cubic-bezier(.3,.9,.3,1)",
        background:`linear-gradient(135deg,${t.accent},${t.accent2})`, borderRadius:9, boxShadow:`0 4px 12px ${t.accent}45` }} />
      {items.map(({ k, label, Icon })=>{ const on=tab===k; return (
        <button key={k} onClick={()=>setTab(k)} className="flex items-center justify-center gap-2"
          style={{ position:"relative", zIndex:1, flex:1, minWidth:full?0:118, padding:"8px 14px",
            fontSize:13, fontWeight:700, color:on?"#fff":t.inkSoft, transition:"color .2s", whiteSpace:"nowrap" }}>
          <Icon size={15} strokeWidth={2.4} /> {label}
          <span className="mono" style={{ fontSize:10.5, fontWeight:700, padding:"1px 6px", borderRadius:7,
            background:on?"rgba(255,255,255,0.22)":t.surface, color:on?"#fff":t.inkFaint }}>{counts[k]}</span>
        </button>
      );})}
    </div>
  );
}
function Stat({ t, Icon, label, value, valueText, sub, grad, delay }) {
  const n=useCountUp(typeof value==="number"?value:0);
  return (
    <div className="fadeup lift" style={{ animationDelay:`${delay*60}ms`, background:t.surface, border:`1px solid ${t.line}`, borderRadius:18, padding:16, boxShadow:`0 1px 3px ${t.shadow}`, position:"relative", overflow:"hidden" }}>
      {grad && <div style={{ position:"absolute", right:-30, top:-30, width:90, height:90, background:`radial-gradient(closest-side,${t.glow},transparent)` }} />}
      <div className="flex items-center justify-between mb-3" style={{ position:"relative" }}>
        <span style={{ fontSize:11.5, fontWeight:700, color:t.inkFaint }}>{label}</span>
        <span className="flex items-center justify-center" style={{ width:30, height:30, borderRadius:9, background:t.accentSoft, color:t.accent }}><Icon size={15} /></span>
      </div>
      <div style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1, position:"relative" }}>{valueText ?? n}</div>
      {sub && <div style={{ fontSize:11, color:t.inkFaint, marginTop:4 }}>{sub}</div>}
    </div>
  );
}
function Section({ t, title, count, Icon, accentTitle, children }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3.5">
        {Icon && <Icon size={16} color={accentTitle?t.accent:t.inkSoft} />}
        <h2 style={{ fontSize:13, fontWeight:800, color:accentTitle?t.accent:t.ink, textTransform:"uppercase", letterSpacing:"0.05em" }}>{title}</h2>
        {count!=null && <span className="mono" style={{ fontSize:12, color:t.inkFaint }}>· {count}</span>}
        <div style={{ flex:1, height:1, background:t.line, marginLeft:6 }} />
      </div>
      {children}
    </section>
  );
}
function FavBtn({ fav, onClick, t, pop, k }) {
  const col=k?k.c:t.accent, soft=k?k.soft:t.accentSoft;
  return <button onClick={onClick} className={`flex items-center justify-center flex-shrink-0 ${pop?"popfx":""}`} style={{ width:30, height:30, borderRadius:10, color:fav?col:t.inkFaint, background:fav?soft:"transparent" }}><Star size={16} fill={fav?col:"none"} /></button>;
}
function Pill({ children, t, color, soft, faint }) {
  return <span className="flex items-center gap-1" style={{ fontSize:11, fontWeight:700, padding:"4px 9px", borderRadius:999, color:faint?t.inkSoft:color, background:faint?t.surface2:soft, border:`1px solid ${faint?t.line:"transparent"}`, whiteSpace:"nowrap" }}>{children}</span>;
}
function BigCard({ item, t, dark, onOpen, onFav, fav, pop, onPhoto, delay }) {
  const k=deptCol(item.dept,dark); const S=subOf(item.cat); const Icon=S.icon; const imgs=item.images||[]; const phue=deptOf(item.dept).hue;
  return (
    <div className="fadeup lift" style={{ animationDelay:`${delay*40}ms`, background:t.surface, border:`1px solid ${t.line}`, borderRadius:22, cursor:"pointer", boxShadow:`0 1px 3px ${t.shadow}`, display:"flex", flexDirection:"column", overflow:"hidden" }}
      onClick={()=>onOpen(item)} onMouseEnter={e=>{e.currentTarget.style.borderColor=k.c; e.currentTarget.style.boxShadow=`0 18px 44px ${t.shadowLg}`;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=t.line; e.currentTarget.style.boxShadow=`0 1px 3px ${t.shadow}`;}}>
      <div style={{ height:4, background:k.c }} />
      <div style={{ padding:18, display:"flex", flexDirection:"column", flex:1 }}>
        <div className="flex items-start gap-3 mb-3">
          <span className="flex items-center justify-center flex-shrink-0" style={{ width:32, height:32, borderRadius:10, background:k.soft, color:k.c }}><Icon size={17} /></span>
          <h3 style={{ flex:1, fontSize:15.5, fontWeight:700, lineHeight:1.25, letterSpacing:"-0.01em" }}>{item.title}</h3>
          <span className="mono flex-shrink-0" style={{ fontSize:11, fontWeight:700, padding:"4px 9px", borderRadius:8, background:k.soft, color:k.c }}>{item.code}</span>
        </div>
        <p style={{ fontSize:13, lineHeight:1.5, color:t.inkSoft, flex:1, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.summary}</p>
        <div className="flex items-center gap-2 mt-3">
          <Pill t={t} color={k.c} soft={k.soft}>{S.name}</Pill>
          <Pill t={t} faint><Calendar size={11} /> {fmtDate(item.date)}</Pill>
          <span className="ml-auto"><Pill t={t} color={k.c} soft={k.soft}><Eye size={11} /> {item.views}</Pill></span>
          <FavBtn fav={fav} pop={pop} t={t} k={k} onClick={(e)=>onFav(item.id,e)} />
        </div>
        {imgs.length>0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2"><div style={{ flex:1, height:1, background:t.line }} /><span style={{ fontSize:9.5, fontWeight:800, letterSpacing:"0.14em", color:t.inkFaint }}>{item.type==="guide"?"KILAVUZ GÖRSELİ":"HATA GÖRSELİ"}</span><div style={{ flex:1, height:1, background:t.line }} /></div>
            <button className="thumb" onClick={(e)=>onPhoto(imgs,phue,0,e)} style={{ position:"relative", width:"100%", borderRadius:14, overflow:"hidden", border:`2px solid ${k.line}`, display:"block", aspectRatio:"16/10", background:t.surface2 }}>
              <img src={makePhoto(imgs[0],phue)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
              <span className="flex items-center justify-center" style={{ position:"absolute", right:8, bottom:8, gap:4, fontSize:11, fontWeight:700, color:"#fff", background:"rgba(0,0,0,0.55)", borderRadius:8, padding:"4px 8px", display:"flex" }}><ZoomIn size={12} /> {imgs.length>1?`+${imgs.length-1}`:"Büyüt"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
function RowCard({ item, t, dark, onOpen, onFav, fav, pop, rank, delay }) {
  const k=deptCol(item.dept,dark);
  return (
    <div className="fadeup lift flex items-center gap-3" style={{ animationDelay:`${delay*40}ms`, background:t.surface, border:`1px solid ${t.line}`, borderRadius:16, padding:"11px 13px", cursor:"pointer", boxShadow:`0 1px 2px ${t.shadow}` }}
      onClick={()=>onOpen(item)} onMouseEnter={e=>{e.currentTarget.style.borderColor=k.c; e.currentTarget.style.boxShadow=`0 10px 26px ${t.shadow}`;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=t.line; e.currentTarget.style.boxShadow=`0 1px 2px ${t.shadow}`;}}>
      {rank && <span className="mono flex items-center justify-center" style={{ fontSize:12, fontWeight:800, color:"#fff", minWidth:22, height:22, borderRadius:7, background:k.c }}>{rank}</span>}
      <span className="mono flex-shrink-0" style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:8, background:k.soft, color:k.c }}>{item.code}</span>
      <div className="flex-1 min-w-0"><div style={{ fontSize:13.5, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.title}</div><div style={{ fontSize:11, color:t.inkFaint }}>{deptOf(item.dept).name} › {subOf(item.cat).name}</div></div>
      <FavBtn fav={fav} pop={pop} t={t} k={k} onClick={(e)=>onFav(item.id,e)} />
    </div>
  );
}
function MiniCard({ item, t, dark, onOpen, onFav, fav, pop, delay }) {
  const k=deptCol(item.dept,dark); const Icon=subOf(item.cat).icon;
  return (
    <div className="fadeup lift flex items-center gap-3" style={{ animationDelay:`${delay*40}ms`, background:k.soft, border:`1px solid ${k.line}`, borderRadius:16, padding:"11px 13px", cursor:"pointer" }} onClick={()=>onOpen(item)}>
      <span className="mono flex-shrink-0" style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:8, background:t.surface, color:k.c }}>{item.code}</span>
      <div className="flex-1 min-w-0"><div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.title}</div><div className="flex items-center gap-1" style={{ fontSize:11, color:t.inkSoft }}><Icon size={11} color={k.c} /> {subOf(item.cat).name}</div></div>
      <FavBtn fav={fav} pop={pop} t={t} k={k} onClick={(e)=>onFav(item.id,e)} />
    </div>
  );
}
function StepItem({ s, i, on, t, hue, k, onToggle, onPhoto }) {
  const text=stepText(s); const photos=stepPhotos(s);
  return (
    <div style={{ borderRadius:16, background:on?k.soft:t.paper, border:`1px solid ${on?k.c:t.line}`, overflow:"hidden", transition:"background .2s, border-color .2s" }}>
      <button onClick={onToggle} className="flex items-start gap-3 text-left w-full" style={{ padding:"13px 15px", background:"transparent" }}>
        <span className="flex items-center justify-center flex-shrink-0" style={{ width:22, height:22, borderRadius:7, marginTop:1, background:on?t.ok:"transparent", border:`1.5px solid ${on?t.ok:t.inkFaint}`, color:"#fff" }}>{on?<Check size={14}/>:<span className="mono" style={{ fontSize:11, color:t.inkFaint }}>{i+1}</span>}</span>
        <span style={{ fontSize:14.5, lineHeight:1.5, color:on?t.inkFaint:t.ink, textDecoration:on?"line-through":"none" }}>{text}</span>
      </button>
      {photos.length>0 && (
        <div className="flex gap-2 no-sb" style={{ padding:"0 15px 13px 50px", overflowX:"auto" }}>
          {photos.map((p,idx)=>(<button key={idx} className="thumb flex-shrink-0" onClick={()=>onPhoto(idx)} style={{ width:96, height:68, borderRadius:10, overflow:"hidden", border:`1.5px solid ${k.line}` }}><img src={makePhoto(p,hue)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} /></button>))}
          <span className="flex items-center" style={{ fontSize:11, color:t.inkFaint, paddingLeft:2 }}>{photos.length} görsel</span>
        </div>
      )}
    </div>
  );
}
