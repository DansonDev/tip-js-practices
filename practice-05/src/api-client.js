export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

// Создаёт URL относительно baseUrl и добавляет непустые параметры query.
// Значения кодируются средствами URL и URLSearchParams, а не вручную.
export function buildUrl(baseUrl, path, query = {}) {
  let base;
  try { base = new URL(baseUrl); } catch { throw new TypeError("baseUrl должен быть абсолютным HTTP-адресом."); }
  if (typeof baseUrl !== "string" || !["http:", "https:"].includes(base.protocol) || base.search || base.hash) {
    throw new TypeError("baseUrl должен использовать HTTP(S) без query и hash.");
  }
  if (typeof path !== "string" || !path.trim() || /^[a-z][a-z\d+.-]*:/i.test(path.trim())) {
    throw new TypeError("path должен быть непустым относительным путём.");
  }
  if (!isPlainObject(query)) throw new TypeError("query должен быть обычным объектом.");
  const url = new URL(base.href.replace(/\/+$/, "") + "/" + path.trim().replace(/^\/+|\/+$/g, ""));
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.href;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object"
    && [Object.prototype, null].includes(Object.getPrototypeOf(value));
}

function validateTimeout(value) {
  if (!Number.isInteger(value) || value <= 0 || value > 4294967295) {
    throw new TypeError("Тайм-аут должен быть положительным целым числом миллисекунд.");
  }
}

// fetchFn передаётся явно, чтобы модуль можно было проверить без реальной сети.
// Возвращаемый объект: { requestJson(path, { query, signal, timeoutMs } = {}) }.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 2000,
} = {}) {
  buildUrl(baseUrl, "/health");
  if (typeof fetchFn !== "function") throw new TypeError("fetchFn должен быть функцией.");
  validateTimeout(timeoutMs);

  async function requestJson(path, { query = {}, signal, timeoutMs: requestTimeout = timeoutMs } = {}) {
    const url = buildUrl(baseUrl, path, query);
    validateTimeout(requestTimeout);
    if (signal !== undefined && !(signal instanceof AbortSignal)) throw new TypeError("Некорректный AbortSignal.");
    const deadline = AbortSignal.timeout(requestTimeout);
    const combined = signal ? AbortSignal.any([signal, deadline]) : deadline;
    function transportError(cause) {
      const kind = combined.aborted ? (combined.reason === deadline.reason ? "timeout" : "aborted") : "network";
      const message = kind === "timeout" ? "Превышено время ожидания ответа."
        : kind === "aborted" ? "Запрос отменён вызывающим кодом." : "Не удалось получить ответ от сервера.";
      return new ApiError(message, { kind, url, cause });
    }
    let response;
    try {
      response = await fetchFn(url, { method: "GET", headers: { Accept: "application/json" }, signal: combined });
    } catch (cause) { throw transportError(cause); }
    if (!(response instanceof Response)) throw new ApiError("Сервер не вернул Response.", { kind: "invalid-response", url });
    if (!response.ok) {
      let payload;
      try { payload = await response.json(); } catch { /* HTTP-статус сохраняется и без JSON. */ }
      const error = payload?.error;
      throw new ApiError(typeof error?.message === "string" && error.message.trim() ? error.message : `Ошибка HTTP ${response.status}.`, {
        kind: "http", status: response.status, code: typeof error?.code === "string" ? error.code : null,
        details: error?.details ?? null, url,
      });
    }
    if (response.status === 204) return null;
    const mediaType = (response.headers.get("Content-Type") ?? "").split(";")[0].trim();
    if (!/^application\/(?:[\w.+-]+\+)?json$/i.test(mediaType)) {
      throw new ApiError("Ожидался ответ в формате JSON.", { kind: "invalid-response", url });
    }
    try { return await response.json(); }
    catch (cause) {
      if (combined.aborted) throw transportError(cause);
      throw new ApiError("Не удалось разобрать JSON ответа.", { kind: "invalid-response", url, cause });
    }
  }
  return { requestJson };
}
