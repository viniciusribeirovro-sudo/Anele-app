/* Service worker do app: guarda uma cópia para funcionar sem internet e só troca de versão quando o usuário aceita. */
const BUILD="4003",CACHE="anele-app-"+BUILD,CDN="anele-cdn";
const FILES=["./", "index.html", "app.js", "firebase-config.js", "cap.js", "manifest.webmanifest", "logo.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:"reload"})))))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("anele-app-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("message",e=>{if(e.data==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(u.origin===location.origin){
    if(u.pathname.endsWith("/version.json")){e.respondWith(fetch(r,{cache:"no-store"}).catch(()=>new Response("{}",{headers:{"content-type":"application/json"}})));return}
    e.respondWith(caches.open(CACHE).then(c=>c.match(r,{ignoreSearch:true})).then(h=>h||fetch(r).catch(()=>r.mode==="navigate"?caches.open(CACHE).then(c=>c.match("index.html")):Response.error())));return}
  if(u.hostname==="www.gstatic.com"){e.respondWith(caches.open(CDN).then(c=>c.match(r).then(h=>h||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}))))}
});
