export function getPrioritySummary(tasks) {
  const summary = {
    low: { total: 0, pending: 0 },
    medium: { total: 0, pending: 0 },
    high: { total: 0, pending: 0 },
  };
  for (const task of tasks) {
    summary[task.priority].total += 1;
    if (task.completed === false) summary[task.priority].pending += 1;
  }
  return summary;
}
