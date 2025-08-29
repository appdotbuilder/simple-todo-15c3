import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { desc } from 'drizzle-orm';

export const getTasks = async (): Promise<Task[]> => {
  try {
    const result = await db.select()
      .from(tasksTable)
      .orderBy(desc(tasksTable.created_at))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to get tasks:', error);
    throw error;
  }
};