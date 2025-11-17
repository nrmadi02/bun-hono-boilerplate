import { HonoAdapter } from "@bull-board/hono";
import { serveStatic } from "hono/bun";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { emailQueue } from "./queue";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "./create-app";

export const setupBullBoard = async (app: OpenAPIHono<AuthVariables>) => {
  const serverAdapter = new HonoAdapter(serveStatic);
  createBullBoard({
    queues: [new BullMQAdapter(emailQueue)],
    serverAdapter,
  });
  serverAdapter.setBasePath("/bullboard");
  app.route("/bullboard", serverAdapter.registerPlugin());
};