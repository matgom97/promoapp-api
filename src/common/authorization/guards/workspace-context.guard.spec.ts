import { WorkspaceContextGuard } from './workspace-context.guard.js';

describe('WorkspaceContextGuard', () => {
  it('should be defined', () => {
    expect(new WorkspaceContextGuard()).toBeDefined();
  });
});
