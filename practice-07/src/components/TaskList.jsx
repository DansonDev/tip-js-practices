import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, categories, onToggle, onEdit, onDelete }) {
  const categoryNames = new Map(categories.map(({ id, name }) => [id, name]));

  return (
    <section aria-labelledby="list-title">
      <h2 id="list-title">Задачи</h2>
      <p>Найдено: {tasks.length}</p>
      {tasks.length === 0 ? <p>По текущим фильтрам задач нет.</p> : (
        <ul>
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              categoryName={categoryNames.get(task.categoryId)}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
