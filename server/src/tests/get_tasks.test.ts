import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

// Test data for creating tasks
const testTask1: CreateTaskInput = {
  title: 'First Task',
  description: 'Description for first task',
  due_date: new Date('2024-12-31'),
  reminder_date: new Date('2024-12-30')
};

const testTask2: CreateTaskInput = {
  title: 'Second Task',
  description: null,
  due_date: null,
  reminder_date: null
};

const testTask3: CreateTaskInput = {
  title: 'Third Task',
  description: 'Another task description'
};

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
  });

  it('should return all tasks ordered by created_at descending', async () => {
    // Create multiple tasks with slight delays to ensure different created_at times
    const task1 = await db.insert(tasksTable)
      .values({
        title: testTask1.title,
        description: testTask1.description,
        due_date: testTask1.due_date,
        reminder_date: testTask1.reminder_date
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const task2 = await db.insert(tasksTable)
      .values({
        title: testTask2.title,
        description: testTask2.description,
        due_date: testTask2.due_date,
        reminder_date: testTask2.reminder_date
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const task3 = await db.insert(tasksTable)
      .values({
        title: testTask3.title,
        description: testTask3.description,
        due_date: testTask3.due_date,
        reminder_date: testTask3.reminder_date
      })
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);

    // Verify ordering - newest first (task3, task2, task1)
    expect(result[0].title).toEqual('Third Task');
    expect(result[1].title).toEqual('Second Task');
    expect(result[2].title).toEqual('First Task');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return tasks with correct field types and values', async () => {
    // Create a task with all fields populated
    await db.insert(tasksTable)
      .values({
        title: testTask1.title,
        description: testTask1.description,
        due_date: testTask1.due_date,
        reminder_date: testTask1.reminder_date,
        completed: true
      })
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    
    const task = result[0];

    // Verify all field types and values
    expect(typeof task.id).toBe('number');
    expect(task.title).toEqual('First Task');
    expect(task.description).toEqual('Description for first task');
    expect(typeof task.completed).toBe('boolean');
    expect(task.completed).toBe(true);
    expect(task.due_date).toBeInstanceOf(Date);
    expect(task.reminder_date).toBeInstanceOf(Date);
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);

    // Verify date values
    expect(task.due_date?.toISOString().split('T')[0]).toBe('2024-12-31');
    expect(task.reminder_date?.toISOString().split('T')[0]).toBe('2024-12-30');
  });

  it('should handle tasks with null optional fields', async () => {
    // Create a task with minimal fields (null optionals)
    await db.insert(tasksTable)
      .values({
        title: testTask2.title,
        description: testTask2.description,
        due_date: testTask2.due_date,
        reminder_date: testTask2.reminder_date
      })
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    
    const task = result[0];

    expect(task.title).toEqual('Second Task');
    expect(task.description).toBeNull();
    expect(task.due_date).toBeNull();
    expect(task.reminder_date).toBeNull();
    expect(task.completed).toBe(false); // Default value
  });

  it('should handle mixed completed and pending tasks', async () => {
    // Create completed task
    await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This is done',
        completed: true
      })
      .returning()
      .execute();

    // Create pending task
    await db.insert(tasksTable)
      .values({
        title: 'Pending Task',
        description: 'This is not done',
        completed: false
      })
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);

    // Find tasks by title
    const completedTask = result.find(task => task.title === 'Completed Task');
    const pendingTask = result.find(task => task.title === 'Pending Task');

    expect(completedTask).toBeDefined();
    expect(completedTask?.completed).toBe(true);
    
    expect(pendingTask).toBeDefined();
    expect(pendingTask?.completed).toBe(false);
  });

  it('should verify created_at and updated_at are set automatically', async () => {
    const beforeCreation = new Date();
    
    await db.insert(tasksTable)
      .values({
        title: 'Time Test Task',
        description: 'Testing timestamps'
      })
      .returning()
      .execute();

    const afterCreation = new Date();
    const result = await getTasks();

    expect(result).toHaveLength(1);
    
    const task = result[0];

    // Verify timestamps are within expected range
    expect(task.created_at >= beforeCreation).toBe(true);
    expect(task.created_at <= afterCreation).toBe(true);
    expect(task.updated_at >= beforeCreation).toBe(true);
    expect(task.updated_at <= afterCreation).toBe(true);
  });
});