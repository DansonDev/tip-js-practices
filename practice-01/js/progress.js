"use strict";

// Общий пример методички. Индивидуальный вариант уточняется по номеру в журнале.
const totalTasks = 12;
const completedTasks = 5;

if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть конечным целым числом.");
} else if (totalTasks < 0 || totalTasks > 1000 || completedTasks < 0 || completedTasks > totalTasks) {
  console.log("Ошибка: требуется 0 ≤ выполнено ≤ всего ≤ 1000.");
} else if (totalTasks === 0) {
  console.log("Задач пока нет");
} else {
  const remainingTasks = totalTasks - completedTasks;
  const percentage = completedTasks / totalTasks * 100;
  let status = "В работе";

  if (completedTasks === 0) {
    status = "Не начато";
  } else if (completedTasks === totalTasks) {
    status = "Завершено";
  }

  console.log(`Всего задач: ${totalTasks}`);
  console.log(`Выполнено: ${completedTasks}`);
  console.log(`Осталось: ${remainingTasks}`);
  console.log(`Прогресс: ${percentage.toFixed(1)}%`);
  console.log(`Статус: ${status}`);
}
