import {initializeApp} from "firebase/app";
import * as FS from "firebase/firestore";
import * as AU from "firebase/auth";
import {Capacitor} from "@capacitor/core";
import {Share} from "@capacitor/share";
import {Filesystem,Directory} from "@capacitor/filesystem";
import {Browser} from "@capacitor/browser";
import {App} from "@capacitor/app";
import {firebaseConfig} from "./firebase-config.js";
var K="adminloja-v1",DB,me=null,tab="home",flt="todos",Q="",tmp=[],tt,V={},L={},A={},ST=["pendente","pago","entregue","cancelado"],
T={home:"Início",ord:"Pedidos",prod:"Produtos",cust:"Clientes",cash:"Financeiro",users:"Usuários"},
IC={home:'<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',list:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',box:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5L12 12l8-4.5M12 12v9"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .7 3.5 2.6 3.5 5.5"/>',wallet:'<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',chat:'<path d="M12 3c5 0 9 3.4 9 7.7S17 18.4 12 18.4c-1 0-2-.1-2.9-.4L4 20l1.2-3.6C3.8 15.2 3 13.5 3 10.7 3 6.4 7 3 12 3z"/>',back:'<path d="M15 5l-7 7 7 7"/>',plus:'<path d="M12 5v14M5 12h14"/>',share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',pdf:'<path d="M6 3h8l5 5v13H6z"/><path d="M12 11v6M9 14l3 3 3-3"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'};
function ic(n){return'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[n]+'</svg>'}
function $(i){return document.getElementById(i)}
var app=initializeApp(firebaseConfig),auth=AU.getAuth(app),fdb=FS.initializeFirestore(app,{localCache:FS.persistentLocalCache({})}),EM="@adminloja.app",unsubs=[],loaded={},need=[],BUSY=false,sec=null,
SRT={prods:nm,cust:nm,users:nm,ord:function(a,b){return a.id-b.id},cash:function(a,b){return(a.ts||0)-(b.ts||0)}};
function nm(a,b){return String(a.n||"").localeCompare(String(b.n||""))}
function load(){DB={users:[],prods:[],cust:[],ord:[],cash:[],sep:[],audit:[],mov:[],cats:[],custos:[],pedidosweb:[],catalogo:[]}}
function dref(n,i){return FS.doc(fdb,n,String(i))}
function cashId(i){return"o"+i}
function cashOf(i,o){return{ts:uid(),tp:"entrada",v:tot(o),d:"Pedido #"+String(i).slice(-4),cat:"Vendas",dt:hoje(),oid:String(i)}}
function cleanU(s){s=String(s||"").trim().toLowerCase();return/^[a-z0-9._-]{2,30}$/.test(s)?s:""}
function mkEm(){return"u"+uid()+EM}
function ready(){return need.every(function(n){return loaded[n]})}
function fail(e){console.error(e);var c=e&&e.code||"";toast(c=="permission-denied"?"Recusado: sem permissão ou estoque insuficiente.":c=="auth/requires-recent-login"?"Saia e entre de novo para trocar a senha.":c=="auth/weak-password"?"A senha precisa ter ao menos 6 caracteres.":c=="auth/network-request-failed"||c=="unavailable"?"Sem conexão. Tente de novo.":"Não foi possível salvar.")}
function kick(m){toast(m);AU.signOut(auth)}
function refresh(){if(!me||!ready())return;ensureGen();autoSync();updBadge();var l=$("lst");if(l&&L[tab])l.innerHTML=L[tab]();else R()}
function unsub(){unsubs.forEach(function(f){f()});unsubs=[];loaded={};need=[];RU=0;SC=null;PWSEEN=null;load()}
function sub(n){var soft=n=="sep"||n=="audit"||n=="mov"||n=="cats"||n=="custos"||n=="pedidosweb"||n=="catalogo",ref=FS.collection(fdb,n);if(n=="audit"||n=="mov"||n=="pedidosweb")ref=FS.query(ref,FS.orderBy("ts","desc"),FS.limit(500));
unsubs.push(FS.onSnapshot(ref,function(s){DB[n]=s.docs.map(function(d){var o=d.data();o.id=d.id;return o}).sort(SRT[n]);loaded[n]=1;SC=null;if(n=="pedidosweb")webNotify();refresh()},function(e){if(soft){loaded[n]=1;DB[n]=[];RU=1;refresh();return}if(e&&e.code=="permission-denied")kick("Sem permissão de acesso.");else console.error(e)}))}
function subscribe(){unsub();need=["prods","cust","ord","sep","cats"];if(G())need.push("cash","mov","custos","pedidosweb","catalogo");if(me.r=="admin")need.push("users","audit");need.forEach(sub);subPrefs();subLoja();need.forEach(sub);
unsubs.push(FS.onSnapshot(dref("users",me.id),function(s){if(!s.exists()){kick("Seu acesso foi removido.");return}var o=s.data();me.n=o.n;me.com=o.com;if(o.r!=me.r){me.r=o.r;if(tab=="cash"&&!G()||tab=="users"&&me.r!="admin")tab="home";subscribe();R()}},function(){}))}
async function enter(u){try{var s=await FS.getDoc(dref("users",u.uid));if(!s.exists()){await AU.signOut(auth);toast("Esse usuário não tem acesso ao app.");return}
me=s.data();me.id=u.uid;tab="home";loadPF();subscribe();R();var b0=FS.writeBatch(fdb);aud(b0,"login","sistema","Login no aplicativo");b0.commit().catch(function(){})}catch(e){console.error(e);toast("Não foi possível entrar. Verifique a conexão.");AU.signOut(auth)}}
function mkAuth(em,p){var a=AU.getAuth(sec||(sec=initializeApp(firebaseConfig,"sec")));return AU.createUserWithEmailAndPassword(a,em,p).then(function(c){return AU.signOut(a).then(function(){return c.user.uid})})}
function doLogin(){var u=cleanU($("lu").value),p=$("lp").value;if(!u||!p)return toast("Informe usuário e senha.");$("lb").disabled=true;
FS.getDoc(dref("logins",u)).then(function(s){if(!s.exists())throw{code:"nouser"};return AU.signInWithEmailAndPassword(auth,s.data().em,p)}).catch(function(e){var b=$("lb"),c=e&&e.code||"";if(b)b.disabled=false;toast(c=="unavailable"||c=="auth/network-request-failed"?"Sem conexão com a internet.":c=="auth/too-many-requests"?"Muitas tentativas. Aguarde um pouco.":"Usuário ou senha incorretos.")})}
function toast(t){var e=$("ts");e.textContent=t;e.className="on";clearTimeout(tt);tt=setTimeout(function(){e.className=""},2800)}
window.alert=toast;
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function brl(n){return(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function uid(){return Date.now()*10+Math.floor(Math.random()*10)}
function hoje(){return new Date().toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}).replace(",","")}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function g(a,i){return a.filter(function(x){return x.id==i})[0]}
function G(){return me.r!="vendedor"}
function tot(o){return o.items.reduce(function(s,i){return s+i.q*i.pr},0)+(o.acr||0)-(o.disc||0)}
function cs(){var e=0,s=0;DB.cash.forEach(function(c){c.tp=="entrada"?e+=c.v:s+=c.v});return[e,s]}
function empty(t){return'<p class="m" style="text-align:center;padding:24px 0">'+t+'</p>'}
function sb(p){return'<div class="sb">'+ic("search")+'<input data-q="1" placeholder="'+p+'" value="'+esc(Q)+'"></div>'}
function wa(t,tel){var n=String(tel||"").replace(/\D/g,"");if(n&&n.length<=11)n="55"+n;var u="https://wa.me/"+n+"?text="+encodeURIComponent(t),w=null;if(Capacitor.isNativePlatform()){SP(t,u,n,1);return}try{w=window.open(u,"_blank")}catch(e){}if(!w)SP(t,u)}
function SP(t,u,n,nat){$("sh").innerHTML='<div class="sc"><b class="h" style="font-size:1.2rem">Compartilhar</b><p class="m">'+(nat?(n?'Envie esta mensagem para o WhatsApp <b>+'+esc(n)+'</b>. Toque em Compartilhar e escolha o WhatsApp, ou copie o texto.':'Toque em Compartilhar e escolha o WhatsApp, ou copie o texto.'):'Toque em Abrir no WhatsApp ou copie o texto.')+'</p><textarea id="bt" rows="6" readonly>'+esc(t)+'</textarea>'+(nat?'':'<a class="bp ac" href="'+esc(u)+'" target="_blank" rel="noopener" style="text-decoration:none">Abrir no WhatsApp</a>')+(navigator.share||nat?'<button class="bp ol" data-a="sn">Compartilhar…</button>':'')+'<button class="bp ol" data-a="cp">Copiar texto</button><button class="bp ol" data-a="x2">Fechar</button></div>';$("sh").hidden=false}
function cl(s){return String(s).replace(/\u00a0/g," ").replace(/[\u2013\u2014\u2212]/g,"-").replace(/[^\x20-\x7e\xa1-\xff]/g,"?")}
function pR(s,n){s=cl(s).slice(0,n);return s+" ".repeat(n-s.length)}
function pL(s,n){s=cl(s).slice(0,n);return" ".repeat(n-s.length)+s}
function money(n){return cl(brl(n))}
function wrapL(s,n){var r=[];s=cl(s);while(s.length>n){var k=s.lastIndexOf(" ",n);if(k<1)k=n;r.push(s.slice(0,k));s=s.slice(k).replace(/^ /,"")}r.push(s);return r}
function pdf(lines){var per=56,pg=[],i;for(i=0;i<lines.length;i+=per)pg.push(lines.slice(i,i+per));if(!pg.length)pg.push([""]);
var ob=["","<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids ["+pg.map(function(_,k){return(5+2*k)+" 0 R"}).join(" ")+"] /Count "+pg.length+" >>","<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>"];
pg.forEach(function(l,k){var s="BT /F1 10 Tf 13 TL 40 800 Td\n"+l.map(function(x){return"("+cl(x).replace(/([\\()])/g,"\\$1")+") Tj T*"}).join("\n")+"\nET";
ob[4+2*k]="<< /Length "+s.length+" >>\nstream\n"+s+"\nendstream";
ob[5+2*k]="<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents "+(4+2*k)+" 0 R >>"});
var o="%PDF-1.4\n",off=[];for(i=1;i<ob.length;i++){off[i]=o.length;o+=i+" 0 obj\n"+ob[i]+"\nendobj\n"}
var x=o.length;o+="xref\n0 "+ob.length+"\n0000000000 65535 f \n";for(i=1;i<ob.length;i++)o+=("0000000000"+off[i]).slice(-10)+" 00000 n \n";
o+="trailer\n<< /Size "+ob.length+" /Root 1 0 R >>\nstartxref\n"+x+"\n%%EOF";
var u=new Uint8Array(o.length);for(i=0;i<o.length;i++)u[i]=o.charCodeAt(i)&255;return u}
async function dl(name,b){
if(Capacitor.isNativePlatform()){try{var s="",k;for(k=0;k<b.length;k+=8192)s+=String.fromCharCode.apply(null,b.subarray(k,k+8192));var f=await Filesystem.writeFile({path:name,data:btoa(s),directory:Directory.Cache});await Share.share({title:name,url:f.uri,dialogTitle:"Compartilhar PDF"})}catch(e){if(!/cancel/i.test(String(e&&e.message||e)))toast("Não foi possível gerar o arquivo.")}return}
try{var u=URL.createObjectURL(new Blob([b],{type:/\.csv$/.test(name)?"text/csv":"application/pdf"})),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000);toast("Arquivo gerado.")}catch(e){toast("Não foi possível gerar o PDF neste aparelho.")}}
function X(){$("md").hidden=true;$("md").innerHTML=""}
var PH="",PB=0;
function pic(f,cb,er){var r=new FileReader(),bad=function(){er("Não consegui ler essa imagem. Use uma foto JPG ou PNG.")};r.onerror=bad;r.onload=function(){var im=new Image();im.onerror=bad;im.onload=function(){var s=Math.min(1,320/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));c.getContext("2d").drawImage(im,0,0,c.width,c.height);cb(c.toDataURL("image/jpeg",.75))};im.src=r.result};r.readAsDataURL(f)}
function phv(){var w=$("pvw");if(!w)return;w.innerHTML=PH?'<img class="av" alt="" src="'+PH+'">':'<div class="av">'+ic("box")+'</div>';$("pm").textContent=PH?"Foto selecionada":"Sem foto"}
function PHload(t){var f=t.files[0];if(!f)return;PB=1;toast("Processando foto…");pic(f,function(u){PH=u;PB=0;phv();toast("Foto pronta.")},function(m){PB=0;toast(m)})}
function P(t,sub,body,foot){$("md").innerHTML='<div class="pg"><div class="ph"><button class="ib" data-a="x" aria-label="Voltar">'+ic("back")+'</button><div><div class="pt">'+t+'</div>'+(sub?'<div class="m">'+sub+'</div>':'')+'</div></div><div class="pb">'+body+'</div>'+(foot?'<div class="pf">'+foot+'</div>':'')+'</div>';$("md").hidden=false}
function F(t,fs,v,cb,del){v=v||{};
P(t,"",fs.map(function(f){var k=f[0],x=v[k]==null?"":v[k],i;
if(f[2]=="s")i='<select id="f_'+k+'">'+f[3].map(function(o){return'<option value="'+o[0]+'"'+(o[0]==x?" selected":"")+'>'+o[1]+'</option>'}).join("")+'</select>';
else if(f[2]=="t")i='<textarea id="f_'+k+'" rows="3">'+esc(x)+'</textarea>';
else if(f[2]=="f")i='<div class="c r" style="margin:8px 0 0"><div class="it"><span id="pvw"></span><span class="m" id="pm"></span></div><div class="w" style="margin:0;justify-content:flex-end"><label class="chip on" for="ph1" style="margin:0">Câmera</label><label class="chip on" for="ph2" style="margin:0">Galeria</label><button type="button" class="chip" data-a="phx">Remover</button></div></div><input class="hf" id="ph1" type="file" accept="image/*" capture="environment" data-ph="1"><input class="hf" id="ph2" type="file" accept="image/*" data-ph="1">';
else if(f[2]=="d")i='<input id="f_'+k+'" type="date" value="'+esc(x)+'">';
else if(f[2]=="m"||f[2]=="r")i='<input id="f_'+k+'" inputmode="decimal" autocomplete="off" value="'+esc(x)+'"'+(f[2]=="r"?' readonly style="background:var(--bg)"':'')+'>';
else if(f[2]=="k")i='<button type="button" class="bp ol" id="f_kb" data-a="kp" style="margin:6px 0 0;text-align:left">'+esc(catLabel(x,v))+'</button><input type="hidden" id="f_'+k+'" value="'+esc(x)+'">';
else if(f[2]=="h")i='<div id="f_'+k+'" class="m" style="min-height:1.5em"></div>';
else i='<input id="f_'+k+'" '+(f[2]=="n"?'type="number" step="any" inputmode="decimal" ':'')+'value="'+esc(x)+'">';
return'<label>'+f[1]+i+'</label>'}).join("")+(del?'<button class="bp ol dg" data-a="'+del[0]+'" data-i="'+del[1]+'">Excluir</button>':''),'<button class="bp" id="ok">Salvar</button>');
phv();$("ok").onclick=function(){if(PB)return toast("Aguarde a foto terminar de carregar.");var o={};fs.forEach(function(f){var e=$("f_"+f[0]);o[f[0]]=f[2]=="n"?parseFloat(e.value)||0:f[2]=="m"||f[2]=="r"?pf(e.value):f[2]=="f"?PH:f[2]=="h"?"":e.value.trim()});cb(o)}}

function R(){if(!me){login();return}if(!ready()){$("app").innerHTML='<header><h1>Admin Loja</h1></header><main><p class="m" style="text-align:center;padding:40px 0">Carregando dados…</p></main>';return}
var t=[["home","Início","home"],["ord","Pedidos","list"],["sep","Separar","check"],["prod","Produtos","box"],["cust","Clientes","users"]];if(G()){t.splice(2,0,["site","Site","globe"]);t.push(["cash","Financeiro","wallet"])}
var fb={ord:"no",prod:"np",cust:"nc2",cash:"nl",users:"nu"}[tab];if(tab!="ord"&&!G())fb=0;
$("app").innerHTML='<header><h1>'+T[tab]+(navigator.onLine?'':' <span class="m" style="font-size:.9rem">· offline</span>')+'</h1>'+(tab=="home"?'<button class="ib" data-a="tab" data-i="cfg" aria-label="Configurações">'+ic("gear")+'</button>':'')+'</header><main>'+(RU?BAN:"")+V[tab]()+'</main>'+(fb?'<button class="fab" data-a="'+fb+'" aria-label="Novo">'+ic("plus")+'</button>':'')+'<nav>'+t.map(function(x){return'<button class="'+(tab==x[0]?"on":"")+'" data-a="tab" data-i="'+x[0]+'">'+ic(x[2])+'<span>'+x[1]+'</span>'+(x[0]=="site"&&webNovos()?'<i class="bdg">'+webNovos()+'</i>':'')+'</button>'}).join("")+'</nav>'}
function login(){$("app").innerHTML='<div class="lg"><h1>Admin Loja</h1><p class="m" style="margin-bottom:24px">Entre para continuar.</p><label>Usuário<input id="lu" autocapitalize="none" autocomplete="username"></label><label>Senha<input id="lp" type="password" autocomplete="current-password"></label><button class="bp" id="lb">Entrar</button><div id="fs"></div><button class="bp ol" data-a="sup">Falar com o suporte</button><p class="m" style="text-align:center;margin-top:24px">Versão '+APPN+'</p></div>';
$("lb").onclick=doLogin;$("lp").onkeydown=function(e){if(e.key=="Enter")doLogin()};
FS.getDoc(dref("meta","setup")).then(function(s){var e=$("fs");if(e&&!s.exists()&&!me)e.innerHTML='<p class="m">Nenhum administrador criado ainda.</p><button class="bp ac" data-a="su">Criar administrador</button>'}).catch(function(){})}

V.cust=function(){return sb("Buscar cliente")+'<div id="lst">'+L.cust()+'</div>'}
V.cash=function(){var a=cs();return'<div class="gr3">'+[["Entradas",a[0]],["Saídas",a[1]],["Saldo",a[0]-a[1]]].map(function(x){return'<div class="c"><div class="m">'+x[0]+'</div><b class="big">'+brl(x[1])+'</b></div>'}).join("")+'</div>'+
(DB.cash.length?DB.cash.slice().reverse().map(function(c){return'<div class="c r"><div><b>'+esc(c.d)+'</b><div class="m">'+c.dt+(c.cat?' · '+esc(c.cat):'')+'</div></div><div style="text-align:right"><b class="'+(c.tp=="entrada"?"gn":"")+'">'+(c.tp=="entrada"?"+":"−")+brl(c.v)+'</b><div><button class="chip" data-a="dl" data-i="'+c.id+'" style="margin-top:4px;padding:5px 12px">Excluir</button></div></div></div>'}).join(""):empty("Nenhum lançamento."))}


