// Только локальная лабораторная страница для Chrome DevTools. API не изменяется.
import http from "node:http";
import { readFile } from "node:fs/promises";
const root=new URL("../",import.meta.url);
const allowed=new Set(["examples/browser-lab.html","examples/browser-lab.js","src/api-client.js"]);
const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,"http://127.0.0.1:5515").pathname;
  const name=pathname==="/"?"examples/browser-lab.html":pathname.slice(1);
  if(req.method!=="GET"||!allowed.has(name)){res.writeHead(404);res.end();return;}
  try {const text=await readFile(new URL(name,root));res.writeHead(200,{"Content-Type":name.endsWith(".html")?"text/html; charset=utf-8":"text/javascript; charset=utf-8","Cache-Control":"no-store"});res.end(text);}
  catch {res.writeHead(500);res.end();}
});
server.listen(5515,"127.0.0.1",()=>console.log("Лаборатория ПР5: http://127.0.0.1:5515/"));
