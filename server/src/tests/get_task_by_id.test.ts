import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTaskById } from '../handlers/get_task_by_id';

// Test data for creating tasks
const testTaskInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing purposes',
  due_date: new Date('2024-12-31'),
  reminder_date: new Date('2024-12-30')
};

const minimalTaskInput: CreateTaskInput = {
  title: 'Minimal Task'
  // All other fields are optional/nullable
};

describe('getTaskById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a task when ID exists', async () => {
    // Create a task first
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: testTaskInput.title,
        description: testTaskInput.description,
        due_date: testTaskInput.due_date,
        reminder_date: testTaskInput.reminder_date
      })
      .returning()
      .execute();

    const createdTask = createdTasks[0];

    // Fetch the task by ID
    const result = await getTaskById(createdTask.id);

    // Verify the task was found and has correct data
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdTask.id);
    expect(result!.title).toBe('Test Task');
    expect(result!.description).toBe('A task for testing purposes');
    expect(result!.completed).toBe(false); // Default value
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(result!.reminder_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when ID does not exist', async () => {
    // Try to fetch a task with non-existent ID
    const result = await getTaskById(99999);

    expect(result).toBeNull();
  });

  it('should handle tasks with null optional fields', async () => {
    // Create a task with minimal data (null description, dates)
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: minimalTaskInput.title,
        description: null,
        due_date: null,
        reminder_date: null
      })
      .returning()
      .execute();

    const createdTask = createdTasks[0];

    // Fetch the task by ID
    const result = await getTaskById(createdTask.id);

    // Verify the task was found with null fields properly handled
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdTask.id);
    expect(result!.title).toBe('Minimal Task');
    expect(result!.description).toBeNull();
    expect(result!.due_date).toBeNull();
    expect(result!.reminder_date).toBeNull();
    expect(result!.completed).toBe(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle completed tasks correctly', async () => {
    // Create a completed task
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This task is completed',
        completed: true
      })
      .returning()
      .execute();

    const createdTask = createdTasks[0];

    // Fetch the task by ID
    const result = await getTaskById(createdTask.id);

    // Verify the completion status is preserved
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdTask.id);
    expect(result!.title).toBe('Completed Task');
    expect(result!.completed).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle edge case with ID 0', async () => {
    // Try to fetch with ID 0 (which shouldn't exist due to serial starting at 1)
    const result = await getTaskById(0);

    expect(result).toBeNull();
  });

  it('should handle negative ID gracefully', async () => {
    // Try to fetch with negative ID
    const result = await getTaskById(-1);

    expect(result).toBeNull();
  });
});