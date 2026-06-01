/**
 * Inicialização do tRPC.
 *
 * - superjson como transformer para serializar Date, Map, Set etc.
 * - createCallerFactory exportado para chamadas server-side (SSR)
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";

const t = initTRPC.create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
