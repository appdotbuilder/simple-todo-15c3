import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    const result = await db.insert(tasksTable)
      .values({
        title: input.title,
        description: input.description || null,
        due_date: input.due_date || null,
        reminder_date: input.reminder_date || null,
        completed: false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};