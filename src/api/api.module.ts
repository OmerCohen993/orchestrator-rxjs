import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { OrchestratorModule } from 'src/orchestrator/orchestrator.module';

@Module({
  imports: [OrchestratorModule],
  controllers: [ApiController]
})
export class ApiModule {}
