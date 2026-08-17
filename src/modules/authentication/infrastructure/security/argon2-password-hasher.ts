import 'server-only';

import { hash, verify } from '@node-rs/argon2';
import type { PasswordHasher } from '../../application/ports/password-hasher';

// @node-rs/argon2 defaults to Argon2id. Omitting the ambient const enum keeps
// this adapter compatible with TypeScript isolatedModules while preserving Argon2id.
const OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

export class Argon2PasswordHasher implements PasswordHasher {
  hash(password: string) {
    return hash(password.normalize('NFKC'), OPTIONS);
  }

  verify(passwordHash: string, password: string) {
    return verify(passwordHash, password.normalize('NFKC'));
  }
}
