import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") throw new TypeError("Нужен клиент с requestJson.");
  function normalizeFilters(filters) {
    if (!filters || typeof filters !== "object" || ![Object.prototype, null].includes(Object.getPrototypeOf(filters))) {
      throw new TypeError("Фильтры должны быть обычным объектом.");
    }
    const query = {};
    for (const [key, value] of Object.entries(filters)) {
      if (!ALLOWED_FILTERS.has(key)) throw new TypeError(`Неизвестный фильтр: ${key}.`);
      if (value === undefined) continue;
      if (key === "completed" && typeof value !== "boolean") throw new TypeError("completed должен быть boolean.");
      if (key === "priority" && !ALLOWED_PRIORITIES.has(value)) throw new TypeError("Некорректный приоритет.");
      if (key === "categoryId" && !isPositiveSafeInteger(value)) throw new TypeError("Некорректная категория.");
      if (key === "q") {
        if (typeof value !== "string" || value.trim().length > 100) throw new TypeError("Поиск должен быть строкой до 100 символов.");
        if (value.trim()) query.q = value.trim();
      } else query[key] = value;
    }
    return query;
  }
  function collection(payload, predicate) {
    if (!Array.isArray(payload?.data) || !payload.data.every(predicate)
      || new Set(payload.data.map(item => item.id)).size !== payload.data.length
      || payload.meta?.total !== payload.data.length) throw invalidResponse("Неверная схема коллекции или meta.total.");
    return payload.data;
  }
  async function getTasks(filters = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query });
    return { tasks: collection(payload, isTask), meta: payload.meta };
  }
  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) throw new TypeError("id должен быть положительным безопасным целым числом.");
    const payload = await client.requestJson(`/tasks/${id}`);
    if (!isTask(payload?.data) || payload.data.id !== id) throw invalidResponse("Неверная схема или id задачи.");
    return payload.data;
  }
  async function getCategories() {
    return collection(await client.requestJson("/categories"), isCategory);
  }
  async function loadInitialData(filters = {}) {
    const query = normalizeFilters(filters);
    const [result, categories] = await Promise.all([getTasks(query), getCategories()]);
    return { tasks: result.tasks, categories, meta: result.meta };
  }
  return { getTasks, getTaskById, getCategories, loadInitialData };
}
