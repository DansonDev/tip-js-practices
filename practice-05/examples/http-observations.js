import { createApiClient } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";
const baseUrl = process.env.API_URL ?? "http://127.0.0.1:5505/api";
const client = createApiClient({ baseUrl });
const api = createTaskApi(client);
const observations = [];
for (const path of ["/health", "/tasks", "/tasks?completed=false&priority=high", "/tasks/25", "/tasks/999", "/categories"]) {
  const response = await fetch(baseUrl + path);
  observations.push({ path, status: response.status, ok: response.ok, contentType: response.headers.get("content-type"), payload: await response.json() });
}
const errors = [];
for (const [path, options] of [["/tasks/999"], ["/tasks", {query:{completed:"yes"}}], ["/debug/error"], ["/debug/invalid-json"], ["/debug/text"], ["/debug/delay",{query:{ms:150},timeoutMs:20}]]) {
  try { await client.requestJson(path, options); }
  catch (error) { errors.push({ path, kind:error.kind, status:error.status, code:error.code, details:error.details, message:error.message, url:error.url }); }
}
const controller = new AbortController();
const pending = client.requestJson("/debug/delay",{query:{ms:150},signal:controller.signal,timeoutMs:1000});
controller.abort();
try { await pending; } catch(error) { errors.push({path:"явная отмена",kind:error.kind,status:error.status,code:error.code}); }
const timings = { sequential:[], parallel:[] };
for (let i=0;i<3;i++) {
  const started=performance.now();
  await client.requestJson("/debug/delay",{query:{ms:100}});
  await client.requestJson("/debug/delay",{query:{ms:100}});
  timings.sequential.push(Number((performance.now()-started).toFixed(1)));
}
for (let i=0;i<3;i++) {
  const started=performance.now();
  await Promise.all([client.requestJson("/debug/delay",{query:{ms:100}}),client.requestJson("/debug/delay",{query:{ms:100}})]);
  timings.parallel.push(Number((performance.now()-started).toFixed(1)));
}
const all=await api.getTasks();
const initial=await api.loadInitialData({completed:false,priority:"high"});
console.log(JSON.stringify({observations,errors,timings,domain:{allIds:all.tasks.map(t=>t.id),initialIds:initial.tasks.map(t=>t.id),categories:initial.categories,meta:initial.meta}},null,2));
