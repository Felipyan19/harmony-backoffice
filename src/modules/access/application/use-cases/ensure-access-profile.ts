import type { AccessProfile } from '../../domain/access';
import type { AccessRepository, EnsureIdentityInput } from '../ports/access-repository';

export class EnsureAccessProfile {
  constructor(private readonly repository: AccessRepository) {}

  execute(input: EnsureIdentityInput): Promise<AccessProfile> {
    return this.repository.ensureIdentity(input);
  }
}
