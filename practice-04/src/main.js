import { demoTasks, variantTasks, variantNumber } from "./data.js";
import {
  addTask,
  findTaskById,
  removeTask,
  setTaskCompleted,
  updateTask,
} from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderEmptyState, renderSummary, renderTaskList } from "./task-view.js";
import { validateTaskDraft } from "./form-validation.js";
import { loadTasks, removeSavedTasks, saveTasks } from "./task-storage.js";

const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label"),
  storageStatus: document.querySelector("#storage-status"),
  form: document.querySelector("#task-form"),
  formHeading: document.querySelector("#form-heading"),
  formMode: document.querySelector("#form-mode"),
  formMessage: document.querySelector("#form-message"),
  idInput: document.querySelector("#task-id"),
  titleInput: document.querySelector("#task-title"),
  priorityInput: document.querySelector("#task-priority"),
  submitButton: document.querySelector("#form-submit"),
  cancelButton: document.querySelector("#cancel-edit"),
  resetButton: document.querySelector("#reset-data"),
};

const params = new URLSearchParams(window.location.search);
const isVariant = params.get("dataset") === "variant";
const isCheckRun = params.get("mode") === "check";
const initialTasks = isVariant ? variantTasks : demoTasks;
const datasetName = isVariant ? "variant" : "demo";
const storageKey = isCheckRun
  ? `tip-js-practice-04:checks:${datasetName}`
  : `tip-js-practice-04:${datasetName}`;

// Готовая граница запуска: даже незавершённый или ошибочный модуль хранилища
// не должен оставлять страницу без диагностического сообщения.
let loaded;
try {
  loaded = loadTasks(window.localStorage, storageKey, initialTasks);
} catch (error) {
  loaded = {
    ok: false,
    source: "fallback",
    tasks: initialTasks.map((task) => ({ ...task })),
    error: `Хранилище не инициализировано: ${error.message}`,
  };
  console.error(error);
}
let currentTasks = loaded.tasks;
let currentFilter = "all";
let editingId = null;

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";

if (loaded.source === "storage") {
  elements.storageStatus.textContent = "Данные восстановлены из localStorage.";
} else if (loaded.ok) {
  elements.storageStatus.textContent = "Используется исходный набор; сохранённых данных пока нет.";
} else {
  elements.storageStatus.textContent = loaded.error;
  elements.storageStatus.classList.add("is-warning");
}

function renderApp() {
  const visible = getVisibleTasks(currentTasks, currentFilter);
  renderTaskList(elements.list, visible);
  renderSummary(elements.summary, currentTasks, visible.length);
  renderEmptyState(elements.empty, currentTasks.length, visible.length);
  for (const button of elements.filters.querySelectorAll("button[data-filter]")) {
    const active = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

function clearFieldError(name) {
  const input = elements.form.elements.namedItem(name);
  const message = elements.form.querySelector(`[data-error-for="${name}"]`);
  if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
    input.setCustomValidity("");
    input.removeAttribute("aria-invalid");
  }
  if (message) message.textContent = "";
}

function clearFormErrors() {
  for (const name of ["id", "title", "priority"]) clearFieldError(name);
  elements.formMessage.textContent = "";
}

function showFormErrors(errors) {
  clearFormErrors();
  for (const [name, text] of Object.entries(errors)) {
    const input = elements.form.elements.namedItem(name);
    const message = elements.form.querySelector(`[data-error-for="${name}"]`);
    if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
      input.setCustomValidity(text);
      input.setAttribute("aria-invalid", "true");
    }
    if (message) message.textContent = text;
  }
  elements.form.reportValidity();
}

function setFormMode(id = null) {
  const task = id === null ? null : findTaskById(currentTasks, id);
  if (id !== null && !task) {
    elements.message.textContent = `Задача с id ${id} не найдена.`;
    return;
  }
  editingId = id;
  elements.form.reset();
  clearFormErrors();
  elements.idInput.disabled = id !== null;
  elements.cancelButton.hidden = id === null;
  if (task) {
    elements.idInput.value = String(task.id);
    elements.titleInput.value = task.title;
    elements.priorityInput.value = task.priority;
    elements.formHeading.textContent = "Редактирование задачи";
    elements.formMode.textContent = `Редактируется задача ${id}. Идентификатор и статус сохраняются.`;
    elements.submitButton.textContent = "Сохранить изменения";
    elements.titleInput.focus();
  } else {
    elements.formHeading.textContent = "Добавление задачи";
    elements.formMode.textContent = "Режим создания новой задачи.";
    elements.submitButton.textContent = "Добавить задачу";
    elements.idInput.focus();
  }
}

