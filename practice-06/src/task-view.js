const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

export function createTaskElement(task, category) {
  const item = document.createElement("li");
  item.className = "task-card";
  item.classList.toggle("is-completed", task.completed);
  item.dataset.taskId = String(task.id);
  const heading = document.createElement("h3");
  heading.className = "task-title";
  heading.textContent = task.title;
  const meta = document.createElement("div");
  meta.className = "task-meta";
  for (const [className, text] of [["task-status",task.completed ? "Выполнена" : "В работе"],["task-priority",PRIORITY_LABELS[task.priority]],["task-category",category?.name ?? "Неизвестная категория"]]) {
    const span = document.createElement("span"); span.className = className; span.textContent = text; meta.append(span);
  }
  const actions = document.createElement("div"); actions.className = "task-actions";
  for (const [action, label] of [["toggle",task.completed ? "Вернуть в работу" : "Выполнить"],["edit","Изменить"],["delete","Удалить"]]) {
    const button = document.createElement("button"); button.type = "button"; button.dataset.action = action;
    if (action === "toggle") button.setAttribute("aria-pressed",String(task.completed));
    if (action === "delete") button.className = "danger";
    const span = document.createElement("span"); span.className = "action-label"; span.textContent = label; button.append(span); actions.append(button);
  }
  item.append(heading,meta,actions);
  return item;
}

export function renderTaskList(list, tasks, categories) {
  const byId = new Map(categories.map(category => [category.id,category]));
  list.replaceChildren(...tasks.map(task => createTaskElement(task, byId.get(task.categoryId))));
}
