import { serial, text, pgTable, timestamp, boolean } from 'drizzle-orm/pg-core';

export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default, matches Zod schema
  completed: boolean('completed').notNull().default(false),
  due_date: timestamp('due_date'), // Nullable by default for optional due dates
  reminder_date: timestamp('reminder_date'), // Nullable by default for optional reminders
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Task = typeof tasksTable.$inferSelect; // For SELECT operations
export type NewTask = typeof tasksTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { tasks: tasksTable };