import { Task } from '../base/task.abstract';

export class TaskC extends Task {
  readonly name = 'c';
  readonly dependencies = ['a'];

  async execute([cResult]: any[]): Promise<string> {
    console.log('🚀 Executing Task C with input:', cResult);
    await new Promise((res) => setTimeout(res, 50));
    return 'Result from C';
  }
}

