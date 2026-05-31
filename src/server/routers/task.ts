import { z } from "zod";
import { router, publicProcedure } from "../trpc";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

const tasks: Task[] = [];
let nextId = 1;

export const taskRouter = router({
  list: publicProcedure.query(() => {
    return tasks;
  }),

  create: publicProcedure
    .input(z.object({ title: z.string().min(1, "O título é obrigatório") }))
    .mutation(({ input }) => {
      const task: Task = {
        id: String(nextId++),
        title: input.title,
        completed: false,
        createdAt: new Date(),
      };
      tasks.push(task);
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
