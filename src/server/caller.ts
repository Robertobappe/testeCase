import { createCallerFactory } from "./trpc";
import { appRouter } from "./routers/_app";

const createCaller = createCallerFactory(appRouter);

export const serverCaller = createCaller({});
