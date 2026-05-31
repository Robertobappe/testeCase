import TaskManager from "@/components/TaskManager";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-start px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Gerenciador de Tarefas</h1>
      <p className="text-gray-500 mb-8">
        NextJS + tRPC &mdash; backend em memória
      </p>
      <TaskManager />
    </main>
  );
}
