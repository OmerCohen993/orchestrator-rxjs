import { Injectable } from '@nestjs/common';
import { Task } from 'src/tasks/base/task.abstract';
import toposort from 'toposort';

@Injectable()
export class DependencyResolverService {
    private executionOrder: string[] = [];

    public resolve(tasks: Task[]): string[] {
        const edges: [string, string][] = [];
        
        for(const task of tasks) {
            for(const dep of task.dependencies) {
                edges.push([dep, task.name]);
            }
        }

        this.executionOrder = toposort(edges);
        return this.executionOrder;
    }

    public getExecutionOrder(): string[] {
        return this.executionOrder;
    }
}
