/**
 * Server-side caller — permite chamar procedures tRPC diretamente no servidor.
 * Usado no page.tsx (Server Component) para pré-carregar dados via SSR.
 */
import { createCallerFactory } from "./trpc";
import { appRouter } from "./routers/_app";

const createCaller = createCallerFactory(appRouter);

export const serverCaller = createCaller({});
