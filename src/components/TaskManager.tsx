"use client";

/**
 * TaskManager — Componente principal do gerenciador de tarefas.
 *
 * Decisões de design:
 * - Usa useInfiniteQuery do React Query para infinite scroll (paginação por cursor)
 * - Recebe initialTasks do Server Component (SSR) para hidratação instantânea
 * - Feedback visual unificado via estado local com auto-dismiss de 3s
 * - Edição inline para evitar navegação desnecessária (menos é mais)
 * - IntersectionObserver para detectar quando o usuário chega ao fim da lista
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/trpc/client";

interface Task {
  id: string;
  titulo: string;
  descricao: string;
  completed: boolean;
  dataCriacao: Date;
}

interface FeedbackMessage {
  type: "success" | "error";
  text: string;
}

export default function TaskManager({
  initialTasks,
}: {
  initialTasks: Task[];
}) {
  const [newTitulo, setNewTitulo] = useState("");
  const [newDescricao, setNewDescricao] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  // Ref para o elemento sentinela do infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const showFeedback = useCallback(
    (type: "success" | "error", text: string) => {
      setFeedback({ type, text });
      setTimeout(() => setFeedback(null), 3000);
    },
    []
  );

  const utils = trpc.useUtils();

  // Infinite scroll: usa paginação por cursor
  const infiniteQuery = trpc.task.listPaginated.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialData: {
        pages: [{ items: initialTasks, nextCursor: initialTasks.length >= 10 ? initialTasks[initialTasks.length - 1]?.id : undefined }],
        pageParams: [undefined],
      },
    }
  );

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = infiniteQuery;

  // IntersectionObserver: carrega mais tarefas quando o sentinela entra no viewport
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const createMutation = trpc.task.create.useMutation({
    onSuccess: (task) => {
      utils.task.listPaginated.invalidate();
      setNewTitulo("");
      setNewDescricao("");
      showFeedback("success", `Tarefa "${task.titulo}" criada com sucesso!`);
    },
    onError: (error) => {
      showFeedback("error", `Erro ao criar tarefa: ${error.message}`);
    },
  });
  const updateMutation = trpc.task.update.useMutation({
    onSuccess: (task) => {
      utils.task.listPaginated.invalidate();
      setEditingId(null);
      showFeedback("success", `Tarefa "${task.titulo}" atualizada!`);
    },
    onError: (error) => {
      showFeedback("error", `Erro ao atualizar: ${error.message}`);
    },
  });
  const toggleMutation = trpc.task.toggle.useMutation({
    onSuccess: (task) => {
      utils.task.listPaginated.invalidate();
      showFeedback(
        "success",
        task.completed
          ? `"${task.titulo}" concluída!`
          : `"${task.titulo}" reaberta.`
      );
    },
    onError: (error) => {
      showFeedback("error", `Erro ao alterar status: ${error.message}`);
    },
  });
  const deleteMutation = trpc.task.delete.useMutation({
    onSuccess: (task) => {
      utils.task.listPaginated.invalidate();
      showFeedback("success", `Tarefa "${task.titulo}" excluída!`);
    },
    onError: (error) => {
      showFeedback("error", `Erro ao excluir: ${error.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const titulo = newTitulo.trim();
    if (!titulo) return;
    createMutation.mutate({ titulo, descricao: newDescricao.trim() });
  };

  const startEditing = (task: {
    id: string;
    titulo: string;
    descricao: string;
  }) => {
    setEditingId(task.id);
    setEditTitulo(task.titulo);
    setEditDescricao(task.descricao);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editTitulo.trim()) return;
    updateMutation.mutate({
      id: editingId,
      titulo: editTitulo.trim(),
      descricao: editDescricao.trim(),
    });
  };

  // Flatten das páginas para obter lista completa carregada
  const tasks = infiniteQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const pending = tasks.filter((t) => !t.completed).length;
  const completed = tasks.filter((t) => t.completed).length;

  return (
    <div className="w-full max-w-xl mx-auto">
      {feedback && (
        <div
          className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium transition-opacity ${
            feedback.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex flex-col gap-2 mb-6">
        <input
          type="text"
          value={newTitulo}
          onChange={(e) => setNewTitulo(e.target.value)}
          placeholder="Título da tarefa..."
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={newDescricao}
            onChange={(e) => setNewDescricao(e.target.value)}
            placeholder="Descrição (opcional)..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !newTitulo.trim()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {createMutation.isPending ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </form>

      {infiniteQuery.isLoading && (
        <p className="text-center text-gray-500">Carregando tarefas...</p>
      )}

      {infiniteQuery.isError && (
        <p className="text-center text-red-500">
          Erro ao carregar tarefas. Tente novamente.
        </p>
      )}

      {!infiniteQuery.isLoading && tasks.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          Nenhuma tarefa ainda. Adicione uma acima!
        </p>
      )}

      {tasks.length > 0 && (
        <>
          <div className="flex gap-4 text-sm text-gray-500 mb-4">
            <span>
              {pending} pendente{pending !== 1 ? "s" : ""}
            </span>
            <span>
              {completed} concluída{completed !== 1 ? "s" : ""}
            </span>
          </div>

          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 group"
              >
                {editingId === task.id ? (
                  <form onSubmit={handleUpdate} className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editTitulo}
                      onChange={(e) => setEditTitulo(e.target.value)}
                      placeholder="Título..."
                      className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={editDescricao}
                      onChange={(e) => setEditDescricao(e.target.value)}
                      placeholder="Descrição (opcional)..."
                      className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={
                          updateMutation.isPending || !editTitulo.trim()
                        }
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleMutation.mutate({ id: task.id })}
                      className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                        task.completed
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 dark:border-gray-500 hover:border-blue-500"
                      }`}
                      title={
                        task.completed
                          ? "Marcar como pendente"
                          : "Marcar como concluída"
                      }
                    >
                      {task.completed && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <span
                        className={
                          task.completed
                            ? "line-through text-gray-400"
                            : "text-gray-900 dark:text-gray-100"
                        }
                      >
                        {task.titulo}
                      </span>
                      {task.descricao && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {task.descricao}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(task)}
                        className="text-gray-400 hover:text-blue-500"
                        title="Editar tarefa"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate({ id: task.id })}
                        className="text-gray-400 hover:text-red-500"
                        title="Excluir tarefa"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Sentinela do Infinite Scroll — quando visível, carrega próxima página */}
          <div ref={loadMoreRef} className="py-4 text-center">
            {isFetchingNextPage && (
              <p className="text-sm text-gray-500">Carregando mais...</p>
            )}
            {!hasNextPage && tasks.length > 10 && (
              <p className="text-sm text-gray-400">
                Todas as tarefas foram carregadas.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
