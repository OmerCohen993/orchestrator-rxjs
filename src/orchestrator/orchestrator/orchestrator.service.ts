import { Injectable, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';
import { Task } from 'src/tasks/base/task.abstract';
import { DependencyResolverService } from '../dependency-resolver/dependency-resolver.service';
import { TaskA, TaskB, TaskC, TaskD, TaskE } from '../../tasks/implementations/index';


@Injectable()
export class OrchestratorService implements OnModuleInit{
    private tasksMap = new Map<string, Task>();
    private results = new Map<string, any>(); //todo add result type
    private completedTasks = new Set<string>();
    private subject$ = new Subject<string>();
    private executionOrder: string[] = [];

    constructor(
        private readonly resolver: DependencyResolverService
    ) {}

    onModuleInit() {
        this.registerTasks([new TaskA(), new TaskB(), new TaskC(), new TaskD(), new TaskE()]);
        this.executionOrder = this.resolver.resolve(Array.from(this.tasksMap.values()));
        this.startWorkflow();
    }

    private registerTasks(tasks: Task[]) {
        for(const task of tasks) {
            this.tasksMap.set(task.name, task);
        }
    }

    private startWorkflow() {
        for(const taskName of this.executionOrder) {
            this.subject$.subscribe((doneTask) => {
                const task = this.tasksMap.get(taskName);

                if(!task || this.completedTasks.has(taskName)) {
                    return;
                }

                const deps = task.dependencies;
                const allDepsCompleted = deps.every((dep) => this.completedTasks.has(dep));

                if(allDepsCompleted) {
                    const inputs = deps.map((dep) => this.results.get(dep));

                    task.execute(inputs).then((output) => {
                        console.log( `Task ${taskName} completed with result:`, output);

                        this.completedTasks.add(taskName);
                        this.results.set(taskName, output);
                        this.subject$.next(taskName);
                    });
                }
            });
        }

        for(const taskName of this.executionOrder) {
            const task = this.tasksMap.get(taskName);
            if (task?.dependencies.length === 0) {
                this.subject$.next(taskName);
            }
        }
    }
}
