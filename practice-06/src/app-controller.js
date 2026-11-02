import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  const apiMethods = ["loadInitialData","getTasks","createTask","updateTask","setTaskCompleted","deleteTask","resetDemoData"];
  const viewMethods = ["setListState","setTasks","setCategories","setTotal","setFormTask","showFormErrors","setMutationPending","notify"];
  if (!api || apiMethods.some(name => typeof api[name] !== "function")
    || !view || viewMethods.some(name => typeof view[name] !== "function") || typeof validateDraft !== "function") {
    throw new TypeError("Контроллеру нужны API, представление и валидатор с указанными методами.");
  }
  let tasks = [], categories = [], filters = {}, editingId = null;
  let hasCategories = false, generation = 0, activeLoad = null, mutationPending = false, destroyed = false;

  async function loadCurrentTasks() {
    if (destroyed) return;
    activeLoad?.abort();
    const version = ++generation;
    const controller = new AbortController(); activeLoad = controller;
    view.setListState("loading");
    try {
      const initial = !hasCategories;
      const result = initial
        ? await api.loadInitialData({ ...filters }, { signal:controller.signal })
        : await api.getTasks({ ...filters }, { signal:controller.signal });
      if (destroyed || version !== generation || controller.signal.aborted) return;
      if (initial) { categories = result.categories; hasCategories = true; view.setCategories(categories); }
      tasks = result.tasks;
      view.setTasks(tasks,categories); view.setTotal(result.meta.total);
      view.setListState(tasks.length ? "ready" : "empty");
    } catch (error) {
      if (destroyed || version !== generation || controller.signal.aborted || error.kind === "aborted") return;
      view.setListState("error",messageForError(error));
    }
  }
  function cancelEdit() { editingId = null; view.setFormTask(null); view.showFormErrors({}); }
  async function mutate(operation, success) {
    if (destroyed || mutationPending) return;
    mutationPending = true; view.setMutationPending(true);
    try {
      await operation();
      if (destroyed) return;
      view.notify(success,"success");
      await loadCurrentTasks();
    } catch (error) {
      if (!destroyed && error.kind !== "aborted") {
        view.notify(messageForError(error),"error");
        if (error.kind === "http" && error.details && typeof error.details === "object") view.showFormErrors(error.details);
      }
    } finally {
      mutationPending = false;
      if (!destroyed) view.setMutationPending(false);
    }
  }
  function currentTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task && !destroyed) view.notify("Задача отсутствует в текущем списке. Обновите данные.","error");
    return task;
  }
  return {
    start(initialFilters = {}) { filters = { ...initialFilters }; return loadCurrentTasks(); },
    applyFilters(next = {}) { filters = { ...next }; return loadCurrentTasks(); },
    refresh:loadCurrentTasks,
    async submit(draft) {
      if (destroyed || mutationPending) return;
      const checked = validateDraft(draft,categories);
      view.showFormErrors(checked.errors);
      if (!checked.valid) return;
      const id = editingId;
      return mutate(async()=>{
        if (id === null) await api.createTask(checked.value);
        else await api.updateTask(id,checked.value);
        if (!destroyed) cancelEdit();
      }, id === null ? "Задача создана." : "Изменения сохранены.");
    },
    beginEdit(id) {
      if (destroyed || mutationPending) return;
      const task = currentTask(id); if (!task) return;
      editingId = id; view.showFormErrors({}); view.setFormTask(task);
    },
    cancelEdit,
    toggleTask(id) {
      const task = currentTask(id); if (!task) return;
      return mutate(()=>api.setTaskCompleted(id,!task.completed),"Статус изменён.");
    },
    deleteTask(id) {
      if (!currentTask(id)) return;
      return mutate(async()=>{ await api.deleteTask(id); if (!destroyed && editingId === id) cancelEdit(); },"Задача удалена.");
    },
    resetData() { return mutate(async()=>{ await api.resetDemoData(); if (!destroyed) cancelEdit(); },"Исходные данные восстановлены."); },
    destroy() { destroyed = true; ++generation; activeLoad?.abort(); },
  };
}
