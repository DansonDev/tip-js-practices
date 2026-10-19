export function getTasksByPriority(tasks, priority = "all") {
  return priority === "all" ? [...tasks] : tasks.filter(task => task.priority === priority);
}
