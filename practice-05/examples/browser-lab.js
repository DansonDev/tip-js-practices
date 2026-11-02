import { createApiClient } from "../src/api-client.js";
// Большой лимит только для пошаговой отладки; рабочий main.js использует 2000 мс.
const client=createApiClient({baseUrl:"http://127.0.0.1:5505/api",timeoutMs:300000});
const result=document.querySelector("#result");
async function run(path,options) {
  try {const payload=await client.requestJson(path,options);result.textContent=JSON.stringify(payload,null,2);}
  catch(error) {result.textContent=JSON.stringify({name:error.name,kind:error.kind,status:error.status,code:error.code,details:error.details,url:error.url,message:error.message},null,2);}
}
document.querySelector("#load-tasks").addEventListener("click",()=>run("/tasks",{query:{priority:"high"}}));
document.querySelector("#load-missing").addEventListener("click",()=>run("/tasks/999"));
