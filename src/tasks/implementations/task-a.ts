import { Task } from '../base/task.abstract';

export class TaskA extends Task {
  readonly name = 'a';
  readonly dependencies: string[] = [];

  async execute(): Promise<string> {
    console.log('Executing Task A');
    await new Promise((resolve) => setTimeout(resolve, 150)); // simulate delay
    return 'Result of A';
  }
}