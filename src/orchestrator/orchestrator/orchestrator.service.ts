import { Injectable, OnModuleInit } from '@nestjs/common';
import { Subject, filter, mergeMap, tap, catchError, of, shareReplay, from, EMPTY, BehaviorSubject, combineLatest, startWith } from 'rxjs';
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
export class OrchestratorService implements OnModuleInit {
  private tasksMap = new Map<string, Task>();
  private results = new Map<string, any>();
  private completedTasks = new Set<string>();
  private runningTasks = new Set<string>();
  private executionOrder: string[] = [];

  // 🔥 RxJS Subjects for reactive state management
  private taskTrigger$ = new Subject<string>();
  private taskCompletion$ = new Subject<TaskResult>();
  private workflowState$ = new BehaviorSubject<{
    completed: string[];
    running: string[];
    results: Record<string, any>;
  }>({
    completed: [],
    running: [],
    results: {}
  });

  // 🔥 Shared observables with replay for efficiency
  private taskResults$ = this.taskCompletion$.pipe(
    tap(({ taskName, result, error }) => {
      if (error) {
        console.log(`❌ Task ${taskName} failed:`, error.message);
      } else {
        console.log(`✅ Task ${taskName} completed with result:`, result);
        this.completedTasks.add(taskName);
        this.results.set(taskName, result);
      }
      this.runningTasks.delete(taskName);
      this.updateWorkflowState();
    }),
    shareReplay(1) // 🔥 Share and replay last result for late subscribers
  );

  // 🔥 Observable for triggering next tasks
  private nextTaskTrigger$ = this.taskResults$.pipe(
    filter(({ error }) => !error), // Only proceed if task succeeded
    tap(({ taskName }) => this.triggerNextTasks()),
    shareReplay(1)
  );

  constructor(private readonly resolver: DependencyResolverService) {}

  onModuleInit() {
    this.registerTasks([new TaskA(), new TaskB(), new TaskC(), new TaskD(), new TaskE()]);
    this.executionOrder = this.resolver.resolve(Array.from(this.tasksMap.values()));
    this.executionOrder.forEach( task => console.log(`task: ${task}`))
    this.setupReactiveTaskPipeline();
  }

  private registerTasks(tasks: Task[]) {
    tasks.forEach(task => this.tasksMap.set(task.name, task));
  }

  private updateWorkflowState() {
    this.workflowState$.next({
      completed: Array.from(this.completedTasks),
      running: Array.from(this.runningTasks),
      results: Object.fromEntries(this.results)
    });
  }

  // 🔥 Fully reactive task pipeline
  private setupReactiveTaskPipeline() {
    // Main task execution pipeline
    const taskExecution$ = this.taskTrigger$.pipe(
      filter((taskName) => {
        const task = this.tasksMap.get(taskName);
        const canExecute = task !== undefined &&
          !this.completedTasks.has(taskName) &&
          !this.runningTasks.has(taskName);
        
        if (!canExecute) {
          console.log(`🚫 Task ${taskName} filtered - already processed or invalid`);
        }
        return canExecute;
      }),
      filter((taskName) => {
        const task = this.tasksMap.get(taskName)!;
        const dependenciesReady = task.dependencies.every((dep) => this.completedTasks.has(dep));
        
        if (!dependenciesReady) {
          console.log(`⏳ Task ${taskName} waiting for dependencies: ${task.dependencies.filter(dep => !this.completedTasks.has(dep))}`);
        }
        return dependenciesReady;
      }),
      tap((taskName) => {
        this.runningTasks.add(taskName);
        this.updateWorkflowState();
        console.log(`🚀 Starting task: ${taskName}`);
      }),
      // 🔥 Convert task execution to observable stream
      mergeMap((taskName) => {
        const task = this.tasksMap.get(taskName)!;
        const inputs = task.dependencies.map((dep) => this.results.get(dep));
        
        console.log(`📥 Task ${taskName} inputs:`, inputs);
        
        // 🔥 Convert Promise to Observable and handle errors reactively
        return from(task.execute(inputs)).pipe(
          // 🔥 Transform success result
          mergeMap((result) => of({
            taskName,
            result,
            timestamp: Date.now()
          })),
          // 🔥 Handle errors reactively
          catchError((error) => of({
            taskName,
            result: null,
            error,
            timestamp: Date.now()
          }))
        );
      }),
      // 🔥 Emit results to completion stream
      tap((taskResult) => this.taskCompletion$.next(taskResult)),
      shareReplay(1) // 🔥 Share execution results
    );

    // 🔥 Subscribe to the reactive pipeline
    const executionSubscription = taskExecution$.subscribe();
    
    // 🔥 Subscribe to next task triggering
    const nextTaskSubscription = this.nextTaskTrigger$.subscribe();

    // 🔥 Optional: Clean up subscriptions (in a real app, handle this in onDestroy)
    // Store subscriptions for cleanup if needed
  }

  // 🔥 Reactive method to trigger next tasks
  private triggerNextTasks() {
    for (const nextTaskName of this.executionOrder) {
      const nextTask = this.tasksMap.get(nextTaskName);
      if (
        nextTask &&
        !this.completedTasks.has(nextTaskName) &&
        !this.runningTasks.has(nextTaskName) &&
        nextTask.dependencies.every((dep) => this.completedTasks.has(dep))
      ) {
        console.log(`🔄 Triggering next task: ${nextTaskName}`);
        this.taskTrigger$.next(nextTaskName);
      }
    }
  }

  // 🔥 Reactive workflow execution
  public runWorkflow(): void {
    console.log('🎬 Starting reactive workflow');
    
    // Reset state
    this.results.clear();
    this.completedTasks.clear();
    this.runningTasks.clear();
    this.updateWorkflowState();

    // 🔥 Find and trigger root tasks reactively
    const rootTasks$ = of(this.executionOrder).pipe(
      mergeMap(tasks => tasks),
      filter(taskName => {
        const task = this.tasksMap.get(taskName);
        return task?.dependencies.length === 0;
      }),
      tap(taskName => console.log(`🌱 Root task found: ${taskName}`)),
      shareReplay()
    );

    // 🔥 Trigger all root tasks
    rootTasks$.subscribe(taskName => this.taskTrigger$.next(taskName));
  }

  // 🔥 Observable API for external subscribers
  public getWorkflowState$() {
    return this.workflowState$.asObservable();
  }

  public getTaskResults$() {
    return this.taskResults$;
  }

  public getTaskCompletions$() {
    return this.taskCompletion$.asObservable();
  }

  // 🔥 Reactive workflow completion detection
  public getWorkflowCompletion$() {
    return this.workflowState$.pipe(
      filter(state => {
        const totalTasks = this.executionOrder.length;
        const processedTasks = state.completed.length;
        const isComplete = processedTasks === totalTasks && state.running.length === 0;
        
        if (isComplete) {
          console.log('🏁 Workflow completed reactively!');
        }
        
        return isComplete;
      }),
      shareReplay(1)
    );
  }

  // 🔥 Advanced: Reactive task dependency tracking
  public getTaskDependencyStatus$(taskName: string) {
    return this.workflowState$.pipe(
      mergeMap(state => {
        const task = this.tasksMap.get(taskName);
        if (!task) return EMPTY;

        const dependencyStatuses = task.dependencies.map(dep => ({
          dependency: dep,
          completed: state.completed.includes(dep),
          result: state.results[dep]
        }));

        const allDependenciesReady = dependencyStatuses.every(dep => dep.completed);
        const canExecute = allDependenciesReady && 
          !state.completed.includes(taskName) && 
          !state.running.includes(taskName);

        return of({
          taskName,
          dependencies: dependencyStatuses,
          canExecute,
          allDependenciesReady
        });
      }),
      shareReplay(1)
    );
  }

  // 🔥 Reactive progress tracking
  public getWorkflowProgress$() {
    return this.workflowState$.pipe(
      mergeMap(state => {
        const total = this.executionOrder.length;
        const completed = state.completed.length;
        const running = state.running.length;
        const pending = total - completed - running;
        const progress = total > 0 ? (completed / total) * 100 : 0;

        return of({
          total,
          completed,
          running,
          pending,
          progress: Math.round(progress * 100) / 100,
          isComplete: completed === total && running === 0
        });
      }),
      startWith({
        total: this.executionOrder.length,
        completed: 0,
        running: 0,
        pending: this.executionOrder.length,
        progress: 0,
        isComplete: false
      }),
      shareReplay(1)
    );
  }

  // 🔥 Real-time task monitoring
  public monitorTask$(taskName: string) {
    return combineLatest([
      this.workflowState$,
      this.taskCompletion$.pipe(startWith(null))
    ]).pipe(
      mergeMap(([state, lastCompletion]) => {
        const isRunning = state.running.includes(taskName);
        const isCompleted = state.completed.includes(taskName);
        const result = state.results[taskName];
        const lastUpdate = lastCompletion?.taskName === taskName ? lastCompletion : null;

        return of({
          taskName,
          status: isCompleted ? 'completed' : isRunning ? 'running' : 'pending',
          result,
          lastUpdate,
          timestamp: Date.now()
        });
      }),
      shareReplay(1)
    );
  }

  // Backward compatibility methods
  public getExecutionOrder(): string[] {
    return this.executionOrder;
  }

  public getCurrentResults(): Map<string, any> {
    return new Map(this.results);
  }

  public getCompletedTasks(): Set<string> {
    return new Set(this.completedTasks);
  }
}