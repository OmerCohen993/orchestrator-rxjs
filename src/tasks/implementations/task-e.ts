import { Task } from '../base/task.abstract';

export class TaskE extends Task {
  readonly name = 'e';
  readonly dependencies = ['c'];

  async execute(inputs: Record<string, any>): Promise<string> {
    console.log('Executing Task E with input:', inputs['c']);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return 'Result of E';
  }
}