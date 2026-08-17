import type { AccessRepository, AccessResolution, LinkIdentityInput } from '../ports/access-repository';

export class ResolveAccessProfile {
  constructor(private readonly repository: AccessRepository) {}

  execute(input: LinkIdentityInput): Promise<AccessResolution> {
    return this.repository.resolveIdentity(input);
  }
}
