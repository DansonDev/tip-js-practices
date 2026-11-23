import { ApiError } from './errors.js';

const filterNames = new Set(['completed', 'priority', 'categoryId', 'q']);
const priorities = new Set(['low', 'medium', 'high']);

export function parsePositiveId(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

function invalidQuery(message) {
  return new ApiError(400, 'INVALID_QUERY', message);
}

export function parseFilters(searchParams) {
  const seen = new Set();
  for (const key of searchParams.keys()) {
    if (!filterNames.has(key)) throw invalidQuery(`Неизвестный параметр: ${key}.`);
    if (seen.has(key)) throw invalidQuery(`Параметр ${key} передан больше одного раза.`);
    seen.add(key);
  }

  const rawCompleted = searchParams.get('completed');
  if (rawCompleted !== null && rawCompleted !== 'true' && rawCompleted !== 'false') {
    throw invalidQuery('Параметр completed принимает true или false.');
  }
  const completed = rawCompleted === null ? null : rawCompleted === 'true';

  const priority = searchParams.get('priority');
  if (priority !== null && !priorities.has(priority)) {
    throw invalidQuery('Приоритет должен быть low, medium или high.');
  }

  const rawCategory = searchParams.get('categoryId');
  const categoryId = parsePositiveId(rawCategory);
  if (rawCategory !== null && categoryId === null) {
    throw invalidQuery('Параметр categoryId должен быть положительным безопасным целым числом без ведущих нулей.');
  }

  const q = (searchParams.get('q') ?? '').trim();
  if (q.length > 100) throw invalidQuery('Строка поиска должна содержать до 100 символов.');
  return { completed, priority, categoryId, q };
}
