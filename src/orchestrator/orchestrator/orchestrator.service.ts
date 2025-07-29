import { Injectable, OnModuleInit } from '@nestjs/common';
import { Subject, filter, mergeMap, tap } from 'rxjs';
import { Task } from 'src/tasks/base/task.abstract';
import { DependencyResolverService } from '../dependency-resolver/dependency-resolver.service';
import { TaskA, TaskB, TaskC, TaskD, TaskE } from '../../tasks/implementations/index';

@Injectable()
export class OrchestratorService implements OnModuleInit {
  private tasksMap = new Map<string, Task>();
  private results = new Map<string, any>();
  private completedTasks = new Set<string>();
  private runningTasks = new Set<string>(); // ✅ חדש
  private executionOrder: string[] = [];
  private taskTrigger$ = new Subject<string>();

  constructor(private readonly resolver: DependencyResolverService) {}

  onModuleInit() {
    this.registerTasks([new TaskA(), new TaskB(), new TaskC(), new TaskD(), new TaskE()]);
    this.executionOrder = this.resolver.resolve(Array.from(this.tasksMap.values()));
    this.setupTaskPipeline();
  }

  private registerTasks(tasks: Task[]) {
    tasks.forEach(task => this.tasksMap.set(task.name,task));
  }


  private setupTaskPipeline() {
    this.taskTrigger$
      .pipe(
        filter((taskName) => {
          const task = this.tasksMap.get(taskName);
          return (
            task !== undefined &&
            !this.completedTasks.has(taskName) &&
            !this.runningTasks.has(taskName) // ✅ מניעת הרצה כפולה
          );
        }),
        filter((taskName) => {
          const task = this.tasksMap.get(taskName)!;
          return task.dependencies.every((dep) => this.completedTasks.has(dep));
        }),
        tap((taskName) => {
          this.runningTasks.add(taskName); // ✅ סמן כהרצה
        }),
        mergeMap(async (taskName) => {
          const task = this.tasksMap.get(taskName)!;
          const inputs = task.dependencies.map((dep) => this.results.get(dep));
          const result = await task.execute(inputs);
          return { taskName, result };
        }),
        tap(({ taskName, result }) => {
          console.log(`✅ Task ${taskName} completed with result:`, result);
          this.completedTasks.add(taskName);
          this.results.set(taskName, result);
          this.runningTasks.delete(taskName); // ✅ סיים הרצה
        }),
        tap(({ taskName }) => {
          for (const nextTaskName of this.executionOrder) {
            const nextTask = this.tasksMap.get(nextTaskName);
            if (
              nextTask &&
              !this.completedTasks.has(nextTaskName) &&
              !this.runningTasks.has(nextTaskName) &&
              nextTask.dependencies.every((dep) => this.completedTasks.has(dep))
            ) {
              this.taskTrigger$.next(nextTaskName);
            }
          }
        })
      )
      .subscribe();
  }

  public runWorkflow(): void {
    for (const taskName of this.executionOrder) {
      const task = this.tasksMap.get(taskName);
      if (task?.dependencies.length === 0) {
        this.taskTrigger$.next(taskName);
      }
    }
  }
}