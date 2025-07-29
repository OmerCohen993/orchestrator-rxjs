import { Task } from '../base/task.abstract';

export class TaskB extends Task {
  readonly name = 'b';
  readonly dependencies = ['a'];

  async execute(inputs: Record<string, any>): Promise<string> {
    console.log('Executing Task B with input:', inputs['a']);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return 'Result of B';
  }
}