import { Injectable, OnModuleInit } from '@nestjs/common';
import { Subject, BehaviorSubject, forkJoin, of, from, filter, mergeMap, tap,
         catchError, map, shareReplay, take } from 'rxjs';
import { Task } from 'src/tasks/base/task.abstract';
import { DependencyResolverService } from '../dependency-resolver/dependency-resolver.service';
import { TaskA, TaskB, TaskC, TaskD, TaskE } from '../../tasks/implementations/index';

export interface TaskResult {
  taskName: string;
  result: any;
  error?: Error;
  timestamp: number;
}

@Injectable()
export class OrchestratorRxjsService implements OnModuleInit {
  private tasksMap = new Map<string, Task>();
  private completedTasks = new Set<string>();
  private runningTasks = new Set<string>();
  private executionOrder: string[] = [];
  private results = new Map<string, any>();

  private taskTrigger$ = new Subject<string>();
  private taskCompletion$ = new Subject<TaskResult>();
  private workflowState$ = new BehaviorSubject({
    completed: [] as string[],
    running: [] as string[],
    results: {} as Record<string, any>,
  });

  constructor(private readonly resolver: DependencyResolverService) {}

  onModuleInit() {
    // register your task implementations here
    this.registerTasks([new TaskA(), new TaskB(), new TaskC(), new TaskD(), new TaskE()]);
    this.executionOrder = this.resolver.resolve(Array.from(this.tasksMap.values()));
    this.setupReactiveTaskPipeline();
  }

  private registerTasks(tasks: Task[]) {
    tasks.forEach(task => this.tasksMap.set(task.name, task));
  }

  private updateWorkflowState() {
    this.workflowState$.next({
      completed: Array.from(this.completedTasks),
      running: Array.from(this.runningTasks),
      results: Object.fromEntries(this.results),
    });
  }

  private dependencyResult$(dep: string) {
    return this.taskCompletion$.pipe(
      filter(tr => tr.taskName === dep),
      take(1),
      map(tr => (tr.error ? null : tr.result)),
      catchError(() => of(null))
    );
  }

  private setupReactiveTaskPipeline() {
    const taskExecution$ = this.taskTrigger$.pipe(
      filter(taskName => {
        const task = this.tasksMap.get(taskName);
        return (
          task &&
          !this.completedTasks.has(taskName) &&
          !this.runningTasks.has(taskName) &&
          task.dependencies.every(dep => this.completedTasks.has(dep))
        );
      }),
      tap(taskName => {
        this.runningTasks.add(taskName);
        this.updateWorkflowState();
      }),
      mergeMap(taskName => {
        const task = this.tasksMap.get(taskName)!;
        const depStreams = task.dependencies.map(dep => this.dependencyResult$(dep));
        const deps$ = depStreams.length > 0 ? forkJoin(depStreams) : of([]);
        return deps$.pipe(
          mergeMap(inputs => from(task.execute(inputs))),
          map(result => ({
            taskName,
            result,
            timestamp: Date.now(),
          })),
          catchError(error =>
            of({
              taskName,
              result: null,
              error,
              timestamp: Date.now(),
            })
          )
        );
      }),
      tap(taskResult => {
        const { taskName, result, error } = taskResult;
        if (!error) {
          this.completedTasks.add(taskName);
          this.results.set(taskName, result);
        }
        this.runningTasks.delete(taskName);
        this.updateWorkflowState();
        this.taskCompletion$.next(taskResult);
      }),
      shareReplay(1)
    );

    taskExecution$.subscribe();
  }

  public runWorkflow(): void {
    this.results.clear();
    this.completedTasks.clear();
    this.runningTasks.clear();
    this.updateWorkflowState();
    // trigger root tasks (those without dependencies)
    this.executionOrder
      .filter(taskName => (this.tasksMap.get(taskName)?.dependencies.length || 0) === 0)
      .forEach(taskName => this.taskTrigger$.next(taskName));
  }

  // getters for workflow state and completion can be added here
}