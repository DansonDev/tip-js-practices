import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL(".", import.meta.url));
const rows = [];

// Отдельный проверочный инструмент: учебные алгоритмы остаются без функций и массивов.
// Подставляются только исходные переменные; тело решения запускается без изменений.
function execute(file, input = {}) {
  let source = readFileSync(`${directory}js/${file}`, "utf8");
  for (const [key, value] of Object.entries(input)) {
    source = source.replace(new RegExp(`const ${key} = [^;]+;`), () => `const ${key} = ${value};`);
  }
  const lines = [];
  runInNewContext(source, { console: { log: (...args) => lines.push(args.join(" ")) } }, { timeout: 1000 });
  return lines;
}

function record(section, input, expected, actual) {
  rows.push(`| ${section} | ${input} | ${expected} | ${actual} | Пройдено |`);
}

const progressCases = [
  ["12", "5", "7; 41.7%; В работе"], ["0", "0", "Задач пока нет"],
  ["5", "0", "5; 0.0%; Не начато"], ["5", "5", "0; 100.0%; Завершено"],
  ["5", "6"], ["-1", "0"], ["5", "2.5"], ['"5"', "2"],
  ["1001", "0"], ["NaN", "0"], ["Infinity", "0"], ["5", "-1"],
  ["1000", "999", "1; 99.9%; В работе"], ["1000", "1000", "0; 100.0%; Завершено"],
];
for (const [totalTasks, completedTasks, expected] of progressCases) {
  const output = execute("progress.js", { totalTasks, completedTasks });
  let actual;
  if (!expected) {
    assert.equal(output.length, 1);
    assert.match(output[0], /^Ошибка:/);
    actual = "Ошибка, обычная сводка отсутствует";
  } else if (totalTasks === "0") {
    assert.deepEqual(output, [expected]);
    actual = output[0];
  } else {
    actual = `${output[2].slice(10)}; ${output[3].slice(10)}; ${output[4].slice(8)}`;
    assert.equal(actual, expected);
  }
  record("Прогресс", `${totalTasks}, ${completedTasks}`, expected ?? "Ошибка", actual);
}

const planCases = [
  ["12", "5", "3", 3, 1], ["10", "4", "3", 2, 3],
  ["5", "3", "10", 1, 2], ["5", "5", "2", 0], ["0", "0", "2", 0],
  ["5", "2", "0"], ["5", "2", "1.5"], ["5", "6", "2"],
  ["5", "2", '"2"'], ["5", "2", "1001"], ["0", "0", "0"],
  ["5", "5", "NaN"], ["1000", "0", "1", 1000, 1],
];
for (const [totalTasks, completedTasks, dailyLimit, days, last] of planCases) {
  const output = execute("plan.js", { totalTasks, completedTasks, dailyLimit });
  const steps = output.filter(line => line.startsWith("День "));
  let actual;
  if (days === undefined) {
    assert.equal(output.length, 1);
    assert.match(output[0], /^Ошибка:/);
    actual = "Ошибка, цикл не запущен";
  } else {
    assert.equal(output.at(-1), `Потребуется дней: ${days}`);
    assert.equal(steps.length, days);
    let previous = Number(totalTasks) - Number(completedTasks);
    let sum = 0;
    for (const [index, line] of steps.entries()) {
      const match = line.match(/^День (\d+): выполнено (\d+), осталось (\d+)$/);
      assert.ok(match);
      assert.equal(Number(match[1]), index + 1);
      const done = Number(match[2]);
      const left = Number(match[3]);
      assert.ok(done > 0 && done <= Number(dailyLimit) && done <= previous);
      assert.equal(left, previous - done);
      previous = left;
      sum += done;
    }
    assert.equal(previous, 0);
    assert.equal(sum, Number(totalTasks) - Number(completedTasks));
    if (days > 0) assert.match(steps.at(-1), new RegExp(`выполнено ${last}, осталось 0$`));
    actual = `${days} дней${last === undefined ? "" : `; последний день: ${last}`}`;
  }
  record("План", `${totalTasks}, ${completedTasks}, ${dailyLimit}`, days === undefined ? "Ошибка" : `${days} дней${last === undefined ? "" : `; последний день: ${last}`}`, actual);
}

for (const [totalTasks, completedTasks, dailyLimit, working, calendar] of [
  [6, 0, 1, 6, 8], [5, 0, 1, 5, 5], [7, 0, 1, 7, 9],
  [5, 5, 2, 0, 0], [12, 5, 3, 3, 3], [14, 0, 1, 14, 18],
]) {
  const output = execute("plan-week.js", { totalTasks, completedTasks, dailyLimit });
  assert.equal(output.at(-2), `Рабочих дней: ${working}`);
  assert.equal(output.at(-1), `Календарных дней: ${calendar}`);
  assert.equal(output.filter(line => line.startsWith("День ")).length, calendar);
  if (calendar > 0) assert.match(output.at(-3), /выполнено \d+, осталось 0$/);
  record("С выходными", `${totalTasks}, ${completedTasks}, ${dailyLimit}`, `${working} рабочих; ${calendar} календарных`, `${working} рабочих; ${calendar} календарных`);
}

assert.deepEqual(execute("debug.js"), ["Выполнено: 5", "Осталось: 3", "Контрольная сумма: 10"]);
const types = execute("types.js");
assert.equal(types.length, 10);
assert.deepEqual(types.map(line => line.split(": ").slice(1).join(": ")), [
  "82 | тип: string", "6 | тип: number", "10 | тип: number", "false | тип: boolean",
  "false | тип: boolean", "0 | тип: number", "NaN | тип: number", "true | тип: boolean",
  "object | тип: string", "number | тип: string",
]);
assert.equal(execute("hello.js").at(-1), "Тип document: undefined");

const report = "# Протокол проверок ПР1\n\nЗапуск: `node practice-01/checks.mjs`. Проверяется фактический вывод программ.\n\n" +
  "| Задание | Входные данные | Ожидание | Факт | Итог |\n|---|---|---|---|---|\n" + rows.join("\n") +
  `\n\nУспешно: ${rows.length} наборов, 10 выражений типов, исправленный debug.js, hello.js в Node.js.\n`;
writeFileSync(`${directory}checks-results.md`, report);
console.log(`ПР1: ${rows.length} наборов, 10 выражений и debug/hello — все проверки пройдены.`);