A.tab=function(i){if(i=="aud"&&me.r!="admin"||i=="rel"&&!G()||i=="users"&&me.r!="admin"||i=="perm"&&me.r!="admin"||i=="cat"&&!G()||i=="site"&&!G()||i=="loja"&&!G())return toast("Sem permissão para esta área.");tab=i;Q="";R();scrollTo(0,0)};A.fl=function(i){flt=i;R()};A.x=X;A.x2=function(){$("sh").hidden=true;$("sh").innerHTML=""};A.out=function(){AU.signOut(auth)};
A.phx=function(){PH="";phv()};
A.nc2=function(i){var c=i?g(DB.cust,i):{};F(i?"Editar cliente":"Novo cliente",[["n","Nome"],["t","Telefone (com DDD)"],["e","E-mail"],["a","Endereço"],["o","Observações","t"]],c,function(o){if(!o.n)return toast("Informe o nome.");
var r={n:o.n,t:o.t,e:o.e,a:o.a,o:o.o};(i?FS.updateDoc(dref("cust",i),r):FS.setDoc(dref("cust",uid()),r)).catch(fail);X();R()},i?["dc",i]:0)};
A.dc=function(i){if(i==GEN)return toast("O cliente genérico não pode ser excluído.");if(confirm("Excluir este cliente?")){FS.deleteDoc(dref("cust",i)).catch(fail);X();R()}};
A.wc=function(i){wa("Olá!",g(DB.cust,i).t)};
A.nl=function(){F("Novo lançamento",[["tp","Tipo","s",[["entrada","Entrada"],["saida","Saída"]]],["v","Valor (R$)","n"],["d","Descrição"],["cat","Categoria"]],{},function(o){if(!o.d||!o.v)return toast("Informe descrição e valor.");
var id=uid();FS.setDoc(dref("cash",id),{ts:id,tp:o.tp,v:o.v,d:o.d,cat:o.cat,dt:hoje()}).catch(fail);X();R()})};
A.dl=function(i){if(confirm("Excluir este lançamento?")){FS.deleteDoc(dref("cash",i)).catch(fail);R()}};
A.su=function(){F("Criar administrador",[["n","Seu nome"],["u","Usuário (login)"],["p","Senha (mínimo 6 caracteres)"]],{},function(o){var un=cleanU(o.u);if(!o.n||!un)return toast("Informe nome e usuário (letras, números, ponto, - ou _).");if(o.p.length<6)return toast("A senha precisa ter ao menos 6 caracteres.");
BUSY=true;toast("Criando…");var em=mkEm();
AU.createUserWithEmailAndPassword(auth,em,o.p).then(function(c){var b=FS.writeBatch(fdb);b.set(dref("meta","setup"),{done:true});b.set(dref("users",c.user.uid),{n:o.n,u:un,r:"admin",em:em});b.set(dref("logins",un),{em:em});return b.commit().then(function(){BUSY=false;X();enter(c.user)})}).catch(function(e){BUSY=false;AU.signOut(auth);fail(e)})})};


A.ss=function(i,v){setS(i,v);R();A.od(i)};
A.po=function(i){var o=g(DB.ord,i),n=String(o.id).slice(-4),R=["PEDIDO #"+n,"","Cliente: "+o.cn,"Data: "+o.dt,"Entrega: "+fd(o.de),"Status: "+o.s,"",pR("Item",40)+pL("Qtd",5)+pL("Preço",14)+pL("Subtotal",16),"-".repeat(75)];
o.items.forEach(function(x){R.push(pR(x.n,40)+pL(x.q,5)+pL(money(x.pr),14)+pL(money(x.q*x.pr),16))});
R.push("-".repeat(75));if(o.acr)R.push(pL("Acréscimo"+(o.acd?" ("+o.acd+")":"")+": +"+money(o.acr),75));if(o.disc)R.push(pL("Desconto: -"+money(o.disc),75));R.push(pL("TOTAL: "+money(tot(o)),75));if(o.obs){R.push("");wrapL("Obs.: "+o.obs,75).forEach(function(l){R.push(l)})}
dl("pedido-"+n+".pdf",pdf(R))};
A.bk=function(){P("Backup","",'<p class="m">Copie este texto e guarde em local seguro (notas, e-mail ou nuvem). Para restaurar, use Restaurar backup.</p><textarea id="bt" rows="10" readonly>'+esc(JSON.stringify({prods:DB.prods,cust:DB.cust,ord:DB.ord,cash:DB.cash,cats:DB.cats,custos:DB.custos}))+'</textarea>','<button class="bp" data-a="cp">Copiar backup</button>')};
A.cp=function(){var t=$("bt"),ok=false,bad=function(){toast("Não consegui copiar. Segure o texto para copiar.")};t.focus();t.select();try{t.setSelectionRange(0,1e9)}catch(e){}try{ok=document.execCommand("copy")}catch(e){}
if(ok)return toast("Copiado.");try{navigator.clipboard.writeText(t.value).then(function(){toast("Copiado.")},bad)}catch(e){bad()}};
A.sn=function(){Share.share({text:$("bt").value}).catch(function(){})};
A.rs=function(){P("Restaurar backup","",'<p class="m">Cole o texto do backup. Isso substitui todos os dados atuais.</p><textarea id="bt" rows="10"></textarea>','<button class="bp" data-a="rs2">Restaurar</button>')};

