const priorities = new Set(['low', 'medium', 'high']);

export function validateTaskDraft(draft, categories) {
  const title = typeof draft?.title === 'string' ? draft.title.trim() : '';
  const priority = draft?.priority;
  const rawCategoryId = draft?.categoryId;
  const categoryId = typeof rawCategoryId === 'number' ||
    (typeof rawCategoryId === 'string' && rawCategoryId.trim() !== '')
    ? Number(rawCategoryId)
    : NaN;
  const errors = {};

  if (title.length < 1 || title.length > 100) errors.title = 'Введите от 1 до 100 символов без учёта крайних пробелов.';
  if (!priorities.has(priority)) errors.priority = 'Выберите корректный приоритет.';
  if (!categories.some(category => category.id === categoryId)) errors.categoryId = 'Выберите существующую категорию.';

  return { valid: Object.keys(errors).length === 0, value: { title, priority, categoryId }, errors };
}

export function selectTasks(tasks, { q, completed, priority, categoryId }) {
  const search = q.trim().toLowerCase();
  return tasks.filter(task =>
    (!search || task.title.toLowerCase().includes(search)) &&
    (!completed || task.completed === (completed === 'true')) &&
    (!priority || task.priority === priority) &&
    (!categoryId || task.categoryId === Number(categoryId)),
  );
}

export function getTaskStats(tasks) {
  const completed = tasks.filter(task => task.completed).length;
  return { total: tasks.length, completed, active: tasks.length - completed };
}

export function addTask(tasks, { title, priority, categoryId }, id) {
  if (!Number.isInteger(id) || id <= 0 || tasks.some(task => task.id === id)) {
    throw new RangeError('Идентификатор задачи должен быть положительным, целым и уникальным.');
  }
  return [...tasks, { id, title, priority, categoryId, completed: false }];
}

export function updateTask(tasks, id, { title, priority, categoryId }) {
  return tasks.map(task => task.id === id ? { ...task, title, priority, categoryId } : task);
}

export function toggleTask(tasks, id) {
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
}

export function removeTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}
