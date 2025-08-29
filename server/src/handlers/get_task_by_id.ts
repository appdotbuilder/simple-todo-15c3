import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const getTaskById = async (id: number): Promise<Task | null> => {
  try {
    const result = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, id))
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Failed to get task by ID:', error);
    throw error;
  }
};