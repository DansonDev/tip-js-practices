"use strict";

// Вариант 3: номер в журнале 19, ((19 - 1) % 8) + 1 = 3.
const totalTasks = 9;
const completedTasks = 9;
const dailyLimit = 3;

if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть конечным целым числом.");
} else if (totalTasks < 0 || totalTasks > 1000 || completedTasks < 0 || completedTasks > totalTasks) {
  console.log("Ошибка: требуется 0 ≤ выполнено ≤ всего ≤ 1000.");
} else if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: дневная норма должна быть целым числом от 1 до 1000.");
} else {
  let remainingTasks = totalTasks - completedTasks;
  let day = 0;

  if (remainingTasks === 0) {
    console.log("Все задачи уже выполнены");
  } else {
    console.log(`Осталось задач: ${remainingTasks}`);
  }

  while (remainingTasks > 0) {
    day += 1;
    const tasksToday = Math.min(dailyLimit, remainingTasks);
    remainingTasks -= tasksToday;
    console.log(`День ${day}: выполнено ${tasksToday}, осталось ${remainingTasks}`);
  }

  console.log(`Потребуется дней: ${day}`);
}
