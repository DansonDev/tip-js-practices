const emptyFilters = { q: '', completed: '', priority: '', categoryId: '' };

export default function TaskFilters({ filters, categories, onChange }) {
  function change(event) {
    onChange({ ...filters, [event.target.name]: event.target.value });
  }

  return (
    <section aria-labelledby="filters-title">
      <h2 id="filters-title">Фильтры</h2>
      <label htmlFor="filter-q">Поиск по названию</label>
      <input id="filter-q" name="q" type="search" value={filters.q} onChange={change} />
      <label htmlFor="filter-completed">Статус</label>
      <select id="filter-completed" name="completed" value={filters.completed} onChange={change}>
        <option value="">Все статусы</option>
        <option value="false">В работе</option>
        <option value="true">Выполнена</option>
      </select>
      <label htmlFor="filter-priority">Приоритет</label>
      <select id="filter-priority" name="priority" value={filters.priority} onChange={change}>
        <option value="">Все приоритеты</option>
        <option value="low">Низкий</option>
        <option value="medium">Средний</option>
        <option value="high">Высокий</option>
      </select>
      <label htmlFor="filter-category">Категория</label>
      <select id="filter-category" name="categoryId" value={filters.categoryId} onChange={change}>
        <option value="">Все категории</option>
        {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      <div className="actions">
        <button type="button" onClick={() => onChange({ ...emptyFilters })}>Сбросить фильтры</button>
      </div>
    </section>
  );
}
