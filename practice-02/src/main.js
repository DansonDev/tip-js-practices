import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask, findTaskById, getPendingTasks, getTaskTitles, getTaskStats,
  addTask, setTaskCompleted, renameTask, removeTask,
} from "./task-service.js";
import { getPrioritySummary } from "./task-extra.js";

function showState(label, tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  console.log(`${label}: всего ${total}; выполнено ${completed}; осталось ${pending}; ${total === 0 ? "Задач пока нет" : `${progress.toFixed(1)}%`}`);
}

function applyResult(current, result) {
  if (result.ok) return result.tasks;
  console.log(`Обработанный отказ: ${result.error}`);
  return current;
}

console.log("ПР2. Общий сценарий");
console.log("Создание:", createTask(30, "  Отдельная задача  "));
console.table(demoTasks);
console.log("Найденная задача id = 4:", findTaskById(demoTasks, 4));
console.log("Названия:", getTaskTitles(demoTasks));
console.log("Невыполненные:", getPendingTasks(demoTasks));
const beforeDemo = JSON.stringify(demoTasks);
let currentTasks = demoTasks;
showState("Исходный набор", currentTasks);
currentTasks = applyResult(currentTasks, addTask(currentTasks, 20, "Добавить проверку", "high"));
showState("После добавления 20", currentTasks);
currentTasks = applyResult(currentTasks, setTaskCompleted(currentTasks, 4, true));
showState("После выполнения 4", currentTasks);
currentTasks = applyResult(currentTasks, renameTask(currentTasks, 10, "Подготовить инструкцию запуска"));
showState("После переименования 10", currentTasks);
currentTasks = applyResult(currentTasks, removeTask(currentTasks, 7));
showState("После удаления 7", currentTasks);
const beforeFailure = currentTasks;
currentTasks = applyResult(currentTasks, addTask(currentTasks, 20, "Дубликат"));
console.log("Отказ сохранил текущее состояние:", currentTasks === beforeFailure);
console.table(currentTasks);
console.log("demoTasks сохранён:", JSON.stringify(demoTasks) === beforeDemo);
console.log("Сводка по приоритетам:", getPrioritySummary(demoTasks));

function runVariant(number, initial, priority) {
  console.log(`\nВариант ${number}`);
  const before = JSON.stringify(initial);
  let current = initial;
  console.table(initial);
  showState("Исходный набор", current);
  current = applyResult(current, addTask(current, 80, "Проверить итоговый результат", priority));
  showState("После добавления 80", current);
  current = applyResult(current, setTaskCompleted(current, 11, true));
  showState("После выполнения 11", current);
  current = applyResult(current, renameTask(current, 23, "Уточнить второй этап работы"));
  showState("После переименования 23", current);
  current = applyResult(current, removeTask(current, 37));
  showState("После удаления 37", current);
  const previous = current;
  current = applyResult(current, addTask(current, 80, "Повторная задача", priority));
  console.log("Отказ сохранил состояние:", current === previous);
  console.log("Исходный вариант сохранён:", JSON.stringify(initial) === before);
  console.table(current);
}

runVariant(variantNumber, variantTasks, "high");
