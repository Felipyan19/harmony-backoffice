import 'server-only';

import { hash, verify } from '@node-rs/argon2';
import type { PasswordHasher } from '../../application/ports/password-hasher';

const ARGON2ID = 2;

const OPTIONS = {
  algorithm: ARGON2ID,
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
