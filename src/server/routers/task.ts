import { z } from "zod";
import { router, publicProcedure } from "../trpc";

interface Task {
  id: string;
  titulo: string;
  descricao: string;
  completed: boolean;
  dataCriacao: Date;
}

const tasks: Task[] = [];
let nextId = 1;

export const taskRouter = router({
  list: publicProcedure.query(() => {
    return tasks;
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
