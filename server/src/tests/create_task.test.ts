import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Basic test input
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  due_date: new Date('2024-12-31'),
  reminder_date: new Date('2024-12-30')
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with all fields', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toEqual(false);
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.reminder_date).toEqual(new Date('2024-12-30'));
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal fields (title only)', async () => {
    const minimalInput: CreateTaskInput = {
      title: 'Minimal Task'
    };

    const result = await createTask(minimalInput);

    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.due_date).toBeNull();
    expect(result.reminder_date).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with null description', async () => {
    const inputWithNullDescription: CreateTaskInput = {
      title: 'Task with null description',
      description: null,
      due_date: new Date('2024-12-25')
    };

    const result = await createTask(inputWithNullDescription);

    expect(result.title).toEqual('Task with null description');
    expect(result.description).toBeNull();
    expect(result.due_date).toEqual(new Date('2024-12-25'));
    expect(result.reminder_date).toBeNull();
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].due_date).toEqual(new Date('2024-12-31'));
    expect(tasks[0].reminder_date).toEqual(new Date('2024-12-30'));
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set completed to false by default', async () => {
    const result = await createTask({
      title: 'Default Completion Test'
    });

    expect(result.completed).toEqual(false);

    // Verify in database as well
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].completed).toEqual(false);
  });

  it('should handle dates correctly', async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 86400000); // Tomorrow
    
    const dateInput: CreateTaskInput = {
      title: 'Date Test Task',
      due_date: futureDate,
      reminder_date: now
    };

    const result = await createTask(dateInput);

    expect(result.due_date).toEqual(futureDate);
    expect(result.reminder_date).toEqual(now);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify dates are stored correctly in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].due_date).toEqual(futureDate);
    expect(tasks[0].reminder_date).toEqual(now);
  });

  it('should create multiple tasks independently', async () => {
    const task1 = await createTask({
      title: 'First Task',
      description: 'First description'
    });

    const task2 = await createTask({
      title: 'Second Task',
      description: 'Second description'
    });

    expect(task1.id).not.toEqual(task2.id);
    expect(task1.title).toEqual('First Task');
    expect(task2.title).toEqual('Second Task');

    // Verify both tasks exist in database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(2);
    const titles = allTasks.map(t => t.title).sort();
    expect(titles).toEqual(['First Task', 'Second Task']);
  });
});