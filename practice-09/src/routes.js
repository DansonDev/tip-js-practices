import { Router } from 'express';
import { ApiError } from './errors.js';
import { parseFilters, parsePositiveId } from './validation.js';

export function createRouter(store) {
  const router = Router({ caseSensitive: true });

  router.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));

  router.get('/categories', (req, res) => {
    const data = store.listCategories();
    res.json({ data, meta: { total: data.length } });
  });

  router.get('/tasks', (req, res) => {
    const { searchParams } = new URL(req.originalUrl, 'http://localhost');
    const filters = parseFilters(searchParams);
    const data = store.listTasks(filters);
    res.json({ data, meta: { total: data.length, filters } });
  });

  router.get('/tasks/:id', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (id === null) throw new ApiError(400, 'INVALID_ID', 'Некорректный идентификатор задачи.');

    const task = store.getTask(id);
    if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', 'Задача не найдена.', { id });

    res.json({ data: task });
  });

  router.all(['/health', '/categories', '/tasks', '/tasks/:id'], (req, res) => {
    res.set('Allow', 'GET, HEAD, OPTIONS');
    throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Для этого маршрута доступны GET, HEAD и OPTIONS.');
  });

  return router;
}
