/* Ponte entre o app e os plugins nativos do Capacitor (sem build). Na web, usa os recursos do navegador. */
const C=window.Capacitor||null;
const native=!!(C&&C.isNativePlatform&&C.isNativePlatform());
const plug=n=>{try{return C&&C.registerPlugin?C.registerPlugin(n):null}catch(e){return null}};
export const Capacitor={isNativePlatform:()=>native};
const P={Share:native?plug("Share"):null,Filesystem:native?plug("Filesystem"):null,Browser:native?plug("Browser"):null,App:native?plug("App"):null};
export const Share={share:o=>P.Share?P.Share.share(o):(navigator.share?navigator.share(o):Promise.reject(new Error("share indisponível")))};
export const Filesystem={writeFile:o=>P.Filesystem?P.Filesystem.writeFile(o):Promise.reject(new Error("filesystem indisponível"))};
export const Directory={Cache:"CACHE"};
export const Browser={open:o=>P.Browser?P.Browser.open(o):(window.open(o.url,"_blank"),Promise.resolve())};
export const App={addListener:(e,f)=>P.App?P.App.addListener(e,f):Promise.resolve({remove(){}}),exitApp:()=>P.App?P.App.exitApp():Promise.resolve()};
