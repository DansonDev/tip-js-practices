import { createTaskElement } from "../src/task-view.js";

const frame = document.querySelector("#frame");
const log = document.querySelector("#protocol");
let passed = 0;
let failed = 0;
let sequence = 0;
function assert(condition, message) { if (!condition) throw new Error(message); }
function same(actual, expected) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
}
function fresh(variant = false) {
  return new Promise(resolve => {
    frame.addEventListener("load", () => resolve(frame.contentDocument), { once: true });
    frame.src = `../index.html?own=${++sequence}${variant ? "&dataset=variant" : ""}`;
  });
}
const row = id => `#task-list > [data-task-id="${id}"]`;
const click = (doc, selector) => {
  const target = doc.querySelector(selector);
  assert(target, `Не найдено: ${selector}`);
  target.click();
};
const ids = doc => [...doc.querySelectorAll("#task-list > li")].map(node => Number(node.dataset.taskId));
const stats = doc => [...doc.querySelectorAll("#task-summary [data-stat]")].map(node => node.textContent);
async function check(name, run) {
  const item = document.createElement("li");
  try { await run(); passed += 1; item.textContent = `OK: ${name}`; }
  catch (error) { failed += 1; item.textContent = `FAIL: ${name}: ${error.message}`; }
  document.querySelector("#results").append(item);
  log.textContent += `${item.textContent}\n`;
}

await check("Граница: единственная оставшаяся задача, двойное переключение и удаление", async () => {
  const doc = await fresh();
  for (const id of [1, 4, 10]) click(doc, `${row(id)} [data-action="delete"] .action-label`);
  same(ids(doc), [7]);
  click(doc, `${row(7)} [data-action="toggle"] .action-label`);
  same(stats(doc), ["1", "1", "0", "100.0%", "1"]);
  click(doc, `${row(7)} [data-action="toggle"] .action-label`);
  same(stats(doc), ["1", "0", "1", "0.0%", "1"]);
  click(doc, `${row(7)} [data-action="delete"] .action-label`);
  same(stats(doc), ["0", "0", "0", "0.0%", "0"]);
  same(doc.querySelector("#empty-message").textContent, "Список задач пуст.");
});

await check("События: пять переключений после повторных фильтраций изменяют статус ровно пять раз", async () => {
  const doc = await fresh();
  for (let i = 0; i < 5; i += 1) {
    for (const filter of ["completed", "pending", "all"]) click(doc, `[data-filter="${filter}"] span`);
    click(doc, `${row(4)} [data-action="toggle"] .action-label`);
  }
  same(doc.querySelector(`${row(4)} [data-action="toggle"]`).getAttribute("aria-pressed"), "true");
  same(stats(doc), ["4", "3", "1", "75.0%", "4"]);
});

await check("Граница названия: 100 символов, новый DOM-узел и сохранность исходной записи", () => {
  const task = Object.freeze({ id: 123, title: "x".repeat(100), completed: false, priority: "low" });
  const first = createTaskElement(task);
  const second = createTaskElement(task);
  same(first.querySelector(".task-title").textContent, task.title);
  assert(first !== second, "Карточки должны быть разными DOM-узлами");
  same(task.completed, false);
});

await check("Расширение: совместные фильтры и сохранение выбора после выполнения", async () => {
  const doc = await fresh();
  click(doc, '[data-filter="pending"] span');
  click(doc, '[data-priority="high"]');
  same(ids(doc), [4]);
  same(stats(doc), ["4", "2", "2", "50.0%", "1"]);
  click(doc, `${row(4)} [data-action="toggle"] span`);
  same(ids(doc), []);
  same(stats(doc), ["4", "3", "1", "75.0%", "0"]);
  same(doc.querySelector('[data-priority="high"]').getAttribute("aria-pressed"), "true");
  same(doc.querySelector('[data-filter="pending"]').getAttribute("aria-pressed"), "true");
});

await check("Расширение: нет совпадений и возврат обеих групп фильтров", async () => {
  const doc = await fresh();
  click(doc, '[data-filter="completed"] span');
  click(doc, '[data-priority="low"]');
  same(ids(doc), []);
  same(doc.querySelector("#empty-message").textContent, "Нет задач по выбранному фильтру.");
  click(doc, '[data-filter="all"] span');
  click(doc, '[data-priority="all"]');
  same(ids(doc), [1, 4, 7, 10]);
});

await check("Расширение: удаление в выборке high сохраняет оба фильтра и общую сводку", async () => {
  const doc = await fresh();
  click(doc, '[data-priority="high"]');
  click(doc, `${row(4)} [data-action="delete"] span`);
  same(ids(doc), []);
  same(stats(doc), ["3", "2", "1", "66.7%", "0"]);
  same(doc.querySelector('[data-priority="high"]').getAttribute("aria-pressed"), "true");
  click(doc, '[data-priority="all"]');
  same(ids(doc), [1, 7, 10]);
});

await check("Вариант 3: исходные данные, три фильтра, переключение 23 и удаление 37", async () => {
  const doc = await fresh(true);
  same(stats(doc), ["6", "2", "4", "33.3%", "6"]);
  click(doc, '[data-filter="completed"] span'); same(ids(doc), [11, 23]);
  click(doc, '[data-filter="pending"] span'); same(ids(doc), [37, 41, 58, 64]);
  click(doc, '[data-filter="all"] span');
  click(doc, `${row(23)} [data-action="toggle"] span`);
  click(doc, `${row(37)} [data-action="delete"] span`);
  same(ids(doc), [11, 23, 41, 58, 64]);
  same(stats(doc), ["5", "1", "4", "20.0%", "5"]);
  click(doc, '[data-filter="completed"] span'); same(ids(doc), [11]);
  click(doc, '[data-filter="pending"] span'); same(ids(doc), [23, 41, 58, 64]);
});

const result = `Всего: ${passed + failed}. Пройдено: ${passed}. Ошибок: ${failed}.`;
document.querySelector("#summary").textContent = result;
log.textContent += result;
