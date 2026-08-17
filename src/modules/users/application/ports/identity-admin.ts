export interface IdentityAdmin {
  createUser(input: { email: string; password: string; name: string }): Promise<{ subject: string; email: string; name: string }>;
  removeUser(subject: string): Promise<void>;
  setDisabled(subject: string, disabled: boolean): Promise<void>;
}
