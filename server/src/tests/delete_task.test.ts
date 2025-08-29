import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Helper function to create a test task
const createTestTask = async (taskData?: Partial<CreateTaskInput>) => {
  const defaultTask = {
    title: 'Test Task',
    description: 'A task for testing',
    due_date: new Date('2024-12-31'),
    reminder_date: new Date('2024-12-30')
  };

  const result = await db.insert(tasksTable)
    .values({
      ...defaultTask,
      ...taskData
    })
    .returning()
    .execute();

  return result[0];
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a test task first
    const createdTask = await createTestTask();
    
    const input: DeleteTaskInput = {
      id: createdTask.id
    };

    const result = await deleteTask(input);

    // Should return success
    expect(result.success).toBe(true);

    // Task should no longer exist in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should delete only the specified task', async () => {
    // Create multiple test tasks
    const task1 = await createTestTask({ title: 'Task 1' });
    const task2 = await createTestTask({ title: 'Task 2' });
    const task3 = await createTestTask({ title: 'Task 3' });

    const input: DeleteTaskInput = {
      id: task2.id
    };

    const result = await deleteTask(input);

    // Should return success
    expect(result.success).toBe(true);

    // Only task2 should be deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    expect(remainingTasks.map(t => t.id)).toContain(task1.id);
    expect(remainingTasks.map(t => t.id)).toContain(task3.id);
    expect(remainingTasks.map(t => t.id)).not.toContain(task2.id);
  });

  it('should delete a completed task', async () => {
    // Create a completed task
    const completedTask = await createTestTask({ title: 'Completed Task' });
    
    // Mark it as completed
    await db.update(tasksTable)
      .set({ completed: true })
      .where(eq(tasksTable.id, completedTask.id))
      .execute();

    const input: DeleteTaskInput = {
      id: completedTask.id
    };

    const result = await deleteTask(input);

    // Should successfully delete completed task
    expect(result.success).toBe(true);

    // Task should no longer exist
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, completedTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should delete a task with null optional fields', async () => {
    // Create a minimal task with null description and dates
    const minimalTask = await createTestTask({
      title: 'Minimal Task',
      description: null,
      due_date: null,
      reminder_date: null
    });

    const input: DeleteTaskInput = {
      id: minimalTask.id
    };

    const result = await deleteTask(input);

    // Should successfully delete minimal task
    expect(result.success).toBe(true);

    // Task should no longer exist
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, minimalTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should throw error when task does not exist', async () => {
    const input: DeleteTaskInput = {
      id: 99999 // Non-existent ID
    };

    // Should throw an error
    await expect(deleteTask(input)).rejects.toThrow(/task with id 99999 not found/i);
  });

  it('should throw error when trying to delete already deleted task', async () => {
    // Create and delete a task
    const createdTask = await createTestTask();
    
    const input: DeleteTaskInput = {
      id: createdTask.id
    };

    // First deletion should succeed
    await deleteTask(input);

    // Second deletion should fail
    await expect(deleteTask(input)).rejects.toThrow(/task with id .* not found/i);
  });

  it('should handle edge case with ID 0', async () => {
    const input: DeleteTaskInput = {
      id: 0
    };

    // Should throw error for non-existent ID 0
    await expect(deleteTask(input)).rejects.toThrow(/task with id 0 not found/i);
  });

  it('should handle negative ID gracefully', async () => {
    const input: DeleteTaskInput = {
      id: -1
    };

    // Should throw error for negative ID
    await expect(deleteTask(input)).rejects.toThrow(/task with id -1 not found/i);
  });
});