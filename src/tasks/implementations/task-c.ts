import { Task } from '../base/task.abstract';

export class TaskC extends Task {
  readonly name = 'c';
  readonly dependencies = ['a'];

  async execute(inputs: Record<string, any>): Promise<string> {
    console.log('Executing Task C with input:', inputs['a']);
    await new Promise((resolve) => setTimeout(resolve, 50));
    return 'Result of C';
  }
}