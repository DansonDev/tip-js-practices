const frame = document.querySelector("#frame");
const protocol = document.querySelector("#protocol");
const demoKey = "tip-js-practice-04:checks:demo";
const variantKey = "tip-js-practice-04:checks:variant";
let sequence = 0;
let passed = 0;
let failed = 0;
function same(actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
}
function fresh(variant = false, clear = true) {
  if (clear) localStorage.removeItem(variant ? variantKey : demoKey);
  return new Promise(resolve => {
    frame.addEventListener("load", () => resolve(frame.contentDocument), { once: true });
    frame.src = `../index.html?mode=check&own=${++sequence}${variant ? "&dataset=variant" : ""}`;
  });
}
function input(doc, selector, value) {
  const field = doc.querySelector(selector);
  field.value = String(value);
  field.dispatchEvent(new doc.defaultView.Event("input", { bubbles: true }));
}
function fill(doc, id, title, priority) {
  if (id !== undefined) input(doc, "#task-id", id);
  input(doc, "#task-title", title);
  input(doc, "#task-priority", priority);
}
const submit = doc => doc.querySelector("#task-form").requestSubmit();
const click = (doc, selector) => doc.querySelector(selector).click();
const row = id => `#task-list > [data-task-id="${id}"]`;
const ids = doc => [...doc.querySelectorAll("#task-list > li")].map(node => Number(node.dataset.taskId));
const stats = doc => [...doc.querySelectorAll("#task-summary [data-stat]")].map(node => node.textContent);
async function check(name, action) {
  const item = document.createElement("li");
  try { await action(); passed += 1; item.textContent = `OK: ${name}`; }
  catch (error) { failed += 1; item.textContent = `FAIL: ${name}: ${error.message}`; }
  document.querySelector("#results").append(item);
  protocol.textContent += `${item.textContent}\n`;
}
function state(label, doc, expectedIds, expectedStats) {
  same(ids(doc), expectedIds); same(stats(doc), expectedStats);
  protocol.textContent += `${label}: id=${JSON.stringify(ids(doc))}; сводка=${stats(doc).join("/")}\n`;
}

await check("Граница формы: название 100 символов, отказ при пробелах и отмена редактирования", async () => {
  const doc = await fresh();
  fill(doc, 55, "x".repeat(100), "medium"); submit(doc);
  same(doc.querySelector(`${row(55)} .task-title`).textContent.length, 100);
  click(doc, `${row(55)} [data-action="edit"] span`);
  fill(doc, undefined, "   ", "low"); submit(doc);
  same(doc.querySelector("#task-title").getAttribute("aria-invalid"), "true");
  same(doc.querySelector("#task-id").disabled, true);
  same(doc.querySelector(`${row(55)} .task-title`).textContent.length, 100);
  click(doc, "#cancel-edit");
  same(doc.querySelector("#task-id").disabled, false);
  same(doc.querySelector("#task-title").value, "");
});

await check("Восстановление: добавление, выполнение, редактирование и два удаления до перезагрузки", async () => {
  let doc = await fresh();
  fill(doc, 99, "Новая проверка", "high"); submit(doc);
  click(doc, `${row(99)} [data-action="toggle"] span`);
  click(doc, `${row(99)} [data-action="edit"] span`);
  fill(doc, undefined, "  Обновлённая проверка  ", "low"); submit(doc);
  for (const id of [4, 7]) click(doc, `${row(id)} [data-action="delete"] span`);
  doc = await fresh(false, false);
  same(ids(doc), [1, 10, 99]);
  same(stats(doc), ["3", "3", "0", "100.0%", "3"]);
  same(doc.querySelector(`${row(99)} .task-title`).textContent, "Обновлённая проверка");
  same(doc.querySelector(`${row(99)} .task-priority`).textContent, "Низкий");
});

await check("Повреждение схемы: повторяющиеся id дают fallback, посторонний ключ сохраняется", async () => {
  localStorage.setItem("tip-js-practice-04:own-sentinel", "keep");
  const task = { id: 1, title: "Дубликат", completed: false, priority: "low" };
  localStorage.setItem(demoKey, JSON.stringify({ version: 1, tasks: [task, task] }));
  const doc = await fresh(false, false);
  same(ids(doc), [1, 4, 7, 10]);
  same(doc.querySelector("#storage-status").classList.contains("is-warning"), true);
  click(doc, "#reset-data");
  same(localStorage.getItem(demoKey), null);
  same(localStorage.getItem("tip-js-practice-04:own-sentinel"), "keep");
  localStorage.removeItem("tip-js-practice-04:own-sentinel");
});

await check("Общий контрольный сценарий: все восемь этапов подряд", async () => {
  let doc = await fresh();
  click(doc, "#reset-data");
  state("Шаг 0", doc, [1, 4, 7, 10], ["4", "2", "2", "50.0%", "4"]);
  fill(doc, 20, "Изучить localStorage", "high"); submit(doc);
  state("Шаг 1", doc, [1, 4, 7, 10, 20], ["5", "2", "3", "40.0%", "5"]);
  const saved = localStorage.getItem(demoKey);
  fill(doc, 4, "Дубликат", "low"); submit(doc);
  same(doc.querySelector("#task-id").getAttribute("aria-invalid"), "true");
  same(localStorage.getItem(demoKey), saved);
  state("Шаг 2", doc, [1, 4, 7, 10, 20], ["5", "2", "3", "40.0%", "5"]);
  click(doc, `${row(4)} [data-action="edit"] span`);
  fill(doc, undefined, "Подготовить форму задач", "low"); submit(doc);
  same(doc.querySelector(`${row(4)} [data-action="toggle"]`).getAttribute("aria-pressed"), "false");
  state("Шаг 3", doc, [1, 4, 7, 10, 20], ["5", "2", "3", "40.0%", "5"]);
  click(doc, `${row(7)} [data-action="toggle"] span`);
  state("Шаг 4", doc, [1, 4, 7, 10, 20], ["5", "3", "2", "60.0%", "5"]);
  click(doc, `${row(1)} [data-action="delete"] span`);
  state("Шаг 5", doc, [4, 7, 10, 20], ["4", "2", "2", "50.0%", "4"]);
  doc = await fresh(false, false);
  state("Шаг 6", doc, [4, 7, 10, 20], ["4", "2", "2", "50.0%", "4"]);
  click(doc, "#reset-data");
  state("Шаг 7", doc, [1, 4, 7, 10], ["4", "2", "2", "50.0%", "4"]);
  same(localStorage.getItem(demoKey), null);
});

await check("Вариант 3: добавить 75, изменить 23, удалить 37, восстановить и сбросить", async () => {
  localStorage.removeItem(demoKey);
  let doc = await fresh(true);
  click(doc, "#reset-data");
  state("Вариант: начало", doc, [11, 23, 37, 41, 58, 64], ["6", "2", "4", "33.3%", "6"]);
  fill(doc, 75, "Подготовить страницу контактов", "medium"); submit(doc);
  click(doc, `${row(23)} [data-action="edit"] span`);
  fill(doc, undefined, "Собрать лучшие работы для портфолио", "high"); submit(doc);
  click(doc, `${row(37)} [data-action="delete"] span`);
  doc = await fresh(true, false);
  state("Вариант: после перезагрузки", doc, [11, 23, 41, 58, 64, 75], ["6", "2", "4", "33.3%", "6"]);
  same(doc.querySelector(`${row(23)} [data-action="toggle"]`).getAttribute("aria-pressed"), "true");
  same(doc.querySelector(`${row(23)} .task-priority`).textContent, "Высокий");
  doc = await fresh(false, false);
  same(ids(doc), [1, 4, 7, 10]);
  doc = await fresh(true, false);
  click(doc, "#reset-data");
  same(ids(doc), [11, 23, 37, 41, 58, 64]);
  same(localStorage.getItem(variantKey), null);
});

localStorage.removeItem(demoKey);
localStorage.removeItem(variantKey);
const summary = `Всего: ${passed + failed}. Пройдено: ${passed}. Ошибок: ${failed}.`;
document.querySelector("#summary").textContent = summary;
protocol.textContent += summary;
