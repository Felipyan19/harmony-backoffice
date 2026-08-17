import { AuthenticateUser } from '@/modules/authentication/application/authenticate-user';
import { PostgresCredentialRepository } from '@/modules/authentication/infrastructure/persistence/postgres-credential-repository';
import { Argon2PasswordHasher } from '@/modules/authentication/infrastructure/security/argon2-password-hasher';

export const credentialRepository = new PostgresCredentialRepository();
export const passwordHasher = new Argon2PasswordHasher();
export const authenticateUser = new AuthenticateUser(credentialRepository, passwordHasher);
