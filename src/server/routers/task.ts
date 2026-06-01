import { z } from "zod";
import { router, publicProcedure } from "../trpc";

// Modelo da tarefa com campos em português conforme spec do case
interface Task {
  id: string;
  titulo: string;
  descricao: string;
  completed: boolean;
  dataCriacao: Date;
}

// Armazenamento em memória — sem banco de dados conforme requisito
const tasks: Task[] = [];
let nextId = 1;

// Quantidade de itens por página para infinite scroll
const PAGE_SIZE = 10;

export const taskRouter = router({
  // Retorna todas as tarefas (usado pelo SSR na carga inicial)
  list: publicProcedure.query(() => {
    return tasks;
  }),

  // Paginação por cursor para infinite scroll
  // Retorna PAGE_SIZE itens a partir do cursor (id da última tarefa vista)
  listPaginated: publicProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(50).optional().default(PAGE_SIZE),
      })
    )
    .query(({ input }) => {
      const { cursor, limit } = input;
      let startIndex = 0;

      if (cursor) {
        const cursorIndex = tasks.findIndex((t) => t.id === cursor);
        startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
      }

      const items = tasks.slice(startIndex, startIndex + limit);
      const nextCursor = items.length === limit ? items[items.length - 1]?.id : undefined;

      return { items, nextCursor };
    }),

  create: publicProcedure
    .input(
      z.object({
        titulo: z.string().min(1, "O título é obrigatório"),
        descricao: z.string().optional().default(""),
      })
    )
    .mutation(({ input }) => {
      const task: Task = {
        id: String(nextId++),
        titulo: input.titulo,
        descricao: input.descricao,
        completed: false,
        dataCriacao: new Date(),
      };
      tasks.push(task);
      return task;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        titulo: z.string().min(1, "O título é obrigatório").optional(),
        descricao: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const task = tasks.find((t) => t.id === input.id);
      if (!task) throw new Error("Tarefa não encontrada");
      if (input.titulo !== undefined) task.titulo = input.titulo;
      if (input.descricao !== undefined) task.descricao = input.descricao;
      return task;
    }),

  toggle: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const task = tasks.find((t) => t.id === input.id);
      if (!task) throw new Error("Tarefa não encontrada");
      task.completed = !task.completed;
      return task;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const index = tasks.findIndex((t) => t.id === input.id);
      if (index === -1) throw new Error("Tarefa não encontrada");
      const [removed] = tasks.splice(index, 1);
      return removed;
    }),
});
