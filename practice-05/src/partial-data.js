// Дополнительное задание А. Частичный результат не меняет loadInitialData.
export async function loadInitialPartial(api, filters = {}) {
  const results = await Promise.allSettled([api.getTasks(filters), api.getCategories()]);
  function describe(result) {
    if (result.status === "fulfilled") return { ok: true, value: result.value };
    const error=result.reason;
    return { ok:false, error:{kind:error.kind ?? "unknown",message:error.message,status:error.status ?? null,code:error.code ?? null} };
  }
  return { tasks:describe(results[0]), categories:describe(results[1]) };
}