function persistCurrentTasks(successMessage) {
  let saved;
  try {
    saved = saveTasks(window.localStorage, storageKey, currentTasks);
  } catch (error) {
    saved = { ok: false, error: `Хранилище недоступно: ${error.message}` };
  }
  elements.storageStatus.classList.toggle("is-warning", !saved.ok);
  elements.storageStatus.textContent = saved.ok
    ? "Изменения сохранены в localStorage."
    : saved.error;
  elements.message.textContent = saved.ok ? successMessage : `${successMessage} ${saved.error}`;
  renderApp();
  return saved;
}

// Готовая вспомогательная функция из логики ПР3. После полной перерисовки
// возвращает фокус на действие той же задачи либо на активный фильтр.
function restoreTaskFocus(id, action) {
  const actionButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`,
  );
  const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
  (actionButton ?? filterButton)?.focus();
}

function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const draft = { id: formData.get("id"), title: formData.get("title"), priority: formData.get("priority") };
  const checked = validateTaskDraft(draft, currentTasks, editingId);
  if (!checked.ok) {
    showFormErrors(checked.errors);
    return;
  }
  const { id, title, priority } = checked.value;
  const result = editingId === null
    ? addTask(currentTasks, id, title, priority)
    : updateTask(currentTasks, id, title, priority);
  if (!result.ok) {
    elements.formMessage.textContent = result.error;
    return;
  }
  currentTasks = result.tasks;
  setFormMode();
  persistCurrentTasks("Задача сохранена.");
}

function handleTaskListClick(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-action]");
  if (!button || !elements.list.contains(button)) return;
  const action = button.dataset.action;
  if (!["toggle", "edit", "delete"].includes(action)) return;
  const card = button.closest("li[data-task-id]");
  if (!card || !elements.list.contains(card)) return;
  const id = Number(card.dataset.taskId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    elements.message.textContent = "Некорректный идентификатор задачи.";
    return;
  }
  const task = findTaskById(currentTasks, id);
  if (!task) { elements.message.textContent = `Задача с id ${id} не найдена.`; return; }
  if (action === "edit") { elements.message.textContent = ""; setFormMode(id); return; }
  const result = action === "toggle"
    ? setTaskCompleted(currentTasks, id, !task.completed) : removeTask(currentTasks, id);
  if (!result.ok) { elements.message.textContent = result.error; return; }
  currentTasks = result.tasks;
  if (action === "delete" && editingId === id) setFormMode();
  persistCurrentTasks(action === "delete" ? "Задача удалена." : "Статус изменён.");
  restoreTaskFocus(id, action);
}

function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-filter]");
  if (!button || !elements.filters.contains(button)) return;
  if (!["all", "pending", "completed"].includes(button.dataset.filter)) return;
  currentFilter = button.dataset.filter;
  elements.message.textContent = "";
  renderApp();
}

function handleResetClick() {
  let removed;
  try { removed = removeSavedTasks(window.localStorage, storageKey); }
  catch (error) { removed = { ok: false, error: `Хранилище недоступно: ${error.message}` }; }
  if (!removed.ok) {
    elements.message.textContent = removed.error;
    return;
  }
  currentTasks = initialTasks.map(task => ({ ...task }));
  currentFilter = "all";
  setFormMode();
  elements.storageStatus.classList.remove("is-warning");
  elements.storageStatus.textContent = "Восстановлен исходный набор; сохранённых данных нет.";
  elements.message.textContent = "Сохранённые данные сброшены.";
  renderApp();
}

// Дополнительное задание Б. Событие получает другая вкладка того же origin.
// Локальная запись уже обновляет свою вкладку через persistCurrentTasks.
function handleStorageChange(event) {
  if (event.key !== storageKey) return;
  try {
    if (event.storageArea !== window.localStorage) return;
    const next = loadTasks(window.localStorage, storageKey, initialTasks);
    currentTasks = next.tasks;
    setFormMode();
    elements.storageStatus.classList.toggle("is-warning", !next.ok);
    elements.storageStatus.textContent = next.ok
      ? next.source === "storage" ? "Данные обновлены из другой вкладки." : "Другая вкладка сбросила данные; восстановлен исходный набор."
      : next.error;
    elements.message.textContent = "";
    renderApp();
  } catch (error) {
    elements.storageStatus.classList.add("is-warning");
    elements.storageStatus.textContent = `Не удалось обновить данные из другой вкладки: ${error.message}`;
  }
}

elements.form.addEventListener("submit", handleFormSubmit);
elements.form.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
    clearFieldError(event.target.name);
  }
});
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);
elements.cancelButton.addEventListener("click", () => setFormMode());
elements.resetButton.addEventListener("click", handleResetClick);
window.addEventListener("storage", handleStorageChange);

try {
  setFormMode();
  renderApp();
} catch (error) {
  elements.message.textContent = `Ошибка запуска: ${error.message}`;
  console.error(error);
}

