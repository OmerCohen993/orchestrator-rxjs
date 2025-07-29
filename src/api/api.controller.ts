import { Controller, Post } from '@nestjs/common';
import { OrchestratorService } from 'src/orchestrator/orchestrator/orchestrator.service';

@Controller('workflow')
export class ApiController {
    constructor(private readonly orchestratorService: OrchestratorService) {}

    @Post()
    async startWorkflow() {
        await this.orchestratorService.runWorkflow();
        return { message: 'Workflow started' };
    }
}
