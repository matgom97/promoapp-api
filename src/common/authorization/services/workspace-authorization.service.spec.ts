import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceAuthorizationService } from './workspace-authorization.service.js';

describe('WorkspaceAuthorizationService', () => {
  let service: WorkspaceAuthorizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkspaceAuthorizationService],
    }).compile();

    service = module.get<WorkspaceAuthorizationService>(WorkspaceAuthorizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
