import { useState } from 'react';
import { validateTaskDraft } from '../domain/task-service.js';

function createDraft(categories, task) {
  return {
    title: task?.title ?? '',
    priority: task?.priority ?? 'medium',
    categoryId: String(task?.categoryId ?? categories[0]?.id ?? ''),
  };
}

export default function TaskForm({ categories, initialTask = null, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => createDraft(categories, initialTask));
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');

  function change(event) {
    const { name, value } = event.target;
    setDraft(previous => ({ ...previous, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const { valid, value, errors: nextErrors } = validateTaskDraft(draft, categories);
    setErrors(nextErrors);
    setSaveError('');
    if (!valid) return;
    if (!onSave(value)) {
      setSaveError('Сохранить задачу не удалось.');
      return;
    }
    setDraft(createDraft(categories, null));
  }

  function cancel() {
    setDraft(createDraft(categories, null));
    setErrors({});
    setSaveError('');
    onCancel();
  }

  const fieldProps = name => ({
    id: `task-${name}`,
    name,
    value: draft[name],
    onChange: change,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `error-${name}` : undefined,
  });

  return (
    <section aria-labelledby="form-title">
      <h2 id="form-title">{initialTask ? 'Редактирование задачи' : 'Новая задача'}</h2>
      <form noValidate onSubmit={submit}>
        <label htmlFor="task-title">Название</label>
        <input type="text" {...fieldProps('title')} />
        {errors.title && <p id="error-title" className="error">{errors.title}</p>}
        <label htmlFor="task-priority">Приоритет задачи</label>
        <select {...fieldProps('priority')}>
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
        {errors.priority && <p id="error-priority" className="error">{errors.priority}</p>}
        <label htmlFor="task-categoryId">Категория задачи</label>
        <select {...fieldProps('categoryId')}>
          {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        {errors.categoryId && <p id="error-categoryId" className="error">{errors.categoryId}</p>}
        <div className="actions">
          <button type="submit">{initialTask ? 'Сохранить изменения' : 'Создать задачу'}</button>
          <button type="button" onClick={cancel}>Отмена</button>
        </div>
        {saveError && <p role="alert">{saveError}</p>}
      </form>
    </section>
  );
}
