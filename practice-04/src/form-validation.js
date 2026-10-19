const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Чистая проверка данных формы. DOM и показ сообщений выполняются в main.js.
// draft: { id, title, priority }; editingId: null либо id редактируемой задачи.
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  const raw = draft ?? {};
  let id;
  if (editingId === null) {
    const validType = typeof raw.id === "number" || (typeof raw.id === "string" && raw.id.trim() !== "");
    id = validType ? Number(raw.id) : NaN;
    if (!Number.isSafeInteger(id) || id <= 0) {
      errors.id = "Введите положительный безопасный целый идентификатор.";
    } else if (tasks.some(task => task.id === id)) {
      errors.id = "Задача с таким идентификатором уже существует.";
    }
  } else {
    id = editingId;
    if (!Number.isSafeInteger(id) || id <= 0 || !tasks.some(task => task.id === id)) {
      errors.id = "Редактируемая задача не найдена или её идентификатор некорректен.";
    }
  }
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (title.length < 1 || title.length > 100) {
    errors.title = "Название должно содержать от 1 до 100 символов после удаления пробелов по краям.";
  }
  if (!ALLOWED_PRIORITIES.has(raw.priority)) errors.priority = "Выберите low, medium или high.";
  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value: { id, title, priority: raw.priority } };
}

