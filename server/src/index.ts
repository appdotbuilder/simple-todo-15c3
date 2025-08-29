import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import { 
  createTaskInputSchema, 
  updateTaskInputSchema, 
  deleteTaskInputSchema, 
  toggleTaskInputSchema 
} from './schema';

// Import handlers
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { toggleTask } from './handlers/toggle_task';
import { getTaskById } from './handlers/get_task_by_id';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new task
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),

  // Get all tasks
  getTasks: publicProcedure
    .query(() => getTasks()),

  // Get a task by ID
  getTaskById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getTaskById(input.id)),

  // Update an existing task
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),

  // Delete a task
  deleteTask: publicProcedure
    .input(deleteTaskInputSchema)
    .mutation(({ input }) => deleteTask(input)),

  // Toggle task completion status
  toggleTask: publicProcedure
    .input(toggleTaskInputSchema)
    .mutation(({ input }) => toggleTask(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Todo server listening at port: ${port}`);
}

start();