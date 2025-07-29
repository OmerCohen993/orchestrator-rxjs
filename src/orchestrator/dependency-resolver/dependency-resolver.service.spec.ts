import { Test, TestingModule } from '@nestjs/testing';
import { DependencyResolverService } from './dependency-resolver.service';

describe('DependencyResolverService', () => {
  let service: DependencyResolverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DependencyResolverService],
    }).compile();

    service = module.get<DependencyResolverService>(DependencyResolverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
