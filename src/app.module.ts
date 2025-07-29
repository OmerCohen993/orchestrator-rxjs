import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { TasksModule } from './tasks/tasks.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [OrchestratorModule, TasksModule, ApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
