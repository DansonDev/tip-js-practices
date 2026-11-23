import { useEffect, useRef, useState } from 'react';

export function useTaskData({ api, filters }) {
  const { q, completed, priority, categoryId } = filters;
  const [snapshot, setSnapshot] = useState({ tasks: [], categories: [], meta: { total: 0 } });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const mounted = useRef(false);
  const currentMutation = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      currentMutation.current?.abort();
      currentMutation.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setStatus('loading');
    setError(null);

    async function load() {
      try {
        const result = await api.loadInitialData({ q, completed, priority, categoryId }, { signal });
        if (signal.aborted) return;
        setSnapshot(result);
        setStatus('ready');
      } catch (failure) {
        if (signal.aborted || failure?.kind === 'aborted' || failure?.name === 'AbortError') return;
        setError(failure);
        setStatus('error');
      }
    }

    load();
    return () => controller.abort();
  }, [api, q, completed, priority, categoryId, revision]);

  function refresh() {
    setRevision(previous => previous + 1);
  }

  async function mutate(operation) {
    if (!mounted.current || currentMutation.current) return false;
    const controller = new AbortController();
    currentMutation.current = controller;
    setPending(true);
    setMutationError(null);

    function isCurrent() {
      return mounted.current && currentMutation.current === controller && !controller.signal.aborted;
    }

    try {
      await operation({ signal: controller.signal });
      if (!isCurrent()) return false;
      refresh();
      return true;
    } catch (failure) {
      if (isCurrent()) setMutationError(failure);
      return false;
    } finally {
      if (isCurrent()) {
        currentMutation.current = null;
        setPending(false);
      }
    }
  }

  return {
    snapshot, status, error, mutationError, pending, refresh,
    saveTask(id, value) {
      return mutate(options => id === null ? api.createTask(value, options) : api.updateTask(id, value, options));
    },
    toggleTask(task) {
      return mutate(options => api.setTaskCompleted(task.id, !task.completed, options));
    },
    deleteTask(id) {
      return mutate(options => api.deleteTask(id, options));
    },
    resetData() {
      return mutate(options => api.resetDemoData(options));
    },
  };
}
