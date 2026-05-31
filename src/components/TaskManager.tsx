"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";

export default function TaskManager() {
  const [newTitle, setNewTitle] = useState("");

  const utils = trpc.useUtils();
  const tasksQuery = trpc.task.list.useQuery();
  const createMutation = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      setNewTitle("");
    },
  });
  const toggleMutation = trpc.task.toggle.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });
  const deleteMutation = trpc.task.delete.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    createMutation.mutate({ title });
  };

  const tasks = tasksQuery.data ?? [];
  const pending = tasks.filter((t) => !t.completed).length;
  const completed = tasks.filter((t) => t.completed).length;

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Digite uma nova tarefa..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !newTitle.trim()}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {createMutation.isPending ? "Adicionando..." : "Adicionar"}
        </button>
      </form>

      {tasksQuery.isLoading && (
        <p className="text-center text-gray-500">Carregando tarefas...</p>
      )}

      {tasksQuery.isError && (
        <p className="text-center text-red-500">
          Erro ao carregar tarefas. Tente novamente.
        </p>
      )}

      {!tasksQuery.isLoading && tasks.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          Nenhuma tarefa ainda. Adicione uma acima!
        </p>
      )}

      {tasks.length > 0 && (
        <>
          <div className="flex gap-4 text-sm text-gray-500 mb-4">
            <span>{pending} pendente{pending !== 1 ? "s" : ""}</span>
            <span>{completed} concluída{completed !== 1 ? "s" : ""}</span>
          </div>

          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 group"
              >
                <button
                  onClick={() => toggleMutation.mutate({ id: task.id })}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
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

                <span
                  className={`flex-1 ${
                    task.completed
                      ? "line-through text-gray-400"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {task.title}
                </span>

                <button
                  onClick={() => deleteMutation.mutate({ id: task.id })}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
