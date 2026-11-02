const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
  const errors = {};
  const raw = draft ?? {};
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title || title.length > 100) errors.title = "Название должно содержать от 1 до 100 символов после trim.";
  if (!ALLOWED_PRIORITIES.has(raw.priority)) errors.priority = "Выберите корректный приоритет.";
  const numeric = typeof raw.categoryId === "number" || (typeof raw.categoryId === "string" && raw.categoryId.trim() !== "");
  const categoryId = numeric ? Number(raw.categoryId) : NaN;
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !Array.isArray(categories) || !categories.some(c => c.id === categoryId)) {
    errors.categoryId = "Выберите существующую категорию.";
  }
  const valid = Object.keys(errors).length === 0;
  return { valid, value: valid ? { title, priority:raw.priority, categoryId } : null, errors };
}
