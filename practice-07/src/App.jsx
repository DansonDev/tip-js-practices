import { useState } from 'react';
import { tasks as initialTasks, categories } from './data.js';
import { createInitialFilters } from './variant.js';
import { addTask, updateTask, toggleTask, removeTask, selectTasks, getTaskStats } from './domain/task-service.js';
import TaskForm from './components/TaskForm.jsx';
import TaskFilters from './components/TaskFilters.jsx';
import TaskList from './components/TaskList.jsx';
import TaskStats from './components/TaskStats.jsx';

export default function App() {
  const [tasks, setTasks] = useState(() => initialTasks.map(task => ({ ...task })));
  const [filters, setFilters] = useState(createInitialFilters);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const visibleTasks = selectTasks(tasks, filters);
  const stats = getTaskStats(tasks);
  const editingTask = tasks.find(task => task.id === editingId) ?? null;

  function saveTask(value) {
    if (editingId !== null) {
      if (!editingTask) return false;
      setTasks(previous => updateTask(previous, editingId, value));
      setEditingId(null);
      setMessage('Изменения сохранены.');
    } else {
      setTasks(previous => {
        const id = previous.reduce((max, task) => Math.max(max, task.id), 0) + 1;
        return addTask(previous, value, id);
      });
      setMessage('Задача создана.');
    }
    return true;
  }

  function changeStatus(id) {
    setTasks(previous => toggleTask(previous, id));
    setMessage('Статус задачи изменён.');
  }

  function deleteTask(id) {
    if (!window.confirm('Удалить задачу?')) return;
    setTasks(previous => removeTask(previous, id));
    if (editingId === id) setEditingId(null);
    setMessage('Задача удалена.');
  }

  function editTask(id) {
    setEditingId(id);
    setMessage('');
  }

  function cancelEdit() {
    setEditingId(null);
    setMessage('');
  }

  return (
    <main>
      <h1>Задачи на React</h1>
      <p>ПР7: данные в памяти. Обновление страницы восстанавливает исходный набор.</p>
      <TaskStats stats={stats} />
      <TaskFilters filters={filters} categories={categories} onChange={setFilters} />
      <p role="status">{message}</p>
      <TaskForm
        key={editingId ?? 'create'}
        categories={categories}
        initialTask={editingTask}
        onSave={saveTask}
        onCancel={cancelEdit}
      />
      <TaskList
        tasks={visibleTasks}
        categories={categories}
        onToggle={changeStatus}
        onEdit={editTask}
        onDelete={deleteTask}
      />
    </main>
  );
}
