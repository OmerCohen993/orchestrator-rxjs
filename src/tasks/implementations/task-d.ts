import { Task } from '../base/task.abstract';

export class TaskD extends Task {
  readonly name = 'd';
  readonly dependencies = ['b', 'c'];

  async execute(inputs: Record<string, any>): Promise<string> {
    console.log('Executing Task D with inputs:', inputs['b'], inputs['c']);
    await new Promise((resolve) => setTimeout(resolve, 200));
    return 'Result of D';
  }
}