export default function TaskStats({ stats }) {
  return (
    <section aria-labelledby="stats-title">
      <h2 id="stats-title">Статистика</h2>
      <p>Всего: {stats.total} · Выполнено: {stats.completed} · В работе: {stats.active}</p>
    </section>
  );
}
