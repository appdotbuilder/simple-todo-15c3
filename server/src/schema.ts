import { z } from 'zod';

// Task schema with proper type handling
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  completed: z.boolean(),
  due_date: z.coerce.date().nullable(),
  reminder_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  reminder_date: z.coerce.date().nullable().optional()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  due_date: z.coerce.date().nullable().optional(),
  reminder_date: z.coerce.date().nullable().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for deleting tasks
export const deleteTaskInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;

// Input schema for toggling task completion
export const toggleTaskInputSchema = z.object({
  id: z.number()
});

export type ToggleTaskInput = z.infer<typeof toggleTaskInputSchema>;