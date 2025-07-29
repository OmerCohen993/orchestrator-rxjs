import { Task } from '../base/task.abstract';

export class TaskA extends Task {
  name = 'a';
  dependencies = [];

  async execute(): Promise<string> {
    console.log('🚀 Executing Task A');
    await new Promise((res) => setTimeout(res, 150)); // simulate delay
    return 'Result from A';
  }
}