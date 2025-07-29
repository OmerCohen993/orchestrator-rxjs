export abstract class Task {
    abstract readonly name: string;
    abstract readonly dependencies: string[];
    abstract execute(inputs: Record<string, any>): Promise<any>
;}