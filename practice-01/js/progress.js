"use strict";

// Вариант 3: номер в журнале 19, ((19 - 1) % 8) + 1 = 3.
const totalTasks = 9;
const completedTasks = 9;

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
