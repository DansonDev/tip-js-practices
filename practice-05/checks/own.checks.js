import assert from "node:assert/strict";
import { createApiServer } from "../api/server.mjs";
import { ApiError, buildUrl, createApiClient } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";
import { loadInitialPartial } from "../src/partial-data.js";
import { variantFilters } from "../src/variant.js";
const server=createApiServer();
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const baseUrl=`http://127.0.0.1:${server.address().port}/api`;
const api=createTaskApi(createApiClient({baseUrl}));
let passed=0;
async function check(name,action){await action();passed++;console.log("OK: "+name);}
try {
  await check("Собственная комбинация четырёх фильтров и кириллица с &",async()=>{
    const filters=Object.freeze({completed:true,priority:"high",categoryId:2,q:"  обработку ошибок  "});
    const result=await api.getTasks(filters);
    assert.deepEqual(result.tasks.map(t=>t.id),[25]);
    assert.equal(filters.q,"  обработку ошибок  ");
    assert.equal(new URL(buildUrl(baseUrl,"/tasks",{q:"API & проверка?"})).searchParams.get("q"),"API & проверка?");
  });
  await check("HTTP: повтор priority вместе с q даёт INVALID_QUERY",async()=>{
    const repeated=createApiClient({baseUrl,fetchFn:(url,options)=>{
      const duplicate=new URL(url);duplicate.searchParams.append("priority","low");return fetch(duplicate,options);
    }});
    await assert.rejects(()=>repeated.requestJson("/tasks",{query:{priority:"high",q:"API"}}),e=>e instanceof ApiError&&e.kind==="http"&&e.status===400&&e.code==="INVALID_QUERY");
  });
  await check("Предварительная отмена с собственной причиной остаётся aborted",async()=>{
    const controller=new AbortController();controller.abort(new Error("Отменено до запуска"));
    await assert.rejects(()=>createApiClient({baseUrl}).requestJson("/tasks",{signal:controller.signal}),e=>e.kind==="aborted");
  });
  await check("Синтаксически верный JSON с дубликатами категорий отклоняется",async()=>{
    const broken=createTaskApi({requestJson:async()=>({data:[{id:2,name:"A"},{id:2,name:"B"}],meta:{total:2}})});
    await assert.rejects(()=>broken.getCategories(),e=>e.kind==="invalid-response");
  });
  await check("Индивидуальный вариант 3: high, пять ожидаемых id",async()=>{
    const result=await api.getTasks(variantFilters);
    assert.deepEqual(result.tasks.map(t=>t.id),[4,13,16,25,34]);assert.equal(result.meta.total,5);
  });
  for (const failTasks of [false,true]) for (const failCategories of [false,true]) {
    await check(`allSettled: отказ задач=${failTasks}, категорий=${failCategories}`,async()=>{
      const part={getTasks:async()=>{if(failTasks)throw new ApiError("tasks offline",{kind:"network"});return {tasks:[],meta:{total:0}};},getCategories:async()=>{if(failCategories)throw new ApiError("categories offline",{kind:"network"});return [{id:1,name:"Учёба"}];}};
      const result=await loadInitialPartial(part);
      assert.equal(result.tasks.ok,!failTasks);assert.equal(result.categories.ok,!failCategories);
      if(!failTasks)assert.deepEqual(result.tasks.value,{tasks:[],meta:{total:0}});
      if(!failCategories)assert.equal(result.categories.value[0].id,1);
      if(failTasks)assert.equal(result.tasks.error.kind,"network");
      if(failCategories)assert.equal(result.categories.error.kind,"network");
    });
  }
} finally {await new Promise(resolve=>server.close(resolve));}
console.log(`Собственных групп пройдено: ${passed}; ошибок: 0.`);
