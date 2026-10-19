"use strict";

const totalTasks = 6;
const completedTasks = 0;
const dailyLimit = 1;

if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть конечным целым числом.");
} else if (totalTasks < 0 || totalTasks > 1000 || completedTasks < 0 || completedTasks > totalTasks) {
  console.log("Ошибка: требуется 0 ≤ выполнено ≤ всего ≤ 1000.");
} else if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: дневная норма должна быть целым числом от 1 до 1000.");
} else {
  let remainingTasks = totalTasks - completedTasks;
  let calendarDays = 0;
  let workingDays = 0;

  while (remainingTasks > 0) {
    calendarDays += 1;
    const weekDay = (calendarDays - 1) % 7 + 1;

    if (weekDay === 6 || weekDay === 7) {
      console.log(`День ${calendarDays}: выходной, осталось ${remainingTasks}`);
    } else {
      workingDays += 1;
      const tasksToday = Math.min(dailyLimit, remainingTasks);
      remainingTasks -= tasksToday;
      console.log(`День ${calendarDays}: выполнено ${tasksToday}, осталось ${remainingTasks}`);
    }
  }

  console.log(`Рабочих дней: ${workingDays}`);
  console.log(`Календарных дней: ${calendarDays}`);
}
