import type { Customer } from '../../domain/customer';

export interface CustomerRepository {
  list(workspaceId: string): Promise<Customer[]>;
  findById(workspaceId: string, id: string): Promise<Customer | null>;
  findByPhone(workspaceId: string, phone: string): Promise<Customer | null>;
}
