import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testTaskId: number;

  // Helper to create a test task
  const createTestTask = async () => {
    const result = await db.insert(tasksTable)
      .values({
        title: 'Original Task',
        description: 'Original description',
        completed: false,
        due_date: new Date('2024-12-31'),
        reminder_date: new Date('2024-12-30')
      })
      .returning()
      .execute();
    
    testTaskId = result[0].id;
    return result[0];
  };

  it('should update task title only', async () => {
    await createTestTask();

    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Updated Task Title'
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.completed).toEqual(false); // Unchanged
    expect(result.due_date).toBeInstanceOf(Date); // Unchanged
    expect(result.reminder_date).toBeInstanceOf(Date); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task completion status', async () => {
    await createTestTask();

    const input: UpdateTaskInput = {
      id: testTaskId,
      completed: true
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('Original Task'); // Unchanged
    expect(result.completed).toEqual(true); // Updated
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    await createTestTask();

    const newDueDate = new Date('2025-01-15');
    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Multi-field Update',
      description: 'Updated description',
      completed: true,
      due_date: newDueDate,
      reminder_date: null // Clear reminder
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('Multi-field Update');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.due_date).toEqual(newDueDate);
    expect(result.reminder_date).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null when explicitly provided', async () => {
    await createTestTask();

    const input: UpdateTaskInput = {
      id: testTaskId,
      description: null
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(testTaskId);
    expect(result.description).toBeNull();
    expect(result.title).toEqual('Original Task'); // Unchanged
  });

  it('should update dates correctly', async () => {
    await createTestTask();

    const newDueDate = new Date('2025-06-01');
    const newReminderDate = new Date('2025-05-30');

    const input: UpdateTaskInput = {
      id: testTaskId,
      due_date: newDueDate,
      reminder_date: newReminderDate
    };

    const result = await updateTask(input);

    expect(result.due_date).toEqual(newDueDate);
    expect(result.reminder_date).toEqual(newReminderDate);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    await createTestTask();

    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Database Update Test',
      completed: true
    };

    await updateTask(input);

    // Verify changes were saved to database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTaskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Update Test');
    expect(tasks[0].completed).toEqual(true);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should always update the updated_at timestamp', async () => {
    const originalTask = await createTestTask();
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateTaskInput = {
      id: testTaskId,
      title: 'Timestamp Test'
    };

    const result = await updateTask(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTask.updated_at.getTime());
  });

  it('should throw error when task not found', async () => {
    const input: UpdateTaskInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updateTask(input)).rejects.toThrow(/Task with ID 99999 not found/);
  });

  it('should handle empty update gracefully', async () => {
    await createTestTask();

    const input: UpdateTaskInput = {
      id: testTaskId
      // No other fields provided
    };

    const result = await updateTask(input);

    // Should only update the timestamp
    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('Original Task'); // Unchanged
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.completed).toEqual(false); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});