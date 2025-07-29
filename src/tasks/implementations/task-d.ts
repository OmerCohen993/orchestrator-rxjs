import { Task } from '../base/task.abstract';

export class TaskD extends Task {
  readonly name = 'd';
  readonly dependencies = ['b', 'c'];

   async execute([aResult]: any[]): Promise<string> {
    console.log('🚀 Executing Task D with input:', aResult);
    await new Promise((res) => setTimeout(res, 200));
    return 'Result from D';
  }
}