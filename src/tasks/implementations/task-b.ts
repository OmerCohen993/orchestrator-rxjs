import { Task } from '../base/task.abstract';

export class TaskB extends Task {
  name = 'b';
  dependencies = ['a'];

  async execute([bResult]: any[]): Promise<string> {
    console.log('🚀 Executing Task B with input:', bResult);
    await new Promise((res) => setTimeout(res, 100));
    return 'Result from B';
  }
}