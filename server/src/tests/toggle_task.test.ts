import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskInput } from '../schema';
import { toggleTask } from '../handlers/toggle_task';
import { eq } from 'drizzle-orm';

describe('toggleTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle a task from incomplete to complete', async () => {
    // Create a test task that is initially incomplete
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        completed: false,
        due_date: null,
        reminder_date: null
      })
      .returning()
      .execute();

    const createdTask = taskResult[0];
    
    const input: ToggleTaskInput = {
      id: createdTask.id
    };

    const result = await toggleTask(input);

    // Verify the task is now complete
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toBe(true); // Should be toggled to true
    expect(result.due_date).toBeNull();
    expect(result.reminder_date).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should toggle a task from complete to incomplete', async () => {
    // Create a test task that is initially complete
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'A completed task for testing',
        completed: true,
        due_date: new Date('2024-12-31'),
        reminder_date: new Date('2024-12-30')
      })
      .returning()
      .execute();

    const createdTask = taskResult[0];
    
    const input: ToggleTaskInput = {
      id: createdTask.id
    };

    const result = await toggleTask(input);

    // Verify the task is now incomplete
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Completed Task');
    expect(result.description).toEqual('A completed task for testing');
    expect(result.completed).toBe(false); // Should be toggled to false
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.reminder_date).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should update the database record', async () => {
    // Create a test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Database Test Task',
        description: null,
        completed: false,
        due_date: null,
        reminder_date: null
      })
      .returning()
      .execute();

    const createdTask = taskResult[0];
    
    const input: ToggleTaskInput = {
      id: createdTask.id
    };

    await toggleTask(input);

    // Query the database directly to verify the change was persisted
    const updatedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(updatedTasks).toHaveLength(1);
    const updatedTask = updatedTasks[0];
    expect(updatedTask.completed).toBe(true);
    expect(updatedTask.updated_at.getTime()).toBeGreaterThan(updatedTask.created_at.getTime());
  });

  it('should throw error for non-existent task', async () => {
    const input: ToggleTaskInput = {
      id: 99999 // Non-existent ID
    };

    await expect(toggleTask(input)).rejects.toThrow(/Task with ID 99999 not found/i);
  });

  it('should preserve other task fields when toggling', async () => {
    // Create a task with all fields populated
    const dueDate = new Date('2024-12-25');
    const reminderDate = new Date('2024-12-24');
    
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Full Task',
        description: 'Task with all fields',
        completed: false,
        due_date: dueDate,
        reminder_date: reminderDate
      })
      .returning()
      .execute();

    const createdTask = taskResult[0];
    
    const input: ToggleTaskInput = {
      id: createdTask.id
    };

    const result = await toggleTask(input);

    // Verify all other fields are preserved
    expect(result.title).toEqual('Full Task');
    expect(result.description).toEqual('Task with all fields');
    expect(result.due_date?.getTime()).toEqual(dueDate.getTime());
    expect(result.reminder_date?.getTime()).toEqual(reminderDate.getTime());
    expect(result.completed).toBe(true); // Only this should change
  });
});