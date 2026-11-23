const priorityLabels = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };

export default function TaskItem({ task, categoryName, onToggle, onEdit, onDelete }) {
  const { id, title, completed, priority } = task;
  return (
    <li data-task-id={id}>
      <h3>{title}</h3>
      <p>{completed ? 'Выполнена' : 'В работе'} · Приоритет: {priorityLabels[priority]} · Категория: {categoryName}</p>
      <div className="actions">
        <button type="button" onClick={() => onToggle(id)}>
          {completed ? 'Вернуть в работу' : 'Выполнить'}
        </button>
        <button type="button" onClick={() => onEdit(id)}>Редактировать</button>
        <button type="button" onClick={() => onDelete(id)}>Удалить</button>
      </div>
    </li>
  );
}
