export abstract class Task {
  abstract name: string;
  abstract dependencies: string[];

  /**
   * Executes the task.
   * @param inputs results from dependent tasks
   * @returns result object or value
   */
  abstract execute(inputs: any[]): Promise<any>;
}