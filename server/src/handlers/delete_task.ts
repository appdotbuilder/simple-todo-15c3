import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (input: DeleteTaskInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with ID ${input.id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};