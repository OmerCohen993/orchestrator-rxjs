import { Task } from '../base/task.abstract';

export class TaskE extends Task {
  readonly name = 'e';
  readonly dependencies = ['c'];

  async execute([aResult]: any[]): Promise<string> {
    console.log('🚀 Executing Task E with input:', aResult);
    await new Promise((res) => setTimeout(res, 300));
    return 'Result from E';
  }
}