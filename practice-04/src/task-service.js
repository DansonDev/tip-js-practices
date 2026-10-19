function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

function validateTitle(title) {
  if (typeof title !== "string") return { ok: false, error: "Название должно быть строкой." };
  const normalized = title.trim();
  if (normalized.length < 1 || normalized.length > 100) {
    return { ok: false, error: "Название должно содержать от 1 до 100 символов после удаления краевых пробелов." };
  }
  return { ok: true, title: normalized };
}

export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) return { ok: false, error: "Идентификатор должен быть положительным безопасным целым числом." };
  const checked = validateTitle(title);
  if (!checked.ok) return checked;
  if (!["low", "medium", "high"].includes(priority)) {
    return { ok: false, error: "Приоритет должен быть low, medium или high." };
  }
  return { ok: true, task: { id, title: checked.title, completed: false, priority } };
}

export function findTaskById(tasks, id) {
  return tasks.find(task => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter(task => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map(task => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed === true).length;
  return { total, completed, pending: total - completed, progress: total === 0 ? 0 : completed / total * 100 };
}

export function addTask(tasks, id, title, priority = "medium") {
  const result = createTask(id, title, priority);
  if (!result.ok) return result;
  if (findTaskById(tasks, id)) return { ok: false, error: `Задача с id ${id} уже существует.` };
  return { ok: true, tasks: [...tasks, result.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  if (!isValidId(id)) return { ok: false, error: "Идентификатор должен быть положительным безопасным целым числом." };
  if (typeof completed !== "boolean") return { ok: false, error: "Статус должен быть строго true или false." };
  if (!findTaskById(tasks, id)) return { ok: false, error: `Задача с id ${id} не найдена.` };
  return { ok: true, tasks: tasks.map(task => task.id === id ? { ...task, completed } : task) };
}

export function renameTask(tasks, id, title) {
  if (!isValidId(id)) return { ok: false, error: "Идентификатор должен быть положительным безопасным целым числом." };
  const checked = validateTitle(title);
  if (!checked.ok) return checked;
  if (!findTaskById(tasks, id)) return { ok: false, error: `Задача с id ${id} не найдена.` };
  return { ok: true, tasks: tasks.map(task => task.id === id ? { ...task, title: checked.title } : task) };
}

export function removeTask(tasks, id) {
  if (!isValidId(id)) return { ok: false, error: "Идентификатор должен быть положительным безопасным целым числом." };
  if (!findTaskById(tasks, id)) return { ok: false, error: `Задача с id ${id} не найдена.` };
  return { ok: true, tasks: tasks.filter(task => task.id !== id) };
}

export function updateTask(tasks, id, title, priority) {
  if (!["low", "medium", "high"].includes(priority)) {
    return { ok: false, error: "Приоритет должен быть low, medium или high." };
  }
  const checked = createTask(id, title, priority);
  if (!checked.ok) return checked;
  if (!findTaskById(tasks, id)) return { ok: false, error: `Задача с id ${id} не найдена.` };
  return {
    ok: true,
    tasks: tasks.map(task => task.id === id
      ? { ...task, title: checked.task.title, priority: checked.task.priority } : task),
  };
}
