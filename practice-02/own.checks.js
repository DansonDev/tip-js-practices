import assert from "node:assert/strict";
import { demoTasks, variantNumber, variantTasks } from "./src/data.js";
import { addTask, removeTask, renameTask, setTaskCompleted, getTaskStats } from "./src/task-service.js";
import { getPrioritySummary } from "./src/task-extra.js";

let passed = 0;
function check(name, action) {
  action();
  passed += 1;
  console.log(`OK: ${name}`);
}
function success(result) {
  assert.equal(result.ok, true, result.error);
  return result.tasks;
}

check("Свой 1: удалить запись и повторно добавить тот же id", () => {
  const initial = structuredClone(demoTasks);
  const removed = success(removeTask(initial, 4));
  const added = success(addTask(removed, 4, "Повторно добавленная задача", "low"));
  assert.deepEqual(added.map(task => task.id), [1, 7, 10, 4]);
  assert.equal(added.at(-1).priority, "low");
  assert.equal(initial[1].title, "Подготовить модель задач");
  assert.equal(removed.some(task => task.id === 4), false);
  assert.deepEqual(initial, demoTasks);
});

check("Свой 2: обновить первую и последнюю запись с сохранением промежуточного состояния", () => {
  const first = success(setTaskCompleted(demoTasks, 1, false));
  const second = success(renameTask(first, 10, "  Последняя запись  "));
  assert.deepEqual(getTaskStats(second), { total: 4, completed: 1, pending: 3, progress: 25 });
  assert.equal(first[3].title, "Оформить README");
  assert.equal(second[3].title, "Последняя запись");
  assert.equal(demoTasks[0].completed, true);
});

check("Свой 3: последовательное обновление трёх задач и независимость исторических состояний", () => {
  const a = success(setTaskCompleted(demoTasks, 4, true));
  const b = success(setTaskCompleted(a, 7, true));
  const c = success(setTaskCompleted(b, 10, false));
  assert.equal(getTaskStats(a).completed, 3);
  assert.equal(getTaskStats(b).completed, 4);
  assert.equal(getTaskStats(c).completed, 3);
  assert.equal(a[2].completed, false);
  assert.equal(b[3].completed, true);
  assert.deepEqual(demoTasks.map(task => task.completed), [true, false, false, true]);
});

check("Расширение: смешанные приоритеты и отсутствие мутации", () => {
  const frozen = Object.freeze(demoTasks.map(task => Object.freeze({ ...task })));
  assert.deepEqual(getPrioritySummary(frozen), {
    low: { total: 1, pending: 1 }, medium: { total: 2, pending: 0 }, high: { total: 1, pending: 1 },
  });
  assert.deepEqual(frozen, demoTasks);
});
check("Расширение: пустой список", () => {
  assert.deepEqual(getPrioritySummary([]), {
    low: { total: 0, pending: 0 }, medium: { total: 0, pending: 0 }, high: { total: 0, pending: 0 },
  });
});
check("Расширение: один приоритет", () => {
  assert.deepEqual(getPrioritySummary(demoTasks.map(task => ({ ...task, priority: "high" }))), {
    low: { total: 0, pending: 0 }, medium: { total: 0, pending: 0 }, high: { total: 4, pending: 2 },
  });
});

for (const variant of [{ number: variantNumber, tasks: variantTasks, newPriority: "high" }]) {
  check(`Набор варианта ${variant.number}: все этапы и отказ при дубликате`, () => {
    const initial = structuredClone(variant.tasks);
    const snapshot = structuredClone(initial);
    const k = 0;
    assert.equal(getTaskStats(initial).completed, k);
    assert.deepEqual(initial.map(task => task.id), [11, 23, 37, 41, 58, 64]);
    const added = success(addTask(initial, 80, "Проверить итоговый результат", variant.newPriority));
    assert.equal(getTaskStats(added).total, 7);
    assert.equal(getTaskStats(added).completed, k);
    const toggled = success(setTaskCompleted(added, 11, true));
    assert.equal(getTaskStats(toggled).completed, Math.max(1, k));
    const renamed = success(renameTask(toggled, 23, "Уточнить второй этап работы"));
    assert.deepEqual(getTaskStats(renamed), getTaskStats(toggled));
    const removed = success(removeTask(renamed, 37));
    assert.equal(getTaskStats(removed).completed, 1);
    assert.deepEqual(removed.map(task => task.id), [11, 23, 41, 58, 64, 80]);
    const beforeFailure = structuredClone(removed);
    assert.equal(addTask(removed, 80, "Дубликат").ok, false);
    assert.deepEqual(removed, beforeFailure);
    assert.deepEqual(initial, snapshot);
    assert.equal(added[0].completed, k > 0);
    assert.equal(toggled[1].title, snapshot[1].title);
  });
}
console.log(`Собственных групп проверок: ${passed}; ошибок: 0.`);
