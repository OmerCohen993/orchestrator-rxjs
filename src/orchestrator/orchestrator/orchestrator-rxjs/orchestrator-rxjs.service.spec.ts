import { Test, TestingModule } from '@nestjs/testing';
import { OrchestratorRxjsService } from './orchestrator-rxjs.service';

describe('OrchestratorRxjsService', () => {
  let service: OrchestratorRxjsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrchestratorRxjsService],
    }).compile();

    service = module.get<OrchestratorRxjsService>(OrchestratorRxjsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