/* ===== NOVAS FUNCIONALIDADES (v2) ===== */
var RU=0,SC=null,SPF={k:"hoje",a:"",b:""},RF={m:"v",a:"",b:"",g:"d",u:""},AF={u:"",t:"",n:"",d1:"",d2:""},OE=null,PK=null,PQ="",ogrp="cri",MAXI=16;
IC.check='<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>';
T.sep="Separação e Produção";T.rel="Relatórios";T.aud="Histórico de atividades";
var BAN='<div class="c" style="border-color:#d0665a"><b>Regras do Firestore desatualizadas</b><div class="m">Publique o arquivo firestore.rules no Firebase para liberar separação, histórico e auditoria.</div></div>';
function pad(n){return(n<10?"0":"")+n}
function isoD(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function todayI(){return isoD(new Date())}
function addD(i,n){var p=i.split("-");return isoD(new Date(+p[0],+p[1]-1,+p[2]+n))}
function fd(i){if(!i)return"a definir";var p=i.split("-");return p[2]+"/"+p[1]+"/"+p[0]}
function fdw(i){var p=i.split("-");return["dom","seg","ter","qua","qui","sex","sáb"][new Date(+p[0],+p[1]-1,+p[2]).getDay()]+" "+p[2]+"/"+p[1]}
function cday(o){return isoD(new Date(Math.floor(o.id/10)))}
function fdt(ts){return new Date(ts).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}).replace(",","")}
function qf(n){return String(Math.round((n||0)*1000)/1000).replace(".",",")}
function rq(n){return Math.round((n||0)*1000)/1000}
function num(i){return String(i).slice(-4)}
function pn(p){return p.n+(p.ap?" — "+p.ap:"")}
function iap(x){if(x.ap!=null)return x.ap;var p=g(DB.prods,x.pid);return p&&p.ap||""}
function pimg(pid){var p=g(DB.prods,pid);return p&&p.img||""}
function thumb(s){return s?'<img class="av" alt="" src="'+s+'">':'<div class="av">'+ic("box")+'</div>'}
function nrm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim()}
function slug(s){return nrm(s).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function act(p){return p.at!==false}
function cln(o){var r={};Object.keys(o).forEach(function(k){if(o[k]!==undefined)r[k]=o[k]});return r}
function chg(f,o,n){return{f:f,o:String(o==null?"":o).slice(0,200),n:String(n==null?"":n).slice(0,200)}}
function bar(p,h){return'<div style="height:'+(h||8)+'px;border-radius:99px;background:var(--ln);overflow:hidden;margin:8px 0"><div style="height:100%;width:'+Math.max(0,Math.min(100,p))+'%;background:var(--gn)"></div></div>'}
function card(l,v,c){return'<div class="c"><div class="m">'+l+'</div><b class="big'+(c?" "+c:"")+'">'+v+'</b></div>'}
function sec_n(t){return'<div class="m" style="margin:16px 2px 8px"><b>'+t+'</b></div>'}
function csv(rows){return rows.map(function(r){return r.map(function(c){c=String(c==null?"":c);return/[;"\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(";")}).join("\r\n")}
function dlCsv(name,rows){dl(name,new TextEncoder().encode("\ufeff"+csv(rows)))}
function batchOps(ops,done){var k=0;(function nx(){if(k>=ops.length){if(done)done();return}var b=FS.writeBatch(fdb);ops.slice(k,k+15).forEach(function(f){f(b)});k+=15;b.commit().then(nx).catch(fail)})()}
/* auditoria e movimentações: gravadas no mesmo lote da ação */
function aud(b,a,t,d,o){o=o||{};b.set(dref("audit",uid()),cln({ts:Date.now(),uid:me.id,un:me.n,a:a,t:t,d:String(d).slice(0,300),ref:o.ref==null?undefined:String(o.ref),num:o.num,ch:o.ch&&o.ch.length?o.ch.slice(0,12):undefined}))}
function mov(b,tp,items,o){o=o||{};b.set(dref("mov",uid()),cln({ts:Date.now(),tp:tp,items:items.slice(0,20),oid:o.oid==null?undefined:String(o.oid),num:o.num,note:o.note,uid:me.id,un:me.n}))}
SPF.a=SPF.b=todayI();RF.b=todayI();RF.a=addD(todayI(),-6);
SRT.prods=nm;SRT.cats=nm;SRT.custos=function(){return 0};
SRT.sep=function(){return 0};SRT.audit=SRT.mov=function(a,b){return(b.ts||0)-(a.ts||0)};
/* ----- estoque: reservado / necessário ----- */
function resv(pid){var s=0;DB.ord.forEach(function(o){if(o.s=="pendente"||o.s=="pago")o.items.forEach(function(x){if(x.pid==pid)s+=x.q})});return rq(s)}
function vend(pid){var s=0;DB.ord.forEach(function(o){if(o.s!="cancelado")o.items.forEach(function(x){if(x.pid==pid)s+=x.q})});return rq(s)}
function n2(v){return(+v||0).toFixed(2).replace(".",",")}

/* ===== v3: preferências, custos, categorias, favoritos ===== */
var PF={fs:"n",fav:[]},FSZ={p:"14px",n:"16px",g:"19px",x:"22px"},GEN="cg",GENDONE=0,PT="all",PSO="az",PTOP={m:{},top:[]},KQ="",KNEW=null,IGS={};
IC.gear='<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>';
IC.cat='<path d="M4 6h16M4 12h16M4 18h10"/>';IC.shield='<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>';
T.cfg="Configurações";T.cat="Categorias";T.perm="Permissões";
function pf(s){s=String(s==null?"":s).trim().replace(/\s/g,"").replace(/^R\$/,"");if(!s)return NaN;if(s.indexOf(",")>=0)s=s.replace(/\./g,"").replace(",",".");var n=Number(s);return isFinite(n)?n:NaN}
function fm(n){return isFinite(n)?(+n).toFixed(2).replace(".",","):""}
function r2(n){return Math.round((+n||0)*100)/100}
function catName(p){var c=p.catId&&g(DB.cats,p.catId);return c?c.n:(p.cat||"")}
function catLabel(id,v){var c=id&&g(DB.cats,id);return c?c.n:(v&&v.cat?v.cat+" (escolha uma categoria)":"Sem categoria")}
function catByName(n){var k=nrm(n);return DB.cats.filter(function(c){return nrm(c.n)==k})[0]}
function catUse(id){return DB.prods.filter(function(p){return p.catId==id}).length}
function newCatId(n){var id="cat_"+slug(n);if(!slug(n)||g(DB.cats,id))id+="_"+uid();return id}
function cost(pid){return g(DB.custos,pid)}
/* tamanho da fonte e favoritos: por usuário (Firestore + cópia local) */
function pfKey(){return"adminloja_pf_"+(me?me.id:"x")}
function applyFs(){document.documentElement.style.fontSize=FSZ[PF.fs]||FSZ.n}
function loadPF(){var o=null;try{o=JSON.parse(localStorage.getItem(pfKey()))}catch(e){}PF={fs:o&&FSZ[o.fs]?o.fs:"n",fav:o&&Array.isArray(o.fav)?o.fav:[]};applyFs()}
function savePF(){try{localStorage.setItem(pfKey(),JSON.stringify(PF))}catch(e){}if(me)FS.setDoc(dref("prefs",me.id),{fs:PF.fs,fav:PF.fav,ts:Date.now()}).catch(function(){})}
function subPrefs(){unsubs.push(FS.onSnapshot(dref("prefs",me.id),function(s){if(!s.exists())return;var o=s.data();PF={fs:FSZ[o.fs]?o.fs:PF.fs,fav:Array.isArray(o.fav)?o.fav:PF.fav};try{localStorage.setItem(pfKey(),JSON.stringify(PF))}catch(e){}applyFs();refresh()},function(){}))}
A.fz=function(k){if(!FSZ[k])return;PF.fs=k;applyFs();savePF();R()};
/* cliente genérico (cadastro fixo, criado uma única vez) */
function ensureGen(){if(GENDONE||!me||!G()||!ready())return;GENDONE=1;if(!g(DB.cust,GEN))FS.setDoc(dref("cust",GEN),{n:"Cliente não identificado",t:"",e:"",a:"",o:"Cadastro genérico para vendas sem identificação.",gen:true}).catch(function(){GENDONE=0})}
/* mais vendidos: últimos 30 dias, sem cancelados, por quantidade + frequência */
function topMap(){var lim=Date.now()-30*864e5,m={};DB.ord.forEach(function(o){if(o.s=="cancelado"||Math.floor(o.id/10)<lim)return;o.items.forEach(function(x){var r=m[x.pid]||(m[x.pid]={q:0,f:0});r.q+=x.q;r.f++})});
var ks=Object.keys(m),mq=0,mf=0;ks.forEach(function(k){mq=Math.max(mq,m[k].q);mf=Math.max(mf,m[k].f)});ks.forEach(function(k){m[k].s=(m[k].q/(mq||1)+m[k].f/(mf||1))/2});
return{m:m,top:ks.filter(function(k){var p=g(DB.prods,k);return p&&act(p)}).sort(function(a,b){return m[b].s-m[a].s}).slice(0,15)}}

/* ----- produtos ----- */
L.prod=function(){var q=nrm(Q),l=DB.prods.filter(function(p){return!q||nrm(pn(p)+" "+catName(p)+" "+(p.sku||"")).indexOf(q)>=0}),last,h="";
l=l.slice().sort(function(a,b){return String(catName(a)).localeCompare(String(catName(b)))||nm(a,b)});
l.forEach(function(p){var rs=resv(p.id),cn=catName(p);if(cn!==last){last=cn;h+='<div class="m" style="margin:14px 2px 8px"><b>'+esc(last||"Sem categoria")+'</b></div>'}
h+='<div class="c r'+(G()?' tap':'')+'"'+(G()?' data-a="np" data-i="'+p.id+'"':'')+(act(p)?'':' style="opacity:.55"')+'><div class="it">'+thumb(p.img)+'<div><b>'+esc(pn(p))+'</b><div class="m">'+brl(p.pr)+' · estoque '+qf(p.st)+(rs?' · reservado '+qf(rs):'')+(p.sku?' · '+esc(p.sku):'')+(act(p)?'':' · inativo')+'</div>'+''+'</div></div><div style="display:flex">'+(G()?'<button class="cb" data-a="mv" data-i="'+p.id+'" aria-label="Movimentações">'+ic("list")+'</button>':'')+'<button class="cb" data-a="wp" data-i="'+p.id+'" aria-label="WhatsApp">'+ic("chat")+'</button></div></div>'});
return h||empty("Nenhum produto. Toque em + para cadastrar"+".")};
V.prod=function(){return sb("Buscar produto")+''+'<div id="lst">'+L.prod()+'</div>'};
A.np=function(i){var p=i?g(DB.prods,i):{},c0=i?cost(i):null;PH=p.img||"";PB=0;KNEW=null;
var v=Object.assign({},p,{at:p.at===false?"0":"1",site:p.site===false?"0":"1",st:p.st==null?0:p.st,catId:p.catId||"",cu:c0?fm(c0.cu):"",pr:p.pr!=null?fm(p.pr):"",mg:"",mk:"",lc:""});
F(i?"Editar produto":"Novo produto",[["n","Nome"],["catId","Categoria","k"],["ap","Unidade de venda (maço, unidade, pacote, bandeja, kg…)"],["sku","Peso / Quantidade / Embalagem (ex.: 200 g, 1 kg, pacote de 10 un.)"],["cu","Preço de custo (R$) — uso interno","m"],["pr","Preço de venda (R$)","m"],["mg","Margem de lucro (%)","m"],["mk","Markup (%)","m"],["lc","Lucro por unidade (R$)","r"],["cm","","h"],["st","Estoque","n"],["at","Status","s",[["1","Ativo"],["0","Inativo"]]],["site","Mostrar no site","s",[["1","Sim"],["0","Não"]]],["d","Descrição","t"],["img","Foto","f"]],v,function(o){
if(!o.n)return toast("Informe o nome.");if(isNaN(o.pr)||o.pr<0)return toast("Informe um preço de venda válido.");
var rawc=$("f_cu").value.trim();if(rawc&&(isNaN(o.cu)||o.cu<0))return toast("Custo inválido.");
var hasCu=!!rawc,pr=r2(o.pr),cu=hasCu?r2(o.cu):null,s=rq(Math.max(0,o.st)),b=FS.writeBatch(fdb),cat=null,r,nme=pn({n:o.n,ap:o.ap});
if(o.catId&&o.catId!="-")cat=g(DB.cats,o.catId)||(KNEW&&KNEW.id==o.catId?KNEW:null);
r={n:o.n,ap:o.ap,sku:o.sku,pr:pr,at:o.at!="0",site:o.site!="0",d:o.d};if(cat){r.catId=cat.id;r.cat=cat.n}
if(i){var c1=[],c2=[],c3=[],c4=[],df=function(a,f,x,y){if(String(x==null?"":x)!=String(y==null?"":y))a.push(chg(f,x,y))};
if(o.catId=="-"){r.catId=FS.deleteField();r.cat=""}
df(c1,"nome",p.n,o.n);df(c1,"categoria",catName(p),cat?cat.n:o.catId=="-"?"":catName(p));df(c1,"unidade de venda",p.ap,o.ap);df(c1,"peso/embalagem",p.sku,o.sku);df(c1,"status",act(p)?"ativo":"inativo",r.at?"ativo":"inativo");df(c1,"mostrar no site",p.site===false?"não":"sim",r.site?"sim":"não");df(c1,"descrição",p.d,o.d);if((p.img||"")!=(o.img||""))c1.push(chg("imagem","","alterada"));
df(c2,"preço",brl(p.pr),brl(pr));
var dl2=rq(s-p.st);if(Math.abs(dl2)>1e-9){r.st=FS.increment(dl2);df(c3,"estoque",qf(p.st),qf(s));mov(b,"ajuste",[{pid:i,n:pn(p),q:dl2}],{note:"Ajuste manual"})}
var oc0=c0?c0.cu:null;if(hasCu&&oc0!==cu){b.set(dref("custos",i),{cu:cu,ts:Date.now()});df(c4,"custo",oc0==null?"":brl(oc0),brl(cu))}else if(!hasCu&&c0){b.delete(dref("custos",i));df(c4,"custo",brl(c0.cu),"")}
r.img=o.img||FS.deleteField();b.update(dref("prods",i),r);
if(c1.length)aud(b,"produto_alterado","produto","Produto alterado: "+nme,{ref:i,ch:c1});
if(c2.length)aud(b,"preco_alterado","produto","Preço alterado: "+nme,{ref:i,ch:c2});
if(c4.length)aud(b,"custo_alterado","produto","Custo alterado: "+nme,{ref:i,ch:c4});
if(c3.length)aud(b,"estoque_ajuste","estoque","Ajuste manual de estoque: "+nme,{ref:i,ch:c3})}
else{var id=uid();r.st=s;if(o.img)r.img=o.img;b.set(dref("prods",id),r);if(hasCu)b.set(dref("custos",id),{cu:cu,ts:Date.now()});aud(b,"produto_criado","produto","Produto criado: "+nme+" · "+brl(pr)+" · estoque "+qf(s),{ref:id});if(s>0)mov(b,"entrada",[{pid:id,n:nme,q:s}],{note:"Estoque inicial"})}
b.commit().catch(fail);X();R()},i?["dp",i]:0);A.cal("init")};
/* custo, preço, margem e markup: o campo editado é a referência do cálculo */
A.cal=function(src){var el=function(k){return $("f_"+k)},cm=el("cm"),cu=pf(el("cu").value),pr=pf(el("pr").value),mg=pf(el("mg").value),mk=pf(el("mk").value),set=function(k,v){if(src!=="f_"+k)el(k).value=v},bad=function(m){cm.textContent=m;cm.style.color="#d0665a"};
cm.textContent="";cm.style.color="";
if(src=="f_mg"){if(el("mg").value.trim()==="")return;if(isNaN(mg))return bad("Margem inválida.");if(mg>=100)return bad("A margem precisa ser menor que 100%.");if(isNaN(cu)||cu<=0)return bad("Informe o custo (maior que zero) para calcular o preço pela margem.");pr=r2(cu/(1-mg/100));if(!isFinite(pr)||pr<0)return bad("Não foi possível calcular o preço.");set("pr",fm(pr))}
else if(src=="f_mk"){if(el("mk").value.trim()==="")return;if(isNaN(mk))return bad("Markup inválido.");if(mk<=-100)return bad("O markup precisa ser maior que −100%.");if(isNaN(cu)||cu<=0)return bad("Informe o custo (maior que zero) para calcular o preço pelo markup.");pr=r2(cu*(1+mk/100));if(!isFinite(pr)||pr<0)return bad("Não foi possível calcular o preço.");set("pr",fm(pr))}
if(!el("cu").value.trim()||!el("pr").value.trim()){set("lc","");if(src!="f_mg")set("mg","");if(src!="f_mk")set("mk","");return}
if(isNaN(cu)||isNaN(pr))return bad("Valor inválido.");if(cu<0||pr<0)return bad("Valores negativos não são permitidos.");
var lc=pr-cu;set("lc",fm(lc));set("mg",pr>0?fm(lc/pr*100):"");set("mk",cu>0?fm(lc/cu*100):"");
if(pr==0)cm.textContent="Preço de venda zero: a margem não se aplica.";else if(cu==0)cm.textContent="Custo zero: o markup não se aplica."};
/* seletor de categoria dentro do formulário do produto */
function kl(){var q=nrm(KQ),l=DB.cats.filter(function(c){return!q||nrm(c.n).indexOf(q)>=0}).sort(nm);return'<div class="c tap" data-a="ks" data-i="-" style="padding:12px;margin-bottom:8px"><b>Sem categoria</b></div>'+l.map(function(c){return'<div class="c r tap" data-a="ks" data-i="'+c.id+'" style="padding:12px;margin-bottom:8px"><b>'+esc(c.n)+'</b><span class="m">'+catUse(c.id)+' produto(s)</span></div>'}).join("")}
A.kp=function(){KQ="";$("sh").innerHTML='<div class="sc"><b class="h" style="font-size:1.2rem">Categoria</b><div class="sb" style="margin-top:12px">'+ic("search")+'<input data-kq="1" placeholder="Buscar categoria" autocomplete="off"></div><div id="kl" style="max-height:40vh;overflow:auto;margin-top:8px">'+kl()+'</div><button class="bp ac" data-a="kn">+ Criar nova categoria</button><button class="bp ol" data-a="x2">Fechar</button></div>';$("sh").hidden=false};
A.ks=function(id){$("f_catId").value=id;$("f_kb").textContent=id=="-"?"Sem categoria":((g(DB.cats,id)||KNEW||{}).n||"");A.x2()};
A.kn=function(){$("sh").innerHTML='<div class="sc"><b class="h" style="font-size:1.2rem">Nova categoria</b><label>Nome<input id="f_kn" autocomplete="off"></label><button class="bp" data-a="kc">Criar</button><button class="bp ol" data-a="kp">Voltar</button></div>'};
A.kc=function(){var n=$("f_kn").value.trim().replace(/\s+/g," ");if(!n)return toast("Informe o nome.");var ex=catByName(n);if(ex){if(confirm("Já existe a categoria «"+ex.n+"». Usar a existente?"))A.ks(ex.id);return}
var id=newCatId(n),b=FS.writeBatch(fdb);b.set(dref("cats",id),{n:n,ts:Date.now()});aud(b,"categoria_criada","produto","Categoria criada: "+n,{ref:id});b.commit().catch(fail);KNEW={id:id,n:n};$("f_catId").value=id;$("f_kb").textContent=n;A.x2()};
A.dp=function(i){var p=g(DB.prods,i);if(confirm("Excluir este produto?")){var b=FS.writeBatch(fdb);b.delete(dref("prods",i));aud(b,"produto_excluido","produto","Produto excluído: "+pn(p)+" · "+brl(p.pr)+" · estoque "+qf(p.st),{ref:i});b.commit().catch(fail);X();R()}};
A.wp=function(i){var p=g(DB.prods,i);wa("*"+pn(p)+"*\n"+brl(p.pr)+(p.sku?" · "+p.sku:"")+(p.d?"\n"+p.d:""))};
/* movimentações de estoque de um produto */
var MVL={venda:"Venda",cancelamento:"Cancelamento",reativacao:"Reativação",exclusao:"Pedido excluído",ajuste:"Ajuste manual",entrada:"Entrada",edicao:"Pedido alterado"};
A.mv=function(i){var p=g(DB.prods,i);if(!p)return;var fut=0;DB.ord.forEach(function(o){if(o.s!="cancelado"&&o.de&&o.de>=todayI())o.items.forEach(function(x){if(x.pid==i)fut+=x.q})});
var ml=DB.mov.filter(function(m){return m.items.some(function(x){return x.pid==i})}).slice(0,40);
P(esc(pn(p)),"Movimentações de estoque",'<div class="gr">'+card("Estoque atual",qf(p.st))+card("Reservado (pedidos em aberto)",qf(resv(i)))+card("Vendido (total)",qf(vend(i)))+card("A produzir (entrega de hoje em diante)",qf(rq(fut)))+'</div><p class="m">Regra: o estoque baixa quando o pedido é <b>criado</b> e volta se o pedido for cancelado ou excluído. Separar e entregar não mexem no estoque.</p>'+sec_n("Histórico")+(ml.length?ml.map(function(m){var x=m.items.filter(function(y){return y.pid==i})[0];return'<div class="c r" style="padding:12px"><div><b>'+(MVL[m.tp]||m.tp)+(m.num?' · #'+m.num:'')+'</b><div class="m">'+fdt(m.ts)+' · '+esc(m.un||"")+(m.note?' · '+esc(m.note):'')+'</div></div><b class="'+(x.q>0?"gn":"")+'">'+(x.q>0?"+":"")+qf(x.q)+'</b></div>'}).join(""):empty("Nenhuma movimentação registrada.")),'<button class="bp" data-a="en" data-i="'+i+'">Registrar entrada de estoque</button>')};
A.en=function(i){var p=g(DB.prods,i);F("Entrada de estoque",[["q","Quantidade recebida / produzida","n"],["note","Observação"]],{},function(o){if(o.q<=0)return toast("Informe a quantidade.");var q=rq(o.q),b=FS.writeBatch(fdb);b.update(dref("prods",i),{st:FS.increment(q)});mov(b,"entrada",[{pid:i,n:pn(p),q:q}],{note:o.note});aud(b,"estoque_entrada","estoque","Entrada de estoque: "+pn(p)+" +"+qf(q),{ref:i,ch:[chg("estoque",qf(p.st),qf(p.st+q))]});b.commit().catch(fail);X();R()})};
/* catálogo (PDF e WhatsApp) com categorias, embalagem e só produtos ativos */
A.pc=function(){var l=DB.prods.filter(act).sort(function(a,b){return String(catName(a)).localeCompare(String(catName(b)))||nm(a,b)});if(!l.length)return toast("Cadastre produtos primeiro.");var R2=["CATÁLOGO DE PRODUTOS","Gerado em "+hoje(),""],last;
l.forEach(function(p){var cn=catName(p);if(cn!==last){last=cn;R2.push("");R2.push((last||"Sem categoria").toUpperCase());R2.push(pR("Produto",42)+pR("Embalagem",16)+pL("Preço",10)+pL("Estoque",7));R2.push("-".repeat(75))}R2.push(pR(pn(p),41)+" "+pR(p.sku||"",16)+pL(money(p.pr),10)+pL(qf(p.st),7))});dl("catalogo.pdf",pdf(R2))};
A.wk=function(){var l=DB.prods.filter(act).sort(function(a,b){return String(catName(a)).localeCompare(String(catName(b)))||nm(a,b)});if(!l.length)return toast("Cadastre produtos primeiro.");var t="*Catálogo*",last;l.forEach(function(p){var cn=catName(p);if(cn!==last){last=cn;t+="\n\n*"+(last||"Outros")+"*"}t+="\n• "+pn(p)+(p.sku?" ("+p.sku+")":"")+" — "+brl(p.pr)+(p.st<=0?" (esgotado)":"")});wa(t)};

/* ----- separação derivada (usada na lista e no detalhe do pedido) ----- */
function sepData(a,b){var days={};DB.ord.forEach(function(o){if(o.s=="cancelado"||!o.de||o.de<a||o.de>b)return;var d=days[o.de]||(days[o.de]={dt:o.de,ords:[],prods:{}});d.ords.push(o);o.items.forEach(function(x){var r=d.prods[x.pid]||(d.prods[x.pid]={pid:x.pid,n:x.n,ap:iap(x),need:0,q:0,lines:[]});r.need=rq(r.need+x.q);r.lines.push({o:o,q:x.q})})});
DB.sep.forEach(function(s){var d=days[s.dt],r=d&&d.prods[s.pid];if(r){r.q=s.q;r.by=s.un;r.at=s.ts}});return days}
function pst(r){return r.q>=r.need-1e-9?"concluída":r.q>0?"em andamento":"pendente"}
function sdAll(){return SC||(SC=sepData("0000-00-00","9999-99-99"))}
function ordSep(o){if(!o.de||o.s=="cancelado")return"";var d=sdAll()[o.de];if(!d)return"";var done=0,any=0;o.items.forEach(function(x){var r=d.prods[x.pid];if(r){if(pst(r)=="concluída")done++;if(r.q>0)any++}});return done==o.items.length?"separado":any?"em separação":"a separar"}
function late(o){return!!o.de&&o.de<todayI()&&o.s!="entregue"&&o.s!="cancelado"}
/* ----- lista de pedidos ----- */
function oc(o){var sp=ordSep(o);return'<div class="c tap" data-a="od" data-i="'+o.id+'"><div class="r"><div class="it"><div><b>'+esc(o.cn)+'</b><div class="m">'+o.dt+' · '+o.items.length+' item(ns)'+(o.un?' · '+esc(o.un):'')+(o.src=="site"?' · site':'')+'</div><div class="m">Entrega: '+(o.de?fd(o.de):"a definir")+(late(o)?' · <b style="color:#d0665a">atrasado</b>':'')+(sp?' · '+sp:'')+'</div></div></div><div style="text-align:right"><b class="gn">'+brl(tot(o))+'</b><div style="margin-top:4px"><span class="pill st-'+o.s+'">'+o.s+'</span></div></div></div></div>'}
L.ord=function(){var q=Q.toLowerCase(),l=DB.ord.filter(function(o){return(flt=="todos"||o.s==flt)&&(!q||o.cn.toLowerCase().indexOf(q)>=0||num(o.id).indexOf(q)>=0||(o.un||"").toLowerCase().indexOf(q)>=0)});
if(!l.length)return empty("Nenhum pedido aqui.");
if(ogrp!="ent")return l.slice().reverse().map(oc).join("");
l=l.slice().sort(function(a,b){return(a.de||"9999").localeCompare(b.de||"9999")||a.id-b.id});var last,h="";
l.forEach(function(o){if(o.de!==last){last=o.de;h+='<div class="m" style="margin:14px 2px 8px"><b>'+(o.de?fdw(o.de)+(o.de==todayI()?" · hoje":o.de<todayI()?" · anterior":""):"Entrega a definir")+'</b></div>'}h+=oc(o)});return h};
V.ord=function(){return sb("Buscar pedido")+'<div class="tb">'+["todos"].concat(ST).map(function(s){return'<button class="chip'+(flt==s?" on":"")+'" data-a="fl" data-i="'+s+'">'+s+'</button>'}).join("")+'</div><div class="tb">'+[["cri","Por criação"],["ent","Por entrega"]].map(function(x){return'<button class="chip'+(ogrp==x[0]?" on":"")+'" data-a="og" data-i="'+x[0]+'">'+x[1]+'</button>'}).join("")+'</div><div id="lst">'+L.ord()+'</div>'};
A.og=function(k){ogrp=k;R()};
/* ----- novo pedido / editar pedido ----- */
A.no=function(){if(!DB.prods.some(act))return toast("Cadastre produtos antes de criar um pedido.");OE=null;WEBID=null;tmp=[];ofm()};
A.eo=function(i){var o=g(DB.ord,i);if(!o||!G())return;if(o.s=="cancelado")return toast("Pedido cancelado não pode ser editado.");WEBID=null;OE=o.id;tmp=o.items.map(function(x){return Object.assign({},x)});ofm(o)};
function ofm(eo,pre){var cid=eo?eo.cid:(pre?pre.cid:GEN);P(eo?"Editar pedido":pre?"Aprovar pedido do site":"Novo pedido",eo?"#"+num(eo.id):pre?pre.cod:"",'<label>Cliente<select id="f_c"><option value="'+GEN+'"'+(cid==GEN?" selected":"")+'>Cliente não identificado</option><option value=""'+(eo&&!eo.cid||pre&&!pre.cid?" selected":"")+'>Digitar nome (avulso)</option>'+DB.cust.filter(function(c){return c.id!=GEN}).map(function(c){return'<option value="'+c.id+'"'+(eo&&eo.cid==c.id||pre&&pre.cid==c.id?" selected":"")+'>'+esc(c.n)+'</option>'}).join("")+'</select></label><label><input id="f_cn" placeholder="Nome do cliente (se for avulso)" value="'+esc(eo&&!eo.cid?eo.cn:pre&&!pre.cid?pre.cn:"")+'"></label><label>Data de entrega (opcional)<input id="f_de" type="date" value="'+(eo&&eo.de||pre&&pre.de||"")+'"></label><div class="m" style="margin:-6px 0 12px">Sem data, o pedido aparece como “Entrega a definir”. <button type="button" class="chip" data-a="cde" style="margin-left:6px">Limpar data</button></div><div class="r" style="margin-bottom:8px"><b class="h" style="font-size:1.2rem">Itens</b><button class="chip on" data-a="ni" style="display:flex;gap:6px;align-items:center">'+ic("plus")+' item</button></div><div id="it"></div><label>Desconto (R$)<input id="f_d" type="number" step="any" min="0" inputmode="decimal" placeholder="0,00" value="'+(eo&&eo.disc?eo.disc:"")+'"></label><label>Acréscimos (R$)<input id="f_acr" type="number" step="any" min="0" inputmode="decimal" placeholder="0,00" value="'+(eo&&eo.acr?eo.acr:"")+'"></label><label>Descrição do acréscimo<input id="f_acd" placeholder="Ex.: Taxa de entrega" value="'+esc(eo?eo.acd||"":"")+'"></label><label>Observações<textarea id="f_o" rows="3" placeholder="Observações do pedido">'+esc(eo?eo.obs:pre?pre.obs:"")+'</textarea></label>'+(eo?'':'<label>Status<select id="f_s">'+ST.map(function(s){return'<option value="'+s+'">'+cap(s)+'</option>'}).join("")+'</select></label>')+'<p class="m">Criado por: '+esc(eo?eo.un||"—":me.n)+'</p>',
'<div class="m" id="tbk" style="margin-bottom:6px"></div><div class="r" style="margin-bottom:10px"><span class="m">Total</span><b class="big gn" id="tt">R$ 0,00</b></div><button class="bp" data-a="so">'+(eo?"Salvar alterações":"Salvar pedido")+'</button>');ri()}
A.cde=function(){$("f_de").value=""};
function ri(){if(!$("it"))return;var s=tmp.reduce(function(a,i){return a+i.q*i.pr},0),d=parseFloat($("f_d")&&$("f_d").value)||0,ac=parseFloat($("f_acr")&&$("f_acr").value)||0;
$("it").innerHTML=tmp.length?tmp.map(function(i,k){return'<div class="c r" style="padding:12px"><span class="it">'+thumb(pimg(i.pid))+'<span>'+qf(i.q)+' x '+esc(i.n)+'<div class="m">'+brl(i.pr)+' × '+qf(i.q)+' = <b>'+brl(i.q*i.pr)+'</b></div></span></span><button class="chip" data-a="rm" data-i="'+k+'">Remover</button></div>'}).join(""):'<p class="m" style="margin:0 0 16px">Nenhum item.</p>';
$("tbk").textContent="Produtos "+brl(s)+(ac?" · Acréscimos +"+brl(ac):"")+(d?" · Desconto −"+brl(d):"");$("tt").textContent=brl(s+ac-d)}
A.rm=function(k){tmp.splice(k,1);ri()};
/* seleção de produtos: favoritos, mais vendidos, categorias, busca e ordem alfabética */
function pcard(p,top){var fv=PF.fav.indexOf(p.id)>=0;return'<div class="c r tap" data-a="pk" data-i="'+p.id+'" style="padding:10px;margin-bottom:8px'+(PK==p.id?';border-color:var(--ac);border-width:2px':'')+'"><div class="it" style="flex:1;min-width:0">'+thumb(p.img)+'<div style="min-width:0"><b>'+esc(pn(p))+'</b><div class="m">'+brl(p.pr)+' · estoque '+qf(p.st)+(p.sku?' · '+esc(p.sku):'')+'</div></div></div><div style="display:flex;align-items:center;gap:2px">'+(top?'<span aria-label="Mais vendido">🔥</span>':'')+'<button type="button" class="cb" data-a="fv" data-i="'+p.id+'" aria-label="Favorito" style="font-size:1.6rem;line-height:1;color:'+(fv?'#e0a526':'var(--mu)')+'">'+(fv?'★':'☆')+'</button></div></div>'}
function plist(){var q=nrm(PQ),all=DB.prods.filter(act),h;
if(q)h=all.filter(function(p){return nrm(pn(p)+" "+catName(p)).indexOf(q)>=0});
else if(PT=="fav")h=all.filter(function(p){return PF.fav.indexOf(p.id)>=0});
else if(PT=="top")h=PTOP.top.map(function(k){return g(DB.prods,k)});
else if(PT=="all")h=all.slice();
else h=all.filter(function(p){return p.catId==PT});
if(!(PT=="top"&&!q))h.sort(PSO=="vend"?function(a,b){return((PTOP.m[b.id]||{s:0}).s)-((PTOP.m[a.id]||{s:0}).s)||nm(a,b)}:nm);
return h}
function pl(){var l=plist(),n=l.length;return n?l.slice(0,80).map(function(p){var k=PTOP.top.indexOf(p.id);return pcard(p,k>=0&&k<8)}).join("")+(n>80?'<p class="m">Mostrando 80 de '+n+'. Use a busca para filtrar.</p>':''):empty(PQ?"Nenhum produto encontrado.":PT=="fav"?"Nenhum favorito ainda. Toque em ☆ para marcar.":PT=="top"?"Ainda sem vendas nos últimos 30 dias.":"Nenhum produto.")}
function ptabs(){var cs=DB.cats.filter(function(c){return DB.prods.some(function(p){return act(p)&&p.catId==c.id})}).sort(nm),t=[["fav","★ Favoritos"],["top","🔥 Mais vendidos"],["all","Todos"]].concat(cs.map(function(c){return[c.id,c.n]}));
return t.map(function(x){return'<button class="chip'+(PT==x[0]?" on":"")+'" data-a="pt" data-i="'+x[0]+'">'+esc(x[1])+'</button>'}).join("")+'<button class="chip" data-a="pso">'+(PSO=="az"?"Ordem: A–Z":"Ordem: vendas")+'</button>'}
function rpl(){var e=$("pl"),y=e.scrollTop;e.innerHTML=pl();e.scrollTop=y}
A.ni=function(){PK=null;PQ="";PTOP=topMap();PT=PTOP.top.length?"top":"all";$("sh").innerHTML='<div class="sc"><b class="h" style="font-size:1.2rem">Adicionar item</b><div class="sb" style="margin-top:12px">'+ic("search")+'<input data-pq="1" id="pqi" placeholder="Buscar produto" autocomplete="off"></div><div class="tb" id="ptb" style="margin:10px 0 6px">'+ptabs()+'</div><div id="pl" style="max-height:34vh;overflow:auto">'+pl()+'</div><label>Quantidade<input id="f_q" type="number" min="0" step="any" value="1" inputmode="decimal"></label><button class="bp" data-a="ai">Adicionar</button><button class="bp ol" data-a="x2">Cancelar</button></div>';$("sh").hidden=false};
A.pt=function(k){PT=k;PQ="";var e=$("pqi");if(e)e.value="";$("ptb").innerHTML=ptabs();$("pl").innerHTML=pl()};
A.pso=function(){PSO=PSO=="az"?"vend":"az";$("ptb").innerHTML=ptabs();$("pl").innerHTML=pl()};
A.pk=function(i){PK=i;rpl()};
A.pq=function(v){PQ=v;$("pl").innerHTML=pl()};
A.fv=function(i){var k=PF.fav.indexOf(i);if(k>=0)PF.fav.splice(k,1);else PF.fav.push(i);savePF();rpl()};
function oldQ(pid){var eo=OE&&g(DB.ord,OE),s=0;if(eo&&eo.s!="cancelado")eo.items.forEach(function(x){if(x.pid==pid)s+=x.q});return s}
A.ai=function(){var p=PK&&g(DB.prods,PK);if(!p)return toast("Escolha um produto.");var q=rq(parseFloat(String($("f_q").value).replace(",","."))||0);if(q<=0)return toast("Informe a quantidade.");
var x=tmp.filter(function(i){return i.pid==p.id})[0],u=rq((x?x.q:0)+q),av=rq(p.st+oldQ(p.id));
if(u>av+1e-9)return toast("Estoque insuficiente: disponível "+qf(av)+".");
if(!x&&tmp.length>=MAXI)return toast("Máximo de "+MAXI+" produtos diferentes por pedido.");
if(x)x.q=u;else tmp.push({pid:p.id,n:pn(p),q:q,pr:p.pr,ap:p.ap||""});A.x2();ri()};
function isum(l){return l.map(function(x){return qf(x.q)+"x "+x.n}).join("; ")}
A.so=function(){if(!tmp.length)return toast("Adicione ao menos um item.");var de=$("f_de").value||"";
var cid=$("f_c").value,c=cid&&cid!=GEN?g(DB.cust,cid):null,cn=cid==GEN?"Cliente não identificado":c?c.n:$("f_cn").value.trim();if(!cn)return toast("Escolha um cliente ou informe um nome.");
if(de&&de<todayI()&&!confirm("A data de entrega ("+fd(de)+") já passou. Salvar mesmo assim?"))return;
if(acr<0||disc<0)return toast("Desconto e acréscimos não podem ser negativos.");var b=FS.writeBatch(fdb),disc=parseFloat($("f_d").value)||0,acr=r2(parseFloat($("f_acr").value)||0),acd=$("f_acd").value.trim(),obs=$("f_o").value,items=tmp.map(function(i){return{pid:i.pid,n:i.n,q:i.q,pr:i.pr,ap:i.ap||""}}),mv=[],id,o;
if(OE){var eo=g(DB.ord,OE);if(!eo||eo.s=="cancelado")return toast("Pedido não pode mais ser editado.");id=eo.id;var a={},z={},ks;
eo.items.forEach(function(x){a[x.pid]=rq((a[x.pid]||0)+x.q)});items.forEach(function(x){z[x.pid]=rq((z[x.pid]||0)+x.q)});
ks=Object.keys(Object.assign({},a,z)).filter(function(k){return Math.abs((z[k]||0)-(a[k]||0))>1e-9});
if(ks.length>MAXI)return toast("Muitas alterações de uma vez. Edite em duas etapas.");
ks.forEach(function(k){var d=rq((z[k]||0)-(a[k]||0)),nm2=(items.concat(eo.items).filter(function(x){return x.pid==k})[0]||{}).n;if(g(DB.prods,k))b.update(dref("prods",k),{st:FS.increment(-d)});mv.push({pid:k,n:nm2,q:-d})});
o=Object.assign({},eo,{cid:cid,cn:cn,items:items,disc:disc,acr:acr,acd:acd,obs:obs,de:de});
b.update(dref("ord",id),{cid:cid,cn:cn,items:items,disc:disc,acr:acr,acd:acd,obs:obs,de:de,ub:me.n,ut:Date.now()});
if(eo.s=="pago"||eo.s=="entregue")b.set(dref("cash",cashId(id)),cashOf(id,o));
if(mv.length)mov(b,"edicao",mv,{oid:id,num:num(id)});
var ch=[];if(eo.de!=de)ch.push(chg("entrega",fd(eo.de),fd(de)));if(eo.cn!=cn)ch.push(chg("cliente",eo.cn,cn));if(isum(eo.items)!=isum(items))ch.push(chg("itens",isum(eo.items),isum(items)));if((eo.disc||0)!=disc)ch.push(chg("desconto",brl(eo.disc||0),brl(disc)));if((eo.acr||0)!=acr)ch.push(chg("acréscimos",brl(eo.acr||0),brl(acr)));if((eo.acd||"")!=acd)ch.push(chg("descrição do acréscimo",eo.acd,acd));if((eo.obs||"")!=obs)ch.push(chg("observações",eo.obs,obs));if(tot(eo)!=tot(o))ch.push(chg("total",brl(tot(eo)),brl(tot(o))));
aud(b,"pedido_alterado","pedido","Pedido #"+num(id)+" alterado",{ref:id,num:num(id),ch:ch});b.commit().catch(fail);tmp=[];OE=null;X();R();return}
var bad=items.filter(function(i){var p=g(DB.prods,i.pid);return p&&i.q>p.st+1e-9})[0];if(bad&&$("f_s").value!="cancelado")return toast("Sem estoque suficiente de "+bad.n+" (disponível "+qf(g(DB.prods,bad.pid).st)+"). Ajuste a quantidade.");
if(WEBID&&items.length>MAXW)return toast("Máximo de "+MAXW+" produtos diferentes no pedido do site.");
var s=$("f_s").value;id=uid();o={cid:cid,cn:cn,items:items,disc:disc,acr:acr,acd:acd,obs:obs,s:s,dt:hoje(),de:de,uid:me.id,un:me.n,cr:me.com||0};
if(WEBID){var w=g(DB.pedidosweb,WEBID);if(!w)return toast("Pedido do site não encontrado.");o.src="site";o.cod=w.cod;o.wid=WEBID;if(!cid){var nc=String(uid());FS.setDoc(dref("cust",nc),{n:cn,t:w.tel,e:"",a:addrOf(w),o:"Criado a partir do pedido do site "+w.cod}).catch(function(){});o.cid=nc}}
if(s!="cancelado")items.forEach(function(i){b.update(dref("prods",i.pid),{st:FS.increment(-i.q)});mv.push({pid:i.pid,n:i.n,q:-i.q})});
b.set(dref("ord",id),o);if(s=="pago"||s=="entregue")b.set(dref("cash",cashId(id)),cashOf(id,o));
if(mv.length)mov(b,"venda",mv,{oid:id,num:num(id)});
aud(b,"pedido_criado","pedido","Pedido #"+num(id)+" criado para "+cn+" · entrega "+fd(de)+" · "+brl(tot(o)),{ref:id,num:num(id)});
if(WEBID){b.update(dref("pedidosweb",WEBID),{st:"aprovado",oid:String(id),ab:me.n,at:Date.now()});aud(b,"site_aprovado","pedido","Pedido do site "+o.cod+" aprovado → pedido #"+num(id),{ref:id,num:num(id)});WEBID=null;toast("Pedido aprovado e enviado para a separação.")}
b.commit().catch(fail);tmp=[];X();flt="todos";R()};
/* status: pendente / pago / entregue / cancelado (independente da separação) */
function setS(i,v){var o=g(DB.ord,i),old=o.s;if(old==v)return;
if(old=="cancelado"&&o.items.some(function(x){var p=g(DB.prods,x.pid);return p&&p.st<x.q}))return toast("Estoque insuficiente para reativar este pedido.");
var b=FS.writeBatch(fdb),mv=[],st=function(x,n){if(g(DB.prods,x.pid)){b.update(dref("prods",x.pid),{st:FS.increment(n)});mv.push({pid:x.pid,n:x.n,q:n})}};
if(v=="cancelado")o.items.forEach(function(x){st(x,x.q)});
if(old=="cancelado")o.items.forEach(function(x){st(x,-x.q)});
b.update(dref("ord",i),{s:v,ub:me.n,ut:Date.now()});
if(v=="pago"||v=="entregue")b.set(dref("cash",cashId(i)),cashOf(i,o));else b.delete(dref("cash",cashId(i)));
if(mv.length)mov(b,v=="cancelado"?"cancelamento":"reativacao",mv,{oid:i,num:num(i)});
aud(b,v=="cancelado"?"pedido_cancelado":v=="entregue"?"pedido_entregue":old=="cancelado"?"pedido_reativado":"pedido_status","pedido","Pedido #"+num(i)+": "+old+" → "+v,{ref:i,num:num(i),ch:[chg("status",old,v)]});
o.s=v;b.commit().catch(fail)}
A.od=function(i){var o=g(DB.ord,i);if(!o)return;var sp=ordSep(o);
P(esc(o.cn),o.dt+" · #"+num(o.id),(G()?'<select class="pill st-'+o.s+'" data-c="ss" data-i="'+o.id+'">'+ST.map(function(s){return'<option value="'+s+'"'+(s==o.s?" selected":"")+'>'+cap(s)+'</option>'}).join("")+'</select>':'<span class="pill st-'+o.s+'">'+o.s+'</span>')+
'<div class="c" style="margin-top:16px"><div class="r"><span class="m">Entrega</span><b>'+fd(o.de)+(late(o)?' <span style="color:#d0665a">· atrasado</span>':'')+'</b></div>'+(sp?'<div class="r" style="margin-top:8px"><span class="m">Separação</span><b>'+sp+'</b></div>':'')+'<div class="r" style="margin-top:8px"><span class="m">Criado por</span><span>'+esc(o.un||"—")+'</span></div>'+(o.src=="site"?'<div class="r" style="margin-top:8px"><span class="m">Origem</span><span>Site · '+esc(o.cod||"")+'</span></div>':'')+(o.ub?'<div class="r" style="margin-top:8px"><span class="m">Última alteração</span><span>'+esc(o.ub)+(o.ut?' · '+fdt(o.ut):'')+'</span></div>':'')+'</div>'+
'<div class="c"><b class="h" style="font-size:1.1rem">Itens</b>'+o.items.map(function(x){return'<div class="r" style="margin-top:12px"><span class="it">'+thumb(pimg(x.pid))+'<span>'+qf(x.q)+' x '+esc(x.n)+'<div class="m">'+brl(x.pr)+' cada</div></span></span><span>'+brl(x.q*x.pr)+'</span></div>'}).join("")+(o.acr?'<div class="r m" style="margin-top:12px"><span>Acréscimos'+(o.acd?' ('+esc(o.acd)+')':'')+'</span><span>+'+brl(o.acr)+'</span></div>':'')+(o.disc?'<div class="r m" style="margin-top:12px"><span>Desconto</span><span>−'+brl(o.disc)+'</span></div>':'')+'<hr><div class="r"><b>Total</b><b class="big gn">'+brl(tot(o))+'</b></div></div>'+(o.obs?'<p class="m">'+esc(o.obs)+'</p>':'')+
'<button class="bp ac" data-a="wo" data-i="'+o.id+'">'+ic("share")+' Compartilhar no WhatsApp</button><button class="bp ol" data-a="po" data-i="'+o.id+'">'+ic("pdf")+' Gerar PDF</button>'+(G()&&o.s!="cancelado"?'<button class="bp ol" data-a="eo" data-i="'+o.id+'">Editar pedido</button>':'')+(G()&&o.cid==GEN?'<button class="bp ol" data-a="ig" data-i="'+o.id+'">Identificar cliente</button>':'')+(G()?'<button class="bp ol dg" data-a="do" data-i="'+o.id+'">Excluir pedido</button>':''))};
A.do=function(i){var o=g(DB.ord,i);if(!confirm("Excluir este pedido? O histórico da exclusão fica registrado."))return;var b=FS.writeBatch(fdb),mv=[];
if(o.s!="cancelado")o.items.forEach(function(x){if(g(DB.prods,x.pid)){b.update(dref("prods",x.pid),{st:FS.increment(x.q)});mv.push({pid:x.pid,n:x.n,q:x.q})}});
b.delete(dref("cash",cashId(i)));b.delete(dref("ord",i));if(mv.length)mov(b,"exclusao",mv,{oid:i,num:num(i)});
aud(b,"pedido_excluido","pedido","Pedido #"+num(i)+" excluído ("+o.cn+" · "+brl(tot(o))+" · "+o.s+")",{ref:i,num:num(i),ch:[chg("itens",isum(o.items),"")]});b.commit().catch(fail);X();R()};

/* ----- Separação e Produção ----- */
V.sep=function(){return'<div class="tb">'+[["hoje","Hoje"],["amanha","Amanhã"],["7","7 dias"],["late","Atrasados"]].map(function(x){return'<button class="chip'+(SPF.k==x[0]?" on":"")+'" data-a="sq" data-i="'+x[0]+'">'+x[1]+'</button>'}).join("")+'</div><div class="gr" style="margin-bottom:12px"><label>De<input type="date" data-c="sdf" data-i="a" value="'+SPF.a+'"></label><label>Até<input type="date" data-c="sdf" data-i="b" value="'+SPF.b+'"></label></div><div id="lst">'+L.sep()+'</div>'};
A.sq=function(k){var t=todayI();if(k=="hoje"){SPF.a=SPF.b=t}else if(k=="amanha"){SPF.a=SPF.b=addD(t,1)}else if(k=="7"){SPF.a=t;SPF.b=addD(t,6)}else{var m=null;DB.ord.forEach(function(o){if(late(o)&&(!m||o.de<m))m=o.de});if(!m)return toast("Nenhum pedido atrasado.");SPF.a=m;SPF.b=addD(t,-1)}SPF.k=k;R()};
A.sdf=function(k,v){if(!v)return;SPF[k]=v;if(SPF.a>SPF.b){if(k=="a")SPF.b=v;else SPF.a=v}SPF.k="";R()};
function dayStat(d){var ks=Object.keys(d.prods),f=0;ks.forEach(function(k){var r=d.prods[k];f+=Math.min(1,r.q/r.need)});return ks.length?Math.round(f/ks.length*100):0}
function prow(dt,r){var st=pst(r),cl={"concluída":"sp-c","em andamento":"sp-a","pendente":"sp-p"}[st];return'<div class="r tap" data-a="sd" data-i="'+dt+'|'+r.pid+'" style="padding:10px 0;border-top:1px solid var(--ln)"><div class="it" style="flex:1">'+thumb(pimg(r.pid))+'<div style="flex:1"><b>'+esc(r.n)+'</b><div class="m">Total '+qf(r.need)+' '+esc((r.ap||"un.").toLowerCase())+' · separado '+qf(r.q)+' · falta '+qf(Math.max(0,rq(r.need-r.q)))+'</div>'+bar(r.q/r.need*100,6)+'</div></div><div style="text-align:right"><span class="pill '+cl+'" style="padding:4px 12px;font-size:.78rem">'+st+'</span>'+(st=="concluída"?'':'<div><button class="chip" data-a="sa" data-i="'+dt+'|'+r.pid+'" style="margin-top:6px;padding:6px 12px">✔ separar</button></div>')+'</div></div>'}
L.sep0=function(){var days=sepData(SPF.a,SPF.b),ks=Object.keys(days).sort();if(!ks.length)return empty("Nenhum pedido com entrega neste período.");
var np=0,fr=0,ln=0,atr=0,all={},h;ks.forEach(function(k){var d=days[k];np+=d.ords.length;d.ords.forEach(function(o){if(late(o))atr++});Object.keys(d.prods).forEach(function(p){var r=d.prods[p];ln++;fr+=Math.min(1,r.q/r.need);var a=all[p]||(all[p]={pid:p,n:r.n,ap:r.ap,need:0,q:0});a.need=rq(a.need+r.need);a.q=rq(a.q+Math.min(r.q,r.need))})});
var pc=ln?Math.round(fr/ln*100):0;
h='<div class="gr3">'+card("Pedidos",np)+card("Atrasados",atr,atr?"":"")+card("Concluído",pc+"%")+'</div>'+bar(pc,10)+'<div class="tb"><button class="chip on" data-a="spdf">PDF / imprimir</button><button class="chip" data-a="scsv">CSV</button></div>';
if(ks.length>1)h+='<div class="c"><b class="h" style="font-size:1.1rem">Total do período</b>'+Object.keys(all).map(function(p){return all[p]}).sort(function(a,b){return a.n.localeCompare(b.n)}).map(function(r){return'<div class="r" style="padding:8px 0;border-top:1px solid var(--ln)"><span class="it">'+thumb(pimg(r.pid))+'<span>'+esc(r.n)+'</span></span><b>'+qf(r.need)+' '+esc((r.ap||"un.").toLowerCase())+'</b></div>'}).join("")+'</div>';
ks.forEach(function(k){var d=days[k],p=dayStat(d);h+='<div class="c"><div class="r"><b class="h" style="font-size:1.15rem">'+fdw(k)+(k<todayI()?' · <span style="color:#d0665a">anterior</span>':k==todayI()?' · hoje':'')+'</b><span class="m">'+d.ords.length+' pedido(s) · '+p+'%</span></div>'+bar(p)+Object.keys(d.prods).map(function(x){return d.prods[x]}).sort(function(a,b){return a.n.localeCompare(b.n)}).map(function(r){return prow(k,r)}).join("")+sec_n("Pedidos deste dia")+d.ords.slice().sort(function(a,b){return a.cn.localeCompare(b.cn)}).map(oc).join("")+'</div>'});
return h};
function sget(k){var p=k.split("|"),dt=p[0],pid=p.slice(1).join("|"),d=sepData(dt,dt)[dt];return{dt:dt,pid:pid,r:d&&d.prods[pid]}}
function sepSave(k,q){var s=sget(k),r=s.r;if(!r)return;q=rq(Math.max(0,q));var b=FS.writeBatch(fdb);
b.set(dref("sep",s.dt+"_"+s.pid),{dt:s.dt,pid:s.pid,n:r.n,q:q,uid:me.id,un:me.n,ts:Date.now()});
aud(b,"separacao","separacao","Separação de "+fdw(s.dt)+": "+r.n+" — "+qf(q)+" de "+qf(r.need),{ref:s.pid,ch:[chg("separado",qf(r.q),qf(q))]});b.commit().catch(fail)}
A.sa=function(k){var s=sget(k);if(!s.r)return;sepSave(k,s.r.need);if(!$("sh").hidden)A.x2()};
A.ss2=function(k){sepSave(k,parseFloat(String($("f_sq").value).replace(",","."))||0);A.x2()};
A.sz=function(k){sepSave(k,0);A.x2()};
A.sd=function(k){var s=sget(k),r=s.r;if(!r)return;$("sh").innerHTML='<div class="sc"><b class="h" style="font-size:1.2rem">'+esc(r.n)+'</b><p class="m">'+fdw(s.dt)+' · total '+qf(r.need)+' '+esc((r.ap||"un.").toLowerCase())+' · '+pst(r)+(r.by?' · última atualização: '+esc(r.by)+(r.at?' '+fdt(r.at):''):'')+'</p><label>Quantidade efetivamente separada<input id="f_sq" type="number" min="0" step="any" inputmode="decimal" value="'+String(rq(r.q))+'"></label><div class="m" style="margin:8px 0"><b>Pedidos e clientes</b></div><div style="max-height:26vh;overflow:auto">'+r.lines.map(function(l){return'<div class="r" style="padding:6px 0"><span>#'+num(l.o.id)+' '+esc(l.o.cn)+'</span><b>'+qf(l.q)+'</b></div>'}).join("")+'</div><button class="bp" data-a="ss2" data-i="'+k+'">Salvar quantidade</button><button class="bp ac" data-a="sa" data-i="'+k+'">Marcar tudo como separado</button><button class="bp ol" data-a="sz" data-i="'+k+'">Zerar separação</button><button class="bp ol" data-a="x2">Fechar</button></div>';$("sh").hidden=false};
A.spdf=function(){var days=sepData(SPF.a,SPF.b),ks=Object.keys(days).sort();if(!ks.length)return toast("Nada para imprimir.");var R2=["SEPARACAO E PRODUCAO","Entregas de "+fd(SPF.a)+" a "+fd(SPF.b)+" - gerado em "+hoje(),""];
ks.forEach(function(k){var d=days[k];R2.push("== "+fdw(k)+" - "+d.ords.length+" pedido(s) ==");R2.push(pR("Produto",40)+pR("Apres.",9)+pL("Total",8)+pL("Separ.",8)+pL("Falta",8));R2.push("-".repeat(75));
Object.keys(d.prods).map(function(x){return d.prods[x]}).sort(function(a,b){return a.n.localeCompare(b.n)}).forEach(function(r){R2.push(pR(r.n,40)+pR(r.ap||"un.",9)+pL(qf(r.need),8)+pL(qf(r.q),8)+pL(qf(Math.max(0,rq(r.need-r.q))),8)+"  "+(pst(r)=="concluída"?"[X]":"[ ]"))});
R2.push("");R2.push("Pedidos:");d.ords.slice().sort(function(a,b){return a.cn.localeCompare(b.cn)}).forEach(function(o){R2.push("#"+num(o.id)+" "+o.cn+" - "+o.items.length+" item(ns) - "+o.s+(late(o)?" - ATRASADO":""));o.items.forEach(function(x){R2.push("     "+qf(x.q)+" x "+x.n)})});R2.push("")});
dl("separacao.pdf",pdf(R2))};
A.scsv=function(){var days=sepData(SPF.a,SPF.b),ks=Object.keys(days).sort(),rows=[["Data de entrega","Produto","Apresentação","Total","Separado","Falta","Status","Pedidos / clientes"]];
ks.forEach(function(k){var d=days[k];Object.keys(d.prods).map(function(x){return d.prods[x]}).forEach(function(r){rows.push([fd(k),r.n,r.ap||"",qf(r.need),qf(r.q),qf(Math.max(0,rq(r.need-r.q))),pst(r),r.lines.map(function(l){return"#"+num(l.o.id)+" "+l.o.cn+" ("+qf(l.q)+")"}).join(" | ")])})});dlCsv("separacao.csv",rows)};

function semData(){var l=DB.ord.filter(function(o){return!o.de&&o.s!="cancelado"&&o.s!="entregue"});if(!l.length)return"";return'<div class="c"><b class="h" style="font-size:1.1rem">Entrega a definir</b><p class="m">'+l.length+' pedido(s) sem data de entrega. Defina a data (Editar pedido) para incluí-los na separação.</p>'+l.slice().sort(function(a,b){return b.id-a.id}).map(oc).join("")+'</div>'}
L.sep=function(){return L.sep0()+semData()};

/* ----- Relatórios (financeiro/vendas) ----- */
function wkS(i){var p=i.split("-"),d=new Date(+p[0],+p[1]-1,+p[2]);d.setDate(d.getDate()-(d.getDay()+6)%7);return isoD(d)}
function bkey(i,g2){return g2=="m"?i.slice(0,7):g2=="w"?wkS(i):i}
function blab(k,g2){return g2=="m"?k.slice(5)+"/"+k.slice(0,4):g2=="w"?"semana de "+fd(k).slice(0,5):fd(k)}
function inR(o,a,b,u){var d=RF.m=="e"?o.de:cday(o);return!!d&&d>=a&&d<=b&&(!u||o.uid==u)}
function rsum(a,b,u){var n=0,v=0;DB.ord.forEach(function(o){var d=cday(o);if(d>=a&&d<=b&&(!u||o.uid==u)&&o.s!="cancelado"){n++;v+=tot(o)}});return{n:n,v:v}}
function rvend(a,b,u){var r={all:[],ok:[],rev:0,paid:0,deliv:0,canc:0,cnt:{pendente:0,pago:0,entregue:0,cancelado:0},sep:0,prods:{},bk:{},us:{}};
DB.ord.forEach(function(o){var d=cday(o);if(d<a||d>b||(u&&o.uid!=u))return;r.all.push(o);r.cnt[o.s]=(r.cnt[o.s]||0)+1;var t=tot(o),k=o.uid||"-",us=r.us[k]||(r.us[k]={n:o.un||"(sem usuário)",cnt:0,v:0,canc:0,paid:0,deliv:0,com:0,cr:0});us.cnt++;
if(o.s=="cancelado"){r.canc+=t;us.canc+=t;return}r.ok.push(o);r.rev+=t;us.v+=t;if(o.s=="pago"||o.s=="entregue"){r.paid+=t;us.paid+=t;us.com+=t*(o.cr||0)/100;us.cr=Math.max(us.cr,o.cr||0)}if(o.s=="entregue"){r.deliv+=t;us.deliv+=t}
if(ordSep(o)=="separado")r.sep++;var bk=r.bk[bkey(d,RF.g)]||(r.bk[bkey(d,RF.g)]={n:0,v:0});bk.n++;bk.v+=t;
o.items.forEach(function(x){var p=r.prods[x.pid]||(r.prods[x.pid]={n:x.n,q:0,v:0});p.q=rq(p.q+x.q);p.v+=x.q*x.pr})});return r}
function rent(a,b,u){var days={},t={n:0,v:0,ns:0,sep:0,ent:0,late:0};DB.ord.forEach(function(o){if(!o.de||o.de<a||o.de>b||(u&&o.uid!=u)||o.s=="cancelado")return;var d=days[o.de]||(days[o.de]={n:0,v:0,ns:0,sep:0,ent:0,late:0,prods:{}}),s=ordSep(o),v=tot(o);
[d,t].forEach(function(z){z.n++;z.v+=v;if(s=="separado")z.sep++;else z.ns++;if(o.s=="entregue")z.ent++;else if(late(o))z.late++});
o.items.forEach(function(x){var r=d.prods[x.pid]||(d.prods[x.pid]={n:x.n,ap:iap(x),q:0});r.q=rq(r.q+x.q)})});return{days:days,t:t}}
V.rel=function(){var us={};DB.ord.forEach(function(o){if(o.uid)us[o.uid]=o.un||"?"});var ch=function(l,key,cur,act2){return'<div class="tb">'+l.map(function(x){return'<button class="chip'+(cur==x[0]?" on":"")+'" data-a="'+act2+'" data-i="'+x[0]+'">'+x[1]+'</button>'}).join("")+'</div>'};
return ch([["v","Vendas"],["e","Por entrega"]],"m",RF.m,"rmo")+ch([["1","Hoje"],["7","7 dias"],["m","Este mês"],["p","Mês anterior"]],"q","","rp")+'<div class="gr" style="margin-bottom:8px"><label>De<input type="date" data-c="rdf" data-i="a" value="'+RF.a+'"></label><label>Até<input type="date" data-c="rdf" data-i="b" value="'+RF.b+'"></label></div><label>Usuário responsável<select data-c="rdf" data-i="u"><option value="">Todos</option>'+Object.keys(us).map(function(k){return'<option value="'+k+'"'+(RF.u==k?" selected":"")+'>'+esc(us[k])+'</option>'}).join("")+'</select></label>'+(RF.m=="v"?ch([["d","Por dia"],["w","Por semana"],["m","Por mês"]],"g",RF.g,"rg"):"")+'<div id="lst">'+L.rel()+'</div>'};
A.rmo=function(k){RF.m=k;var t=todayI();if(k=="e"){RF.a=t;RF.b=addD(t,6)}else{RF.a=addD(t,-6);RF.b=t}R()};
A.rg=function(k){RF.g=k;R()};
A.rdf=function(k,v){if(k!="u"&&!v)return;RF[k]=v;if(RF.a>RF.b){if(k=="a")RF.b=v;else if(k=="b")RF.a=v}R()};
A.rp=function(k){var t=todayI(),d=new Date();if(k=="1"){RF.a=RF.b=t}else if(k=="7"){RF.a=addD(t,-6);RF.b=t}else if(k=="m"){RF.a=t.slice(0,8)+"01";RF.b=t}else{var f=new Date(d.getFullYear(),d.getMonth()-1,1),l=new Date(d.getFullYear(),d.getMonth(),0);RF.a=isoD(f);RF.b=isoD(l)}R()};
function lVend(){var r=rvend(RF.a,RF.b,RF.u),n=r.ok.length,dias=Math.round((new Date(RF.b)-new Date(RF.a))/864e5)+1,pa=addD(RF.a,-dias),pb=addD(RF.a,-1),pv=rsum(pa,pb,RF.u),dp=pv.v>0?Math.round((r.rev-pv.v)/pv.v*100):null,h;
h='<div class="gr">'+card("Pedidos (sem cancelados)",n)+card("Faturamento",brl(r.rev),"gn")+'</div><div class="gr3" style="margin-top:12px">'+[["Pendentes",r.cnt.pendente],["Pagos",r.cnt.pago],["Entregues",r.cnt.entregue]].map(function(x){return card(x[0],x[1])}).join("")+'</div><div class="gr3">'+[["Cancelados",r.cnt.cancelado],["Separados",r.sep],["Ticket médio",n?brl(r.rev/n):"—"]].map(function(x){return card(x[0],x[1])}).join("")+'</div>';
h+='<div class="c r"><span>Pedidos pelo site</span><b>'+r.ok.filter(function(o){return o.src=="site"}).length+" · "+brl(r.ok.filter(function(o){return o.src=="site"}).reduce(function(a,o){return a+tot(o)},0))+'</b></div>'+sec_n("Valores")+'<div class="c"><div class="r"><span>Criados (sem cancelados)</span><b>'+brl(r.rev)+'</b></div><div class="r" style="margin-top:8px"><span>Pagos / recebidos</span><b>'+brl(r.paid)+'</b></div><div class="r" style="margin-top:8px"><span>Entregues</span><b>'+brl(r.deliv)+'</b></div><div class="r" style="margin-top:8px"><span>Cancelados</span><b>'+brl(r.canc)+'</b></div></div>';
h+='<div class="c"><div class="m">Período anterior ('+fd(pa)+' a '+fd(pb)+')</div><b>'+brl(pv.v)+'</b> · '+pv.n+' pedido(s)'+(dp==null?'':' · <b>'+(dp>0?"+":"")+dp+'%</b>')+'</div>';
var pl2=Object.keys(r.prods).map(function(k){var p=r.prods[k];p.pid=k;return p}).sort(function(a,b){return b.v-a.v});
h+=sec_n("Produtos mais vendidos")+(pl2.length?'<div class="c">'+pl2.slice(0,15).map(function(p){return'<div class="r" style="padding:8px 0;border-top:1px solid var(--ln)"><span class="it">'+thumb(pimg(p.pid))+'<span>'+esc(p.n)+'<div class="m">'+qf(p.q)+' vendido(s)</div></span></span><b>'+brl(p.v)+'</b></div>'}).join("")+(pl2.length>15?'<p class="m">Mostrando 15 de '+pl2.length+'. O CSV traz todos.</p>':'')+'</div>':empty("Sem vendas no período."));
var bk=Object.keys(r.bk).sort();h+=sec_n("Vendas "+(RF.g=="m"?"por mês":RF.g=="w"?"por semana":"por dia"))+(bk.length?'<div class="c">'+bk.map(function(k){return'<div class="r" style="padding:8px 0;border-top:1px solid var(--ln)"><span>'+blab(k,RF.g)+' <span class="m">· '+r.bk[k].n+' pedido(s)</span></span><b>'+brl(r.bk[k].v)+'</b></div>'}).join("")+'</div>':empty("Sem vendas no período."));
var us=Object.keys(r.us).map(function(k){return r.us[k]}).sort(function(a,b){return b.v-a.v});
h+=sec_n("Por usuário responsável")+(us.length?us.map(function(u){return'<div class="c"><div class="r"><b>'+esc(u.n)+'</b><b class="gn">'+brl(u.v)+'</b></div><div class="m" style="margin-top:6px">'+u.cnt+' pedido(s) · pagos '+brl(u.paid)+' · entregues '+brl(u.deliv)+' · cancelados '+brl(u.canc)+(u.cr?'<br>Comissão estimada ('+u.cr+'%, sobre pagos): <b>'+brl(u.com)+'</b>':'')+'</div></div>'}).join(""):empty("Sem pedidos."));
return h+'<div class="tb" style="margin-top:12px"><button class="chip on" data-a="rpdf">PDF / imprimir</button><button class="chip" data-a="rcsv">CSV (Excel)</button></div>'}
function lEnt(){var r=rent(RF.a,RF.b,RF.u),ks=Object.keys(r.days).sort(),t=r.t,h;
h='<div class="gr">'+card("Pedidos programados",t.n)+card("Valor total",brl(t.v),"gn")+'</div><div class="gr3" style="margin-top:12px">'+[["Não separados",t.ns],["Separados",t.sep],["Entregues",t.ent]].map(function(x){return card(x[0],x[1])}).join("")+'</div>'+card("Atrasados (não entregues)",t.late)+card("Sem data de entrega (não entregues)",DB.ord.filter(function(o){return!o.de&&o.s!="cancelado"&&o.s!="entregue"}).length);
if(!ks.length)return h+empty("Nenhum pedido com entrega neste período.");
ks.forEach(function(k){var d=r.days[k];h+='<div class="c"><div class="r"><b class="h" style="font-size:1.1rem">'+fdw(k)+'</b><b class="gn">'+brl(d.v)+'</b></div><div class="m" style="margin:6px 0">'+d.n+' pedido(s) · '+d.ns+' a separar · '+d.sep+' separado(s) · '+d.ent+' entregue(s)'+(d.late?' · <b style="color:#d0665a">'+d.late+' atrasado(s)</b>':'')+'</div>'+Object.keys(d.prods).map(function(x){return d.prods[x]}).sort(function(a,b){return a.n.localeCompare(b.n)}).map(function(p){return'<div class="r" style="padding:6px 0;border-top:1px solid var(--ln)"><span>'+esc(p.n)+'</span><b>'+qf(p.q)+' '+esc((p.ap||"un.").toLowerCase())+'</b></div>'}).join("")+'</div>'});
return h+'<div class="tb"><button class="chip on" data-a="rpdf">PDF / imprimir</button><button class="chip" data-a="rcsv">CSV (Excel)</button></div>'}
L.rel=function(){return RF.m=="e"?lEnt():lVend()};
A.rcsv=function(){var rows=[["Pedido","Data do pedido","Entrega","Cliente","Criado por","Status","Produto","Apresentação","Quantidade","Preço unitário","Subtotal","Desconto do pedido","Total do pedido","Origem"]];
DB.ord.filter(function(o){return inR(o,RF.a,RF.b,RF.u)}).sort(function(a,b){return a.id-b.id}).forEach(function(o){o.items.forEach(function(x,k){rows.push(["#"+num(o.id),o.dt,fd(o.de),o.cn,o.un||"",o.s,x.n,iap(x),qf(x.q),n2(x.pr),qf(x.q*x.pr),k?"":qf(o.disc||0),k?"":qf(tot(o)),o.src=="site"?"Site":"App"])})});
if(rows.length<2)return toast("Nada para exportar neste período.");dlCsv("relatorio-"+(RF.m=="e"?"entrega":"vendas")+".csv",rows)};
A.rpdf=function(){var R2=[RF.m=="e"?"RELATORIO POR DATA DE ENTREGA":"RELATORIO DE VENDAS","Periodo: "+fd(RF.a)+" a "+fd(RF.b)+" - gerado em "+hoje(),""];
if(RF.u){var o1=DB.ord.filter(function(o){return o.uid==RF.u})[0];R2.push("Usuario: "+(o1?o1.un:RF.u))}
if(RF.m=="e"){var r=rent(RF.a,RF.b,RF.u);R2.push("Pedidos: "+r.t.n+"  Valor: "+money(r.t.v)+"  A separar: "+r.t.ns+"  Separados: "+r.t.sep+"  Entregues: "+r.t.ent+"  Atrasados: "+r.t.late,"");
Object.keys(r.days).sort().forEach(function(k){var d=r.days[k];R2.push("== "+fdw(k)+" - "+d.n+" pedido(s) - "+money(d.v)+" ==");Object.keys(d.prods).map(function(x){return d.prods[x]}).forEach(function(p){R2.push("  "+pR(p.n,50)+pL(qf(p.q)+" "+(p.ap||"un."),14))});R2.push("")})}
else{var v=rvend(RF.a,RF.b,RF.u),n=v.ok.length;R2.push("Pedidos: "+n+"  Faturamento: "+money(v.rev)+"  Pagos: "+money(v.paid)+"  Entregues: "+money(v.deliv)+"  Cancelados: "+money(v.canc),"Pendentes: "+v.cnt.pendente+"  Pagos: "+v.cnt.pago+"  Entregues: "+v.cnt.entregue+"  Cancelados: "+v.cnt.cancelado,"","PRODUTOS",pR("Produto",46)+pL("Qtd",10)+pL("Valor",16),"-".repeat(72));
Object.keys(v.prods).map(function(k){return v.prods[k]}).sort(function(a,b){return b.v-a.v}).forEach(function(p){R2.push(pR(p.n,46)+pL(qf(p.q),10)+pL(money(p.v),16))});R2.push("","POR USUARIO");Object.keys(v.us).forEach(function(k){var u=v.us[k];R2.push(pR(u.n,24)+pL(u.cnt+" ped.",8)+pL(money(u.v),14)+pL("pago "+money(u.paid),20))})}
dl("relatorio.pdf",pdf(R2))};
/* ----- Histórico de atividades (somente administrador) ----- */
var ALB={login:"Login",pedido_criado:"Pedido criado",pedido_alterado:"Pedido alterado",pedido_status:"Status do pedido",pedido_cancelado:"Pedido cancelado",pedido_entregue:"Pedido entregue",pedido_reativado:"Pedido reativado",pedido_excluido:"Pedido excluído",separacao:"Separação",produto_criado:"Produto criado",produto_alterado:"Produto alterado",produto_excluido:"Produto excluído",preco_alterado:"Preço alterado",estoque_ajuste:"Ajuste de estoque",estoque_entrada:"Entrada de estoque",importacao:"Importação em lote",usuario_criado:"Usuário criado",usuario_alterado:"Usuário alterado",usuario_excluido:"Usuário excluído",restauracao:"Restauração de backup",site_aprovado:"Pedido do site aprovado",site_recusado:"Pedido do site recusado",site_arquivado:"Pedido do site arquivado",site_restaurado:"Pedido do site restaurado",site_excluido:"Pedido do site excluído",app_obrigatoria:"Atualização obrigatória",loja_config:"Loja online",catalogo_publicado:"Catálogo do site publicado",custo_alterado:"Custo alterado",categoria_criada:"Categoria criada",categoria_renomeada:"Categoria renomeada",categoria_unificada:"Categorias unificadas",categoria_movida:"Produtos movidos de categoria",categoria_excluida:"Categoria excluída",categoria_migracao:"Categorias organizadas"};
V.aud=function(){var us={};DB.audit.forEach(function(e){if(!us[e.uid])us[e.uid]=e.un});var T2=[["pedido","Pedidos"],["produto","Produtos / preços"],["estoque","Estoque"],["separacao","Separação"],["usuario","Usuários"],["sistema","Sistema"]];
return'<div class="gr"><label>Usuário<select data-c="af" data-i="u"><option value="">Todos</option>'+Object.keys(us).map(function(k){return'<option value="'+k+'"'+(AF.u==k?" selected":"")+'>'+esc(us[k]||k)+'</option>'}).join("")+'</select></label><label>Tipo<select data-c="af" data-i="t"><option value="">Todos</option>'+T2.map(function(x){return'<option value="'+x[0]+'"'+(AF.t==x[0]?" selected":"")+'>'+x[1]+'</option>'}).join("")+'</select></label><label>De<input type="date" data-c="af" data-i="d1" value="'+AF.d1+'"></label><label>Até<input type="date" data-c="af" data-i="d2" value="'+AF.d2+'"></label></div><label>Número do pedido<input data-c="af" data-i="n" inputmode="numeric" placeholder="ex.: 1427" value="'+esc(AF.n)+'"></label><div id="lst">'+L.aud()+'</div>'};
A.af=function(k,v){AF[k]=v;$("lst").innerHTML=L.aud()};
L.aud=function(){var n=AF.n.trim(),l=DB.audit.filter(function(e){var d=isoD(new Date(e.ts));return(!AF.u||e.uid==AF.u)&&(!AF.t||e.t==AF.t)&&(!AF.d1||d>=AF.d1)&&(!AF.d2||d<=AF.d2)&&(!n||e.num==n||String(e.ref||"").slice(-n.length)==n)});
if(!l.length)return empty("Nenhum registro com esses filtros.");
return'<p class="m">'+l.length+' registro(s)'+(DB.audit.length>=500?' (mostrando os 500 mais recentes)':'')+'</p>'+l.slice(0,200).map(function(e){return'<div class="c"><b>'+esc(e.d)+'</b><div class="m" style="margin-top:4px">'+fdt(e.ts)+' · '+esc(e.un||"?")+' · '+(ALB[e.a]||esc(e.a))+'</div>'+(e.ch||[]).map(function(c){return'<div class="m" style="margin-top:4px">'+esc(c.f)+': <s>'+esc(c.o||"—")+'</s> → <b>'+esc(c.n||"—")+'</b></div>'}).join("")+'</div>'}).join("")};

/* ----- usuários: comissão futura + auditoria (sem senhas) ----- */
V.users=function(){return'<div id="lst">'+DB.users.map(function(u){return'<div class="c r tap" data-a="nu" data-i="'+u.id+'"><div class="it"><div class="av">'+esc((u.n||"?").charAt(0).toUpperCase())+'</div><div><b>'+esc(u.n)+'</b><div class="m">@'+esc(u.u)+' · '+u.r+(u.com?' · comissão '+u.com+'%':'')+'</div></div></div></div>'}).join("")+'</div>'};
A.nu=function(i){var u=i?g(DB.users,i):{};F(i?"Editar usuário":"Novo usuário",[["n","Nome"],["u","Usuário (login)"],["p","Senha"+(i?" (vazio mantém a atual)":"")],["r","Perfil","s",[["admin","Administrador"],["gerente","Gerente"],["vendedor","Vendedor"]]],["com","Comissão (%) — para uso futuro","n"]],{n:u.n,u:u.u,r:u.r||"vendedor",com:u.com||0},function(o){
var un=cleanU(o.u);if(!o.n||!un)return toast("Informe nome e usuário (letras, números, ponto, - ou _).");
if(!i&&!o.p)return toast("Informe a senha.");if(o.p&&o.p.length<6)return toast("A senha precisa ter ao menos 6 caracteres.");
if(o.com<0||o.com>100)return toast("Comissão deve estar entre 0 e 100.");
if(DB.users.some(function(x){return x.u==un&&x.id!=i}))return toast("Esse usuário já existe.");
if(o.r!="admin"&&!DB.users.some(function(x){return x.id!=i&&x.r=="admin"}))return toast("Precisa existir ao menos um administrador.");
var b=FS.writeBatch(fdb),p=null,done=function(){X();R()},ch=[],df=function(f,x,y){if(String(x==null?"":x)!=String(y==null?"":y))ch.push(chg(f,x,y))};
if(i){df("nome",u.n,o.n);df("usuário",u.u,un);df("perfil",u.r,o.r);df("comissão %",u.com||0,o.com);if(o.p)ch.push(chg("senha","","redefinida"))}
if(!i||o.p&&i!=me.id){var em=mkEm();p=mkAuth(em,o.p).then(function(id){b.set(dref("users",id),{n:o.n,u:un,r:o.r,em:em,com:o.com});b.set(dref("logins",un),{em:em});if(i){b.delete(dref("users",i));if(un!=u.u)b.delete(dref("logins",u.u))}
aud(b,i?"usuario_alterado":"usuario_criado","usuario",i?"Usuário alterado: "+o.n+" (@"+un+")":"Usuário criado: "+o.n+" (@"+un+") · perfil "+o.r+(o.com?" · comissão "+o.com+"%":""),{ref:id,ch:ch})})}
else{b.update(dref("users",i),{n:o.n,u:un,r:o.r,com:o.com});if(un!=u.u){b.delete(dref("logins",u.u));b.set(dref("logins",un),{em:u.em})}if(o.p)p=AU.updatePassword(auth.currentUser,o.p);
aud(b,"usuario_alterado","usuario","Usuário alterado: "+o.n+" (@"+un+")",{ref:i,ch:ch})}
if(p){toast("Salvando…");p.then(function(){return b.commit()}).then(done).catch(fail)}else{b.commit().catch(fail);done()}
},i?["du",i]:0)};
A.du=function(i){var u=g(DB.users,i);if(u.id==me.id)return toast("Você não pode excluir o próprio usuário.");if(confirm("Excluir "+u.n+"?")){var b=FS.writeBatch(fdb);b.delete(dref("users",i));b.delete(dref("logins",u.u));aud(b,"usuario_excluido","usuario","Usuário excluído: "+u.n+" (@"+u.u+")",{ref:i});b.commit().catch(fail);X();R()}};
/* restaurar backup (lotes pequenos por causa dos limites das regras) */
A.rs2=function(){if(me.r!="admin")return toast("Somente administrador.");var d;try{d=JSON.parse($("bt").value);if(!d.prods||!d.ord)throw 0}catch(e){return toast("Backup inválido.")}
if(!confirm("Substituir todos os dados atuais?"))return;var ops=[];
["prods","cust","ord","cash","cats","custos"].forEach(function(n){if((n=="cats"||n=="custos")&&!d[n])return;var keep={};(d[n]||[]).forEach(function(x){var r=Object.assign({},x),id=String(n=="cash"&&x.oid?cashId(x.oid):x.id);delete r.id;
if(n=="prods")r.st=Math.max(0,r.st||0);if(n=="cash"){r.ts=r.ts||Number(x.id)||uid();if(x.oid)r.oid=String(x.oid)}
Object.keys(r).forEach(function(q){if(r[q]===undefined)delete r[q]});keep[id]=1;ops.push(function(b){b.set(dref(n,id),r)})});
DB[n].forEach(function(x){if(!keep[x.id])ops.push(function(b){b.delete(dref(n,x.id))})})});
ops.push(function(b){aud(b,"restauracao","sistema","Backup restaurado ("+(d.prods||[]).length+" produtos, "+(d.ord||[]).length+" pedidos)")});toast("Restaurando…");batchOps(ops,function(){toast("Backup restaurado.");X();R()})};

/* ===== v3: tela inicial, configurações, permissões, categorias, cliente genérico ===== */
function chart7(){var d=[],t=todayI(),i,mx=0,sm=0,k,v;for(i=6;i>=0;i--){k=addD(t,-i);v=0;DB.ord.forEach(function(o){if(o.s!="cancelado"&&cday(o)==k)v+=tot(o)});d.push([k,v]);mx=Math.max(mx,v);sm+=v}
return'<div class="c" style="margin-top:12px"><div class="m">Vendas dos últimos 7 dias (por dia do mês)</div><div style="display:flex;align-items:flex-end;gap:8px;height:110px;margin-top:12px">'+d.map(function(x){return'<div style="flex:1;text-align:center;min-width:0"><div style="height:'+(mx?Math.max(3,Math.round(x[1]/mx*80)):3)+'px;background:var(--gn);border-radius:6px 6px 0 0" title="'+brl(x[1])+'"></div><div class="m" style="font-size:.7rem;margin-top:4px">'+x[0].slice(8)+'</div></div>'}).join("")+'</div><div class="m" style="margin-top:8px">Total: <b>'+brl(sm)+'</b></div></div>'}
V.home=function(){var n=function(s){return DB.ord.filter(function(x){return x.s==s}).length},low=DB.prods.filter(function(p){return p.st<=3}).length,tdy=todayI(),ent=DB.ord.filter(function(o){return o.de==tdy&&o.s!="cancelado"&&o.s!="entregue"}).length,atr=DB.ord.filter(late).length;
return'<p class="m" style="margin:0 0 14px">Olá, '+esc(me.n)+' · '+me.r+'</p><div class="gr">'+[["Pendentes",n("pendente")],["Pagos",n("pago")],["Entregues",n("entregue")],["Estoque baixo",low]].map(function(x){return'<div class="c"><div class="m">'+x[0]+'</div><b class="big">'+x[1]+'</b></div>'}).join("")+'</div><div class="c r"><div><div class="m">Entregas de hoje</div><b class="big">'+ent+'</b></div><div style="text-align:right"><div class="m">Atrasadas</div><b class="big"'+(atr?' style="color:#d0665a"':'')+'>'+atr+'</b></div></div>'+(G()?'<div class="c r tap" data-a="tab" data-i="site"><div><div class="m">Pedidos do site</div><b class="big">'+webNovos()+'</b></div><div class="m">novos · toque para ver</div></div><div class="c"><div class="m">Saldo do caixa</div><b class="big gn">'+brl(cs()[0]-cs()[1])+'</b></div>'+chart7():'')};
function crow(i0,t,sub,a,i){return'<button class="c r tap" data-a="'+a+'"'+(i?' data-i="'+i+'"':'')+' style="width:100%;text-align:left;font:inherit;color:inherit"><div class="it"><div class="av">'+ic(i0)+'</div><div><b>'+t+'</b>'+(sub?'<div class="m">'+sub+'</div>':'')+'</div></div></button>'}
V.cfg=function(){var ad=me.r=="admin",h='<p class="m" style="margin:0 0 6px">'+esc(me.n)+' · '+me.r+'</p>'+sec_n("Aparência")+'<div class="c"><b>Tamanho do texto</b><div class="tb" style="margin:12px 0 8px;flex-wrap:wrap">'+[["p","Pequeno"],["n","Normal"],["g","Grande"],["x","Extra grande"]].map(function(x){return'<button class="chip'+(PF.fs==x[0]?" on":"")+'" data-a="fz" data-i="'+x[0]+'">'+x[1]+'</button>'}).join("")+'</div><div class="m">Vale só para o seu usuário e fica salvo.</div></div>';
if(G())h+=sec_n("Gestão")+crow("list","Relatórios","Vendas e entregas por período","tab","rel")+crow("globe","Loja online","Site, entrega e catálogo","tab","loja")+crow("cat","Categorias de produtos","Criar, renomear, unificar e excluir","tab","cat")+crow("pdf","Catálogo em PDF","","pc")+crow("chat","Catálogo no WhatsApp","","wk");
if(ad)h+=sec_n("Administração")+crow("users","Usuários","Criar, editar e excluir","tab","users")+crow("shield","Permissões","Quem pode fazer o quê","tab","perm")+crow("check","Histórico de atividades","Auditoria","tab","aud")+crow("share","Backup","Copiar os dados","bk")+crow("box","Restaurar backup","","rs");
return h+updSec()+licSec()+sec_n("Suporte")+crow("chat","Falar com o suporte","Dúvidas ou problemas, pelo WhatsApp","sup")+sec_n("Conta")+'<button class="bp ol dg" data-a="out">Sair</button>'};
V.perm=function(){var Y="✔",N="—",rows=[["Criar pedidos e separar",Y,Y,Y],["Editar, cancelar e excluir pedidos",Y,Y,N],["Produtos, preços e estoque",Y,Y,"só baixa por venda"],["Custos, margens e markup",Y,Y,N],["Clientes e categorias",Y,Y,N],["Financeiro e relatórios",Y,Y,N],["Usuários e permissões",Y,N,N],["Histórico de atividades",Y,N,N],["Backup e restauração",Y,N,N]];
return'<button class="chip on" data-a="tab" data-i="cfg">← Configurações</button><p class="m" style="margin-top:12px">Estas regras são aplicadas pelo servidor (Firebase), não só escondidas na tela. Para mudar o perfil de alguém, abra Usuários e toque no usuário.</p><div class="c" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><tr><th style="text-align:left;padding:6px 4px">Ação</th><th>Adm.</th><th>Ger.</th><th>Vend.</th></tr>'+rows.map(function(r){return'<tr>'+r.map(function(c,k){return'<td style="padding:8px 4px;border-top:1px solid var(--ln);'+(k?'text-align:center;':'')+'">'+c+'</td>'}).join("")+'</tr>'}).join("")+'</table></div><button class="bp" data-a="tab" data-i="users">Gerenciar usuários</button>'};
/* ----- categorias (administração) ----- */
function legacyGroups(){var m={};DB.prods.forEach(function(p){var t=String(p.cat||"").trim().replace(/\s+/g," ");if(p.catId||!t)return;var k=nrm(t),o=m[k]||(m[k]={names:{},ps:[]});o.names[t]=(o.names[t]||0)+1;o.ps.push(p)});return Object.keys(m).map(function(k){var o=m[k];o.n=Object.keys(o.names).sort(function(a,b){return o.names[b]-o.names[a]})[0];return o})}
V.cat=function(){var lg=legacyGroups(),nl=lg.reduce(function(a,x){return a+x.ps.length},0),sem=DB.prods.filter(function(p){return!p.catId&&!String(p.cat||"").trim()}).length,h='<button class="chip on" data-a="tab" data-i="cfg">← Configurações</button><div class="r" style="margin:14px 0 6px"><b class="h" style="font-size:1.2rem">'+DB.cats.length+' categoria(s)</b><button class="chip on" data-a="cr0">+ Nova</button></div>';
if(lg.length)h+='<div class="c" style="border-color:var(--ac)"><b>Organizar categorias antigas</b><p class="m">'+nl+' produto(s) têm categoria digitada à mão ('+lg.length+' nome(s)) e ainda não estão ligados a uma categoria cadastrada.</p><button class="bp" data-a="cmg">Ver e organizar</button></div>';
h+=DB.cats.slice().sort(nm).map(function(c){return'<div class="c"><div class="r"><b>'+esc(c.n)+'</b><span class="m">'+catUse(c.id)+' produto(s)</span></div><div class="tb" style="margin:10px 0 0;flex-wrap:wrap"><button class="chip" data-a="cn1" data-i="'+c.id+'">Renomear</button><button class="chip" data-a="cdl" data-i="'+c.id+'|u">Unificar em…</button><button class="chip" data-a="cdl" data-i="'+c.id+'|m">Mover produtos…</button><button class="chip" data-a="cdl" data-i="'+c.id+'|d">Excluir</button></div></div>'}).join("");
if(sem)h+='<p class="m">Sem categoria: '+sem+' produto(s). Edite cada produto para escolher a categoria.</p>';
if(!DB.cats.length&&!lg.length)h+=empty("Nenhuma categoria ainda. Toque em + Nova.");return h};
A.cr0=function(){$("sh").innerHTML='<div class="sc"><b class="h" style="font-size:1.2rem">Nova categoria</b><label>Nome<input id="f_kn" autocomplete="off"></label><button class="bp" data-a="cr1">Criar</button><button class="bp ol" data-a="x2">Cancelar</button></div>';$("sh").hidden=false};
A.cr1=function(){var n=$("f_kn").value.trim().replace(/\s+/g," ");if(!n)return toast("Informe o nome.");var ex=catByName(n);if(ex)return toast("Já existe a categoria «"+ex.n+"».");var id=newCatId(n),b=FS.writeBatch(fdb);b.set(dref("cats",id),{n:n,ts:Date.now()});aud(b,"categoria_criada","produto","Categoria criada: "+n,{ref:id});b.commit().catch(fail);A.x2()};
A.cn1=function(id){var c=g(DB.cats,id);$("sh").innerHTML='<div class="sc"><b class="h" style="font-size:1.2rem">Renomear categoria</b><label>Novo nome<input id="f_kn" autocomplete="off" value="'+esc(c.n)+'"></label><button class="bp" data-a="cn2" data-i="'+id+'">Salvar</button><button class="bp ol" data-a="x2">Cancelar</button></div>';$("sh").hidden=false};
A.cn2=function(id){var c=g(DB.cats,id),n=$("f_kn").value.trim().replace(/\s+/g," ");if(!n)return toast("Informe o nome.");if(n==c.n){A.x2();return}
var ex=catByName(n);if(ex&&ex.id!=id){if(confirm("Já existe «"+ex.n+"». Unificar «"+c.n+"» com ela? Os produtos passam para «"+ex.n+"».")){A.x2();cmove(id,ex.id,true,"categoria_unificada")}return}
var b=FS.writeBatch(fdb);b.update(dref("cats",id),{n:n});aud(b,"categoria_renomeada","produto","Categoria renomeada: "+c.n+" → "+n,{ref:id,ch:[chg("nome",c.n,n)]});b.commit().catch(fail);A.x2()};
function cmove(src,dst,del,tp){var s=g(DB.cats,src),d=dst&&dst!="-"?g(DB.cats,dst):null,ps=DB.prods.filter(function(p){return p.catId==src}),ops=[];
ps.forEach(function(p){ops.push(function(b){b.update(dref("prods",p.id),d?{catId:d.id,cat:d.n}:{catId:FS.deleteField(),cat:""})})});
if(del)ops.push(function(b){b.delete(dref("cats",src))});
ops.push(function(b){aud(b,tp,"produto",{categoria_unificada:"Categorias unificadas",categoria_movida:"Produtos movidos",categoria_excluida:"Categoria excluída"}[tp]+": «"+s.n+"»"+(d?" → «"+d.n+"»":""),{ref:src,ch:[chg("produtos",ps.length+" em «"+s.n+"»",d?ps.length+" em «"+d.n+"»":ps.length+" sem categoria")]})});
toast("Atualizando…");batchOps(ops,function(){toast("Concluído.");R()})}
A.cdl=function(a){var p=a.split("|"),id=p[0],m=p[1],c=g(DB.cats,id),n=catUse(id);
if(m=="d"&&!n){if(confirm("Excluir a categoria «"+c.n+"»?")){var b=FS.writeBatch(fdb);b.delete(dref("cats",id));aud(b,"categoria_excluida","produto","Categoria excluída: «"+c.n+"»",{ref:id});b.commit().catch(fail)}return}
var o=DB.cats.filter(function(x){return x.id!=id}).sort(nm),tt={u:"Unificar «"+c.n+"» em…",m:"Mover os produtos de «"+c.n+"» para…",d:"Excluir «"+c.n+"»"}[m];
$("sh").innerHTML='<div class="sc"><b class="h" style="font-size:1.2rem">'+tt+'</b><p class="m">'+n+' produto(s) nesta categoria.'+(m=="u"?' A categoria «'+esc(c.n)+'» será removida depois.':m=="d"?' Escolha para onde eles vão antes de excluir.':'')+'</p><label>Categoria de destino<select id="f_ct">'+'<option value="">Escolher…</option>'+(m=="d"?'<option value="-">Sem categoria (os produtos ficam sem categoria)</option>':'')+o.map(function(x){return'<option value="'+x.id+'">'+esc(x.n)+'</option>'}).join("")+'</select></label><button class="bp'+(m=="d"?' dg':'')+'" data-a="cdx" data-i="'+a+'">Confirmar</button><button class="bp ol" data-a="x2">Cancelar</button></div>';$("sh").hidden=false};
A.cdx=function(a){var p=a.split("|"),dst=$("f_ct").value;if(!dst)return toast("Escolha a categoria de destino.");A.x2();cmove(p[0],dst,p[1]!="m",p[1]=="u"?"categoria_unificada":p[1]=="m"?"categoria_movida":"categoria_excluida")};
A.cmg=function(){var gs=legacyGroups(),np=gs.reduce(function(a,x){return a+x.ps.length},0);$("sh").innerHTML='<div class="sc"><b class="h" style="font-size:1.2rem">Organizar categorias antigas</b><p class="m">Cria categorias cadastradas a partir dos textos já usados e liga cada produto à sua categoria. Nomes que só diferem por maiúsculas, acentos ou espaços viram um só. Nada é apagado: produtos, preços e estoque continuam iguais. Variações como «Legume» e «Legumes» ficam separadas; depois você pode unificá-las.</p><div style="max-height:32vh;overflow:auto">'+gs.map(function(x){return'<div class="r" style="padding:6px 0"><b>'+esc(x.n)+'</b><span class="m">'+x.ps.length+' produto(s)'+(catByName(x.n)?' · já existe':' · nova')+'</span></div>'}).join("")+'</div><p class="m">Recomendado: faça um Backup antes (Configurações > Backup).</p><button class="bp" data-a="cmg2">Organizar '+np+' produto(s)</button><button class="bp ol" data-a="x2">Cancelar</button></div>';$("sh").hidden=false};
A.cmg2=function(){var gs=legacyGroups(),ops=[],made={},np=0,nc=0;
gs.forEach(function(x){var ex=catByName(x.n),id,nm0;if(ex){id=ex.id;nm0=ex.n}else{id=newCatId(x.n);while(made[id])id+="_"+uid();made[id]=1;nm0=x.n;nc++;(function(i,n){ops.push(function(b){b.set(dref("cats",i),{n:n,ts:Date.now()})})})(id,nm0)}
x.ps.forEach(function(p){np++;(function(i,n,pid){ops.push(function(b){b.update(dref("prods",pid),{catId:i,cat:n})})})(id,nm0,p.id)})});
ops.push(function(b){aud(b,"categoria_migracao","produto","Categorias organizadas: "+nc+" nova(s), "+np+" produto(s) ligados")});A.x2();toast("Organizando…");batchOps(ops,function(){toast("Pronto: "+nc+" categoria(s) criada(s), "+np+" produto(s) ligados.");R()})};
/* ----- clientes: cadastro genérico e identificação segura dos pedidos ----- */
L.cust=function(){var q=Q.toLowerCase(),l=DB.cust.filter(function(c){return!q||c.n.toLowerCase().indexOf(q)>=0}).sort(function(a,b){return(b.id==GEN)-(a.id==GEN)||a.n.localeCompare(b.n)});
return l.length?l.map(function(c){var gen=c.id==GEN,n=gen?DB.ord.filter(function(o){return o.cid==GEN&&o.s!="cancelado"}).length:0;return'<div class="c r'+(G()?' tap':'')+'"'+(G()?' data-a="'+(gen?'ig':'nc2')+'" data-i="'+c.id+'"':'')+'><div class="it"><div class="av">'+esc(c.n.charAt(0).toUpperCase())+'</div><div><b>'+esc(c.n)+'</b><div class="m">'+(gen?'Genérico · '+n+' pedido(s)':esc(c.t))+'</div></div></div>'+(c.t&&!gen?'<button class="cb" data-a="wc" data-i="'+c.id+'" aria-label="WhatsApp">'+ic("chat")+'</button>':'')+'</div>'}).join(""):empty("Nenhum cliente. Toque em + para cadastrar.")};
A.ig=function(a){IGS={};var o=a&&a!=GEN?g(DB.ord,a):null;if(o)IGS[o.id]=1;igp()};
function igp(sv){var os=DB.ord.filter(function(o){return o.cid==GEN}).sort(function(a,b){return b.id-a.id});
P("Cliente não identificado",os.length+" pedido(s) vinculados",'<p class="m">Marque os pedidos e escolha o cliente verdadeiro. Só os pedidos marcados mudam; o cadastro genérico continua igual para as próximas vendas.</p>'+(os.length?os.map(function(o){return'<div class="c r tap" data-a="igt" data-i="'+o.id+'" style="padding:12px"><div class="it"><span style="font-size:1.5rem">'+(IGS[o.id]?'☑':'☐')+'</span><div><b>#'+num(o.id)+' · '+brl(tot(o))+'</b><div class="m">'+o.dt+' · '+(o.de?'entrega '+fd(o.de):'entrega a definir')+(o.s=="cancelado"?' · cancelado':'')+'</div></div></div></div>'}).join(""):empty("Nenhum pedido vinculado ao cliente genérico."))+'<label>Vincular ao cliente<select id="f_ic"><option value="">Escolher…</option>'+DB.cust.filter(function(c){return c.id!=GEN}).sort(nm).map(function(c){return'<option value="'+c.id+'">'+esc(c.n)+'</option>'}).join("")+'<option value="+">+ Novo cliente</option></select></label><label>Nome do novo cliente (se for novo)<input id="f_icn" autocomplete="off"></label>','<button class="bp" data-a="igv">Vincular pedidos marcados</button>');
if(sv){$("f_ic").value=sv[0];$("f_icn").value=sv[1]}}
A.igt=function(i){var sv=[$("f_ic").value,$("f_icn").value];if(IGS[i])delete IGS[i];else IGS[i]=1;igp(sv)};
A.igv=function(){var ids=Object.keys(IGS),sel=$("f_ic").value,nn=$("f_icn").value.trim();if(!ids.length)return toast("Marque ao menos um pedido.");if(!sel)return toast("Escolha o cliente.");if(sel=="+"&&!nn)return toast("Informe o nome do novo cliente.");
var tgt,ops=[];if(sel=="+"){if(DB.cust.some(function(c){return nrm(c.n)==nrm(nn)})&&!confirm("Já existe um cliente com esse nome. Criar outro mesmo assim?"))return;var cid=String(uid());tgt={id:cid,n:nn};ops.push(function(b){b.set(dref("cust",cid),{n:nn,t:"",e:"",a:"",o:""})})}else tgt=g(DB.cust,sel);
ids.forEach(function(i){var o=g(DB.ord,i);if(!o||o.cid!=GEN)return;ops.push(function(b){b.update(dref("ord",i),{cid:tgt.id,cn:tgt.n,ub:me.n,ut:Date.now()})});ops.push(function(b){aud(b,"pedido_alterado","pedido","Pedido #"+num(i)+": cliente identificado como "+tgt.n,{ref:i,num:num(i),ch:[chg("cliente","Cliente não identificado",tgt.n)]})})});
toast("Atualizando…");batchOps(ops,function(){toast("Pedidos vinculados.");X();R()})};
/* ----- mensagem do pedido para o cliente: sem estoque, sem custo ----- */
A.wo=function(i){var o=g(DB.ord,i),c=o.cid&&o.cid!=GEN?g(DB.cust,o.cid):null;wa("*Pedido #"+num(o.id)+"*\nCliente: "+o.cn+"\n"+o.items.map(function(x){return"- "+qf(x.q)+"x "+x.n+" — "+brl(x.q*x.pr)}).join("\n")+(o.acr?"\nAcréscimo"+(o.acd?" ("+o.acd+")":"")+": "+brl(o.acr):"")+(o.disc?"\nDesconto: "+brl(o.disc):"")+"\n*Total: "+brl(tot(o))+"*"+(o.de?"\nEntrega: "+fd(o.de):"")+"\nStatus: "+o.s,c&&c.t)};

/* ===== v4: loja online (site para clientes finais) ===== */
var LJ={aberta:false,nome:"Anelê",tel:"5516988239933",dias:[1,2,3,4,5,6],corte:"18:00",min:0,aviso:"",urlsite:"",pub:false,ver:0},WEBID=null,WF="novo",PWSEEN=null,MAXW=14,SYN=0,THC={},LASTSYN=0,STM=null;
IC.globe='<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>';
T.site="Pedidos do site";T.loja="Loja online";
SRT.pedidosweb=function(a,b){return(b.ts||0)-(a.ts||0)};SRT.catalogo=function(){return 0};
function dg(s){return String(s||"").replace(/\D/g,"")}
function addrOf(w){var e=w.end||{};return[e.rua,e.num,e.bairro,e.comp].filter(Boolean).join(", ")}
function updBadge(){var b=document.querySelector('nav [data-i="site"]');if(!b)return;var n=webNovos(),e=b.querySelector(".bdg");if(n){if(!e){e=document.createElement("i");e.className="bdg";b.appendChild(e)}e.textContent=n}else if(e)e.remove()}
function webNovos(){return DB.pedidosweb.filter(function(w){return w.st=="novo"}).length}
function webNotify(){if(PWSEEN){var nn=DB.pedidosweb.filter(function(w){return!PWSEEN[w.id]&&w.st=="novo"});if(nn.length){toast("Novo pedido do site: "+nn[0].cod+(nn.length>1?" (+"+(nn.length-1)+")":""));try{navigator.vibrate&&navigator.vibrate(200)}catch(e){}}}PWSEEN={};DB.pedidosweb.forEach(function(w){PWSEEN[w.id]=1})}
function subLoja(){if(!G())return;unsubs.push(FS.onSnapshot(dref("loja","config"),function(s){if(s.exists())LJ=Object.assign(LJ,s.data());refresh()},function(){}))}
/* ----- aba Site ----- */
var WSTC={novo:"st-pendente",aprovado:"st-pago",recusado:"st-cancelado",arquivado:"st-entregue"};
V.site=function(){return'<div id="lst">'+L.site()+'</div><button class="bp ol" data-a="tab" data-i="loja">'+ic("globe")+' Configurar loja online</button>'};
L.site=function(){var c={novo:0,aprovado:0,recusado:0,arquivado:0};DB.pedidosweb.forEach(function(w){c[w.st||"novo"]=(c[w.st||"novo"]||0)+1});
var l=DB.pedidosweb.filter(function(w){return(w.st||"novo")==WF});
return'<div class="c r"><div><b>'+(LJ.aberta?"Loja aberta":"Loja fechada")+'</b><div class="m">'+(LJ.aberta?"Clientes podem enviar pedidos.":"O site mostra o aviso de fechado.")+'</div></div><button class="chip on" data-a="lja">'+(LJ.aberta?"Fechar":"Abrir")+'</button></div><div class="tb">'+[["novo","Novos"],["aprovado","Aprovados"],["recusado","Recusados"],["arquivado","Arquivados"]].map(function(x){return'<button class="chip'+(WF==x[0]?" on":"")+'" data-a="wf" data-i="'+x[0]+'">'+x[1]+' ('+(c[x[0]]||0)+')</button>'}).join("")+'</div>'+
(l.length?l.map(function(w){return'<div class="c tap" data-a="wd" data-i="'+w.id+'"><div class="r"><div><b>'+esc(w.nome)+'</b><div class="m">'+esc(w.cod)+' · '+fdt(w.ts)+'</div><div class="m">Entrega pedida: '+(w.de?fd(w.de):"a definir")+' · '+(w.items||[]).length+' item(ns)</div></div><div style="text-align:right"><b class="gn">'+brl(w.total)+'</b><div style="margin-top:4px"><span class="pill '+(WSTC[w.st]||"st-pendente")+'">'+(w.st||"novo")+'</span></div></div></div></div>'}).join(""):empty(WF=="novo"?"Nenhum pedido novo do site.":"Nada aqui."))};
A.wf=function(k){WF=k;$("lst").innerHTML=L.site()};
A.lja=function(){var b=FS.writeBatch(fdb);b.set(dref("loja","config"),cln(Object.assign({},LJ,{aberta:!LJ.aberta,ts:Date.now()})));aud(b,"loja_config","sistema","Loja "+(LJ.aberta?"fechada":"aberta")+" para pedidos do site");b.commit().catch(fail)};
function wcheck(w){return(w.items||[]).map(function(x){var p=g(DB.prods,x.pid);return{x:x,p:p,st:!p||!act(p)?"indisponível":x.q>p.st+1e-9?"estoque insuficiente (há "+qf(p.st)+")":"",pr:p?p.pr:x.pr}})}
A.wd=function(id){var w=g(DB.pedidosweb,id);if(!w)return;var ck=wcheck(w),cur=ck.reduce(function(a,r){return a+r.x.q*r.pr},0),o=w.oid&&g(DB.ord,w.oid),st=w.st||"novo";
P(esc(w.nome),w.cod+" · "+fdt(w.ts),'<span class="pill '+(WSTC[st]||"st-pendente")+'">'+st+'</span><div class="c" style="margin-top:16px"><div class="r"><span class="m">WhatsApp</span><b>'+esc(w.tel)+'</b></div><div class="r" style="margin-top:8px"><span class="m">Endereço</span><span style="text-align:right">'+esc(addrOf(w))+'</span></div><div class="r" style="margin-top:8px"><span class="m">Entrega pedida</span><b>'+(w.de?fd(w.de):"a definir")+'</b></div>'+(w.obs?'<div class="m" style="margin-top:8px">Obs.: '+esc(w.obs)+'</div>':'')+'</div><div class="c"><b class="h" style="font-size:1.1rem">Itens</b>'+ck.map(function(r){return'<div class="r" style="margin-top:12px"><span class="it">'+thumb(r.p&&r.p.img)+'<span>'+qf(r.x.q)+' x '+esc(r.x.n)+'<div class="m">'+brl(r.x.pr)+(r.p&&r.p.pr!=r.x.pr?' · <b style="color:var(--ac)">hoje '+brl(r.p.pr)+'</b>':'')+'</div>'+(r.st&&st=="novo"?'<div class="m" style="color:#d0665a">'+r.st+'</div>':'')+'</span></span><span>'+brl(r.x.q*r.pr)+'</span></div>'}).join("")+'<hr><div class="r"><b>Total (preços de hoje)</b><b class="big gn">'+brl(cur)+'</b></div>'+(Math.abs(cur-w.total)>0.005?'<div class="m">Valor enviado pelo cliente: '+brl(w.total)+'</div>':'')+'<div class="m">Taxa de entrega: combine pelo WhatsApp e lance em Acréscimos ao aprovar.</div></div>'+(st=="recusado"?'<p class="m">Motivo: '+esc(w.mot||"—")+'</p>':'')+(st=="aprovado"?'<p class="m">Aprovado por '+esc(w.ab||"")+(w.at?' em '+fdt(w.at):'')+'</p>':''),
(st=="novo"?'<button class="bp" data-a="sw" data-i="'+id+'">Aprovar e abrir pedido</button><button class="bp ol" data-a="wr" data-i="'+id+'">Responder no WhatsApp</button><button class="bp ol" data-a="sr" data-i="'+id+'">Recusar</button><button class="bp ol" data-a="sv" data-i="'+id+'">Arquivar</button>':st=="aprovado"?(o?'<button class="bp" data-a="od" data-i="'+o.id+'">Ver pedido #'+num(o.id)+'</button>':'')+'<button class="bp ol" data-a="wr" data-i="'+id+'">Avisar no WhatsApp</button>':'<button class="bp" data-a="swr" data-i="'+id+'">Restaurar para Novos</button><button class="bp ol" data-a="wr" data-i="'+id+'">Responder no WhatsApp</button><button class="bp ol dg" data-a="swx" data-i="'+id+'">Excluir pedido do site</button>'))};
/* aprovar = abrir o formulário de pedido já preenchido (preços e estoque de hoje); o estoque só baixa ao salvar */
A.sw=function(id){var w=g(DB.pedidosweb,id);if(!w||(w.st||"novo")!="novo")return;var nt=[],items=[],ph=dg(w.tel).slice(-11),c=ph.length>=10?DB.cust.filter(function(c){return c.id!=GEN&&dg(c.t).slice(-11)==ph})[0]:null;
(w.items||[]).forEach(function(x){var p=g(DB.prods,x.pid);if(!p||!act(p)){nt.push(x.n+" indisponível");return}if(p.pr!=x.pr)nt.push(pn(p)+": preço agora "+brl(p.pr));var q=x.q;if(q>p.st+1e-9){nt.push(pn(p)+": só há "+qf(p.st));q=rq(Math.max(0,p.st))}if(q>0)items.push({pid:p.id,n:pn(p),q:q,pr:p.pr,ap:p.ap||""})});
WEBID=id;OE=null;tmp=items;ofm(null,{cid:c?c.id:"",cn:w.nome,de:w.de||"",obs:(w.obs?w.obs+"\n":"")+"Entrega: "+addrOf(w)+" · WhatsApp "+w.tel,cod:w.cod});if(nt.length)toast("Confira: "+nt.join("; "))};
A.sr=function(id){$("sh").innerHTML='<div class="sc"><b class="h" style="font-size:1.2rem">Recusar pedido</b><label>Motivo<select id="f_mot">'+["Sem estoque dos produtos","Fora da área de entrega","Não consegui contato","Pedido duplicado","Outro motivo"].map(function(m){return'<option>'+m+'</option>'}).join("")+'</select></label><button class="bp dg" data-a="srx" data-i="'+id+'">Recusar</button><button class="bp ol" data-a="srw" data-i="'+id+'">Recusar e avisar no WhatsApp</button><button class="bp ol" data-a="x2">Cancelar</button></div>';$("sh").hidden=false};
function wset(id,st,ex,tp,d){var b=FS.writeBatch(fdb);b.update(dref("pedidosweb",id),Object.assign({st:st,ab:me.n,at:Date.now()},ex));aud(b,tp,"pedido",d,{ref:id});b.commit().catch(fail)}
A.srx=function(id){var m=$("f_mot").value,w=g(DB.pedidosweb,id);wset(id,"recusado",{mot:m},"site_recusado","Pedido do site "+w.cod+" recusado: "+m);A.x2();X();R()};
A.srw=function(id){var m=$("f_mot").value,w=g(DB.pedidosweb,id);A.srx(id);wa("Olá, "+w.nome.split(" ")[0]+"! Sobre o seu pedido "+w.cod+" na Anelê: não conseguimos atender desta vez ("+m.toLowerCase()+"). Se quiser, te ajudo a refazer o pedido. 🌿",w.tel)};
A.swr=function(id){var w=g(DB.pedidosweb,id);wset(id,"novo",{mot:FS.deleteField()},"site_restaurado","Pedido do site "+w.cod+" voltou para Novos");X();R()};
A.swx=function(id){var w=g(DB.pedidosweb,id);if(!w||w.st=="aprovado")return;if(!confirm("Excluir definitivamente o pedido "+w.cod+" ("+w.nome+")?"))return;var b=FS.writeBatch(fdb);b.delete(dref("pedidosweb",id));aud(b,"site_excluido","pedido","Pedido do site "+w.cod+" excluído ("+w.nome+" · "+brl(w.total)+")",{ref:id});b.commit().catch(fail);X();R()};
A.sv=function(id){var w=g(DB.pedidosweb,id);wset(id,"arquivado",{},"site_arquivado","Pedido do site "+w.cod+" arquivado");X();R()};
function wtxt(w,k){var o=w.oid&&g(DB.ord,w.oid),n0=w.nome.split(" ")[0],its=(o?o.items:w.items||[]).map(function(x){return"• "+qf(x.q)+"x "+x.n}).join("\n"),tt=o?tot(o):w.total,de=(o&&o.de)||w.de;
return{rec:"Olá, "+n0+"! Recebemos o seu pedido "+w.cod+" na Anelê 🌿. Já vamos conferir e te confirmo em seguida.",apr:"Olá, "+n0+"! Seu pedido "+w.cod+" foi confirmado ✅\n"+its+"\n*Total: "+brl(tt)+"*"+(o&&o.acr?" (já com "+(o.acd||"acréscimo").toLowerCase()+" de "+brl(o.acr)+")":" + taxa de entrega a combinar")+(de?"\nEntrega prevista: "+fd(de):"")+"\nComo prefere pagar?",fal:"Olá, "+n0+"! Do seu pedido "+w.cod+", infelizmente estamos sem alguns itens hoje. Posso trocar por outro ou tirar do pedido?",ent:"Olá, "+n0+"! Seu pedido "+w.cod+" saiu para entrega 🚚 Fresquinho a caminho!"}[k]}
A.wr=function(id){var w=g(DB.pedidosweb,id);$("sh").innerHTML='<div class="sc"><b class="h" style="font-size:1.2rem">Responder no WhatsApp</b><p class="m">Abre a conversa com '+esc(w.nome)+' com a mensagem pronta. Você pode editar antes de enviar.</p>'+[["rec","Pedido recebido"],["apr","Pedido aprovado (total e entrega)"],["fal","Produto em falta"],["ent","Saiu para entrega"]].map(function(x){return'<button class="bp ol" data-a="wsd" data-i="'+id+'|'+x[0]+'">'+x[1]+'</button>'}).join("")+'<button class="bp ol" data-a="x2">Fechar</button></div>';$("sh").hidden=false};
A.wsd=function(a){var p=a.split("|"),w=g(DB.pedidosweb,p[0]);A.x2();wa(wtxt(w,p[1]),w.tel)};
/* ----- Configurações > Loja online ----- */
V.loja=function(){var D=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
return'<button class="chip on" data-a="tab" data-i="cfg">← Configurações</button>'+sec_n("Pedidos pelo site")+'<div class="c"><label>Loja<select id="lj_aberta"><option value="1"'+(LJ.aberta?" selected":"")+'>Aberta para pedidos</option><option value="0"'+(LJ.aberta?"":" selected")+'>Fechada</option></select></label><label>WhatsApp que recebe os pedidos<input id="lj_tel" inputmode="numeric" value="'+esc(LJ.tel)+'"></label><label>Endereço do site (para compartilhar)<input id="lj_url" placeholder="https://..." value="'+esc(LJ.urlsite||"")+'"></label><label>Aviso no topo do site (opcional)<input id="lj_av" value="'+esc(LJ.aviso||"")+'"></label></div>'+sec_n("Entrega")+'<div class="c"><div class="m">Dias de entrega</div><div class="tb" style="flex-wrap:wrap;margin:8px 0">'+D.map(function(d,i){return'<button class="chip'+((LJ.dias||[]).indexOf(i)>=0?" on":"")+'" data-a="ljd" data-i="'+i+'">'+d+'</button>'}).join("")+'</div><label>Pedidos feitos até este horário valem para amanhã<input id="lj_corte" type="time" value="'+esc(LJ.corte||"")+'"></label><label>Pedido mínimo (R$) — vazio = sem mínimo<input id="lj_min" type="number" step="any" min="0" inputmode="decimal" value="'+(LJ.min||"")+'"></label><p class="m">Taxa de entrega: combinada pelo WhatsApp e lançada em Acréscimos ao aprovar.</p></div><button class="bp" data-a="ljs">Salvar</button><div id="lst">'+L.loja()+'</div>'+(LJ.urlsite?'<button class="bp ol" data-a="ljw">'+ic("share")+' Compartilhar link do site</button>':'')};
L.loja=function(){var pub=DB.catalogo.length,esg=DB.catalogo.filter(function(c){return!c.disp}).length;return sec_n("Catálogo no site")+'<div class="c"><b>'+pub+' produto(s) publicados · '+esg+' esgotado(s)</b><p class="m">'+(LJ.pub?"Atualiza sozinho quando você altera produtos, preços ou estoque (com o app aberto).":"Ainda não publicado. Toque em Publicar para começar.")+'</p><p class="m">Para esconder um produto do site: edite o produto e marque “Mostrar no site: Não”.</p><button class="bp ac" data-a="ljp">Publicar catálogo agora</button></div>'};
function ljread(){var v=function(i){var e=$(i);return e?e.value:null};if(v("lj_tel")===null)return;LJ.aberta=v("lj_aberta")=="1";LJ.tel=dg(v("lj_tel"))||LJ.tel;LJ.urlsite=v("lj_url").trim();LJ.aviso=v("lj_av").trim();LJ.corte=v("lj_corte")||"";LJ.min=r2(parseFloat(v("lj_min"))||0)}
A.ljd=function(i){ljread();var d=(LJ.dias||[]).slice(),k=d.indexOf(+i);if(k>=0)d.splice(k,1);else d.push(+i);LJ.dias=d.sort(function(a,b){return a-b});R()};
A.ljs=function(){ljread();var b=FS.writeBatch(fdb);b.set(dref("loja","config"),cln(Object.assign({},LJ,{ts:Date.now()})));aud(b,"loja_config","sistema","Configuração da loja online salva");b.commit().catch(fail);toast("Salvo.")};
A.ljp=function(){ljread();LJ.pub=true;var b=FS.writeBatch(fdb);b.set(dref("loja","config"),cln(Object.assign({},LJ,{ts:Date.now()})));b.commit().then(function(){syncCat(true)}).catch(fail)};
A.ljw=function(){ljread();Share.share({text:"Faça seu pedido de verduras e legumes na Anelê: "+LJ.urlsite}).catch(function(){})};
/* ----- catálogo público: só nome, preço, foto pequena, categoria e disponível/esgotado ----- */
function hsh(s){var h=0,i;for(i=0;i<s.length;i+=7)h=(h*31+s.charCodeAt(i))|0;return h+":"+s.length}
function thumbOf(src){return new Promise(function(res){if(!src)return res("");var k=hsh(src);if(THC[k]!==undefined)return res(THC[k]);var im=new Image(),fb=function(){THC[k]=src.length<30000?src:"";res(THC[k])};im.onload=function(){try{var w=im.width||160,h=im.height||160,s=Math.min(1,160/Math.max(w,h)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(w*s));c.height=Math.max(1,Math.round(h*s));c.getContext("2d").drawImage(im,0,0,c.width,c.height);THC[k]=c.toDataURL("image/jpeg",.72);res(THC[k])}catch(e){fb()}};im.onerror=fb;im.src=src})}
function sameCat(a,b){return a&&b&&a.n==b.n&&(a.ap||"")==b.ap&&(a.sku||"")==b.sku&&a.pr==b.pr&&(a.cat||"")==b.cat&&!!a.disp==b.disp&&(a.ih||"")==b.ih}
async function syncCat(manual){if(SYN||!G())return;SYN=1;try{var want={},ops=[],n=0,del=0,i,ids,p,ex,d;DB.prods.forEach(function(q){if(act(q)&&q.site!==false)want[q.id]=q});ids=Object.keys(want);
for(i=0;i<ids.length;i++){p=want[ids[i]];ex=g(DB.catalogo,p.id);d={n:p.n,ap:p.ap||"",sku:p.sku||"",pr:p.pr,cat:catName(p)||"",disp:p.st>0,ih:hsh(p.img||"")};if(ex&&sameCat(ex,d))continue;d.img=ex&&ex.ih==d.ih?(ex.img||""):await thumbOf(p.img);(function(pid,dd){ops.push(function(b){b.set(dref("catalogo",pid),dd)})})(p.id,d);n++}
DB.catalogo.forEach(function(c){if(!want[c.id]){del++;(function(cid){ops.push(function(b){b.delete(dref("catalogo",cid))})})(c.id)}});
var tm=topMap(),cs={},ex,top=tm.top.filter(function(id){return want[id]&&want[id].st>0}).slice(0,12);
Object.keys(tm.m).forEach(function(id){if(want[id]){var c=catName(want[id])||"Outros";cs[c]=(cs[c]||0)+tm.m[id].q}});ids.forEach(function(id){var c=catName(want[id])||"Outros";if(cs[c]===undefined)cs[c]=0});
var catord=Object.keys(cs).sort(function(x,y){return cs[y]-cs[x]||x.localeCompare(y)});ex={top:top,catord:catord};
var chg=JSON.stringify(ex)!=JSON.stringify({top:LJ.top||[],catord:LJ.catord||[]});
if(!ops.length&&!chg){SYN=0;if(manual)toast("O catálogo já está atualizado.");return}
ops.push(function(b){b.set(dref("loja","config"),cln(Object.assign({},LJ,ex,n+del?{ver:Date.now()}:{})))});if(manual)ops.push(function(b){aud(b,"catalogo_publicado","sistema","Catálogo do site atualizado: "+n+" produto(s) novos/alterados, "+del+" removido(s)")});
var k=0;(function nx(){if(k>=ops.length){SYN=0;if(manual)toast("Catálogo publicado no site.");return}var b=FS.writeBatch(fdb);ops.slice(k,k+15).forEach(function(f){f(b)});k+=15;b.commit().then(nx).catch(function(e){SYN=0;LASTSYN=Date.now();fail(e)})})()}catch(e){SYN=0;LASTSYN=Date.now();console.error(e)}}
function autoSync(){if(!G()||RU||SYN||!LJ.pub||Date.now()-LASTSYN<30000)return;clearTimeout(STM);STM=setTimeout(function(){syncCat(false)},2500)}

/* ===== v4.1: atualização do aplicativo pela internet (sem baixar APK) ===== */
var APPV=4004,APPN="4.4",UP={latest:null,min:+(function(){try{return localStorage.getItem("anele_minb")}catch(e){return 0}})()||0,waiting:false,dismissed:false,busy:false,go:false};
function updMin(){return Math.max(UP.min||0,(UP.latest&&UP.latest.min)||0)}
function updAvail(){return!!(UP.latest&&UP.latest.build>APPV)||UP.waiting}
function updUi(){var e=$("upd");if(!e)return;var mand=APPV<updMin();
if(mand){e.hidden=false;e.className="upd blk";e.innerHTML='<div><b>Atualização obrigatória</b><p>Para continuar, atualize o aplicativo. Leva alguns segundos.</p><button class="bp" data-a="upg">'+(UP.busy?"Atualizando…":"Atualizar agora")+'</button></div>';return}
if(updAvail()&&!UP.dismissed){e.hidden=false;e.className="upd";e.innerHTML='<span>Nova versão disponível'+(UP.latest&&UP.latest.name?" ("+esc(UP.latest.name)+")":"")+'</span><button class="chip on" data-a="upg">'+(UP.busy?"Atualizando…":"Atualizar")+'</button><button class="chip" data-a="upx">Depois</button>';return}
e.hidden=true;e.innerHTML=""}
async function updCheck(manual){try{var r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});if(r.ok)UP.latest=await r.json()}catch(e){}
try{var reg=await navigator.serviceWorker.getRegistration();if(reg){await reg.update();UP.waiting=!!reg.waiting&&!!navigator.serviceWorker.controller}}catch(e){}
try{var s=await FS.getDoc(dref("loja","app"));if(s.exists()){UP.min=+s.data().min||0;try{localStorage.setItem("anele_minb",String(UP.min))}catch(e){}}}catch(e){}
updUi();if(manual){toast(updAvail()?"Há uma versão nova.":"Seu app está atualizado.");if(me&&tab=="cfg")R()}}
async function updApply(){if(UP.busy)return;UP.busy=true;UP.go=true;updUi();
try{var reg=await navigator.serviceWorker.getRegistration();if(!reg){location.reload();return}await reg.update();var w=reg.waiting||reg.installing;if(!w){location.reload();return}
if(w.state!="installed"&&w.state!="activated")await new Promise(function(r){w.addEventListener("statechange",function(){if(w.state=="installed"||w.state=="activated")r()})});
(reg.waiting||w).postMessage("SKIP_WAITING");setTimeout(function(){if(UP.go)location.reload()},5000)}catch(e){location.reload()}}
A.upg=function(){updApply()};
A.upx=function(){UP.dismissed=true;updUi()};
A.upc=function(){updCheck(true)};
A.upm=function(v){if(me.r!="admin")return toast("Somente administrador.");var n=v=="1"?((UP.latest&&UP.latest.build)||APPV):0,b=FS.writeBatch(fdb);b.set(dref("loja","app"),{min:n,by:me.n,ts:Date.now()});aud(b,"app_obrigatoria","sistema",n?"Atualização obrigatória ligada (a partir da versão "+n+")":"Atualização voltou a ser opcional");b.commit().catch(fail);UP.min=n;try{localStorage.setItem("anele_minb",String(n))}catch(e){}updUi();R()};
function updSec(){var ad=me.r=="admin",mand=UP.min>0;return sec_n("Aplicativo")+'<div class="c"><div class="r"><b>Versão instalada</b><span>'+esc(APPN)+' (build '+APPV+')</span></div><div class="r" style="margin-top:8px"><span class="m">Última disponível</span><span>'+(UP.latest?esc(UP.latest.name||UP.latest.build):"—")+'</span></div><p class="m">'+(updAvail()?"Há uma versão nova para instalar.":"Seu app está atualizado.")+'</p><button class="bp" data-a="upc">Verificar atualização</button>'+(updAvail()?'<button class="bp ac" data-a="upg">Atualizar agora</button>':'')+(ad?'<div class="m" style="margin-top:14px"><b>Atualização obrigatória:</b> '+(mand?"ligada":"desligada")+'. Quando ligada, ninguém usa o app sem instalar a versão mais nova.</div><button class="bp ol" data-a="upm" data-i="'+(mand?"0":"1")+'">'+(mand?"Voltar a ser opcional":"Tornar obrigatória")+'</button>':'')+'</div>'}
if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").then(function(reg){reg.addEventListener("updatefound",function(){var w=reg.installing;if(w)w.addEventListener("statechange",function(){if(w.state=="installed"&&navigator.serviceWorker.controller){UP.waiting=true;updUi()}})});if(reg.waiting&&navigator.serviceWorker.controller){UP.waiting=true;updUi()}}).catch(function(){});navigator.serviceWorker.addEventListener("controllerchange",function(){if(UP.go)location.reload()})}
setTimeout(function(){updCheck(false)},1200);setInterval(function(){updCheck(false)},600000);document.addEventListener("visibilitychange",function(){if(!document.hidden)updCheck(false)});


document.addEventListener("click",function(e){var t=e.target.closest("[data-a]");if(t&&A[t.dataset.a])A[t.dataset.a](t.dataset.i)});
document.addEventListener("change",function(e){var t=e.target;if(t.dataset&&t.dataset.c)A[t.dataset.c](t.dataset.i,t.value);else if(t.dataset&&t.dataset.ph){PHload(t);t.value=""}});
document.addEventListener("input",function(e){var t=e.target;if(t.id=="f_d"||t.id=="f_acr")ri();else if(/^f_(cu|pr|mg|mk)$/.test(t.id)&&$("f_mg"))A.cal(t.id);else if(t.dataset&&t.dataset.kq){KQ=t.value;$("kl").innerHTML=kl()}else if(t.dataset&&t.dataset.q){Q=t.value;$("lst").innerHTML=L[tab]()}else if(t.dataset&&t.dataset.pq)A.pq(t.value)});
if(Capacitor.isNativePlatform())App.addListener("backButton",function(){if(!$("sh").hidden)A.x2();else if(!$("md").hidden)X();else if(me&&tab!="home")A.tab("home");else App.exitApp()});
window.addEventListener("online",function(){if(me&&ready())R()});window.addEventListener("offline",function(){if(me&&ready())R()});
load();
if(String(firebaseConfig.apiKey).indexOf("COLE")==0)$("app").innerHTML='<div class="lg"><h1>Admin Loja</h1><p class="m">Falta configurar o Firebase. Edite src/firebase-config.js com as chaves do seu projeto.</p></div>';
else{$("app").innerHTML='<p class="m" style="text-align:center;padding-top:40vh">Carregando…</p>';
AU.onAuthStateChanged(auth,function(u){if(BUSY)return;if(!u){unsub();me=null;PF={fs:"n",fav:[]};applyFs();GENDONE=0;R();return}enter(u)})}

/* ===== Suporte e cobrança (licença) =====
   O vencimento de cada cliente fica no arquivo licencas.json, que só você controla (LIC_URL).
   O cliente é identificado pelo projectId do Firebase dele. */
var LIC_URL="https://viniciusribeirovro-sudo.github.io/Anele-app/licencas.json",SUP0="5516981203204",
LIC={est:"livre",d:null,tol:5,nome:"",sup:"",pix:"",val:null,msg:"",ate:"",busy:0};
function lcLS(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function brDate(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||"");return m?m[3]+"/"+m[2]+"/"+m[1]:String(s||"")}
function licCalc(raw,pid,now){
var pad=(raw&&raw.padrao)||{},ent=(raw&&raw.clientes&&raw.clientes[pid])||null,
o={est:"livre",d:null,tol:5,nome:"",sup:"",pix:"",val:null,msg:"",ate:""};
o.sup=String((ent&&ent.suporte)||pad.suporte||SUP0||"").replace(/\D/g,"");if(o.sup.length<10)o.sup="";
o.pix=String((ent&&ent.pix)||pad.pix||"");
if(!ent)return o;
o.nome=ent.nome||"";o.val=ent.valor==null?null:+ent.valor;o.msg=ent.msg||"";o.ate=ent.ate||"";
var tol=ent.tolerancia!=null?+ent.tolerancia:(pad.tolerancia!=null?+pad.tolerancia:5),
av=ent.aviso!=null?+ent.aviso:(pad.aviso!=null?+pad.aviso:5);o.tol=tol;
if(ent.bloqueado===true){o.est="bloq";return o}
var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(o.ate);
if(!m){o.est="ok";return o}
var x=new Date(now),hoje0=new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime(),
d=Math.round((new Date(+m[1],+m[2]-1,+m[3]).getTime()-hoje0)/864e5);
o.d=d;o.est=d<(-tol)?"bloq":d<0?"venc":d<=av?"aviso":"ok";
return o}
async function licCheck(manual){
if(LIC.busy)return;LIC.busy=1;
var pid=String(firebaseConfig.projectId||""),raw=null,rede=true;
try{var r=await fetch(LIC_URL+"?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw 0;raw=await r.json();lcLS("lic_raw",JSON.stringify(raw))}
catch(e){rede=false;try{raw=JSON.parse(lcLS("lic_raw")||"null")}catch(x){raw=null}}
Object.assign(LIC,licCalc(raw,pid,Date.now()));LIC.busy=0;licUi();
if(manual)toast(rede?"Licença verificada.":"Sem conexão com o servidor de licença. Usando o último status salvo.")}
function licPay(){var h="";
if(LIC.val!=null)h+='<div class="r" style="margin-top:8px"><span class="m">Valor</span><b>'+brl(LIC.val)+'</b></div>';
if(LIC.ate)h+='<div class="r" style="margin-top:8px"><span class="m">Vencimento</span><b>'+brDate(LIC.ate)+'</b></div>';
if(LIC.pix)h+='<div class="m" style="margin-top:14px">Chave Pix</div><div class="lpx">'+esc(LIC.pix)+'</div><button class="bp" data-a="lcp">Copiar chave Pix</button>';
return h+'<button class="bp ac" data-a="lsup">'+(LIC.pix?"Enviar comprovante pelo WhatsApp":"Falar com o suporte")+'</button>'}
function licUi(){var e=$("lic");if(!e)return;var E=LIC.est,adm=!!(me&&me.r=="admin");
if(E=="bloq"){e.hidden=false;e.className="lic blk";
e.innerHTML='<div class="lcb"><h2>Acesso suspenso</h2><p class="m">'+esc(LIC.msg||"A mensalidade do aplicativo está em atraso. Regularize o pagamento para voltar a usar.")+'</p>'+licPay()+'<button class="bp ol" data-a="lchk">Já paguei, verificar de novo</button>'+(me?'<button class="bp ol dg" data-a="out">Sair</button>':'')+'</div>';return}
if(adm&&(E=="aviso"||E=="venc")){
var t=E=="venc"?"Mensalidade vencida há "+(-LIC.d)+" dia(s). O acesso será bloqueado em "+(LIC.d+LIC.tol+1)+" dia(s).":(LIC.d==0?"Sua mensalidade vence hoje.":"Sua mensalidade vence em "+LIC.d+" dia(s) ("+brDate(LIC.ate)+").");
e.hidden=false;e.className="lic"+(E=="venc"?" red":"");e.innerHTML='<span>'+t+'</span><button class="chip" data-a="lpay">Pagar</button>';return}
e.hidden=true;e.className="lic";e.innerHTML=""}
function licSec(){if(!me||me.r!="admin")return"";var E=LIC.est,s;
s=E=="livre"?"Sem plano cadastrado (uso liberado)":E=="bloq"?"Suspensa":E=="venc"?"Vencida há "+(-LIC.d)+" dia(s)":LIC.ate?"Ativa até "+brDate(LIC.ate)+(LIC.d>0?" ("+LIC.d+" dia(s))":LIC.d==0?" (vence hoje)":""):"Ativa";
return sec_n("Licença")+'<div class="c"><div class="r"><b>Mensalidade</b><span style="text-align:right">'+s+'</span></div>'+(LIC.val!=null?'<div class="r" style="margin-top:8px"><span class="m">Valor</span><span>'+brl(LIC.val)+'</span></div>':'')+'<button class="bp ol" data-a="lpay">Como pagar</button><button class="bp ol" data-a="lchk">Verificar agora</button></div>'}
A.sup=function(){if(!LIC.sup)return toast("O contato do suporte ainda não foi configurado.");
wa("Olá! Preciso de ajuda com o aplicativo Admin Loja (versão "+APPN+").\nLoja: "+(LIC.nome||firebaseConfig.projectId||"-")+"\nUsuário: "+(me?me.n:"(sem login)")+"\n\nMeu problema: ",LIC.sup)};
A.lsup=function(){if(!LIC.sup)return toast("O contato do suporte ainda não foi configurado.");
wa("Olá! Estou enviando o comprovante da mensalidade do Admin Loja.\nLoja: "+(LIC.nome||firebaseConfig.projectId||"-")+(LIC.ate?"\nVencimento: "+brDate(LIC.ate):"")+(LIC.val!=null?"\nValor: "+brl(LIC.val):""),LIC.sup)};
A.lcp=function(){var t=LIC.pix,ok=false,x=document.createElement("textarea"),bad=function(){toast("Não consegui copiar. Anote a chave exibida na tela.")};
x.value=t;x.style.cssText="position:fixed;opacity:0";document.body.appendChild(x);x.select();try{ok=document.execCommand("copy")}catch(e){}x.remove();
if(ok)return toast("Chave Pix copiada.");try{navigator.clipboard.writeText(t).then(function(){toast("Chave Pix copiada.")},bad)}catch(e){bad()}};
A.lpay=function(){$("sh").innerHTML='<div class="sc"><b class="h" style="font-size:1.2rem">Mensalidade do aplicativo</b>'+licPay()+'<button class="bp ol" data-a="x2">Fechar</button></div>';$("sh").hidden=false};
A.lchk=function(){licCheck(true)};
var _R=R;R=function(){_R.apply(this,arguments);licUi()};
licCheck();setInterval(licCheck,1800000);
document.addEventListener("visibilitychange",function(){if(!document.hidden)licCheck()});
window.addEventListener("online",function(){licCheck()});
