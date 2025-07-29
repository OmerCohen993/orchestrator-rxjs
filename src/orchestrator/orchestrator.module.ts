import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator/orchestrator.service';
import { DependencyResolverService } from './dependency-resolver/dependency-resolver.service';

@Module({
  providers: [OrchestratorService, DependencyResolverService]
})
export class OrchestratorModule {}
