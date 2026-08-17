import type { Customer } from '../../domain/customer';

export interface CustomerRepository {
  list(): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  findByPhone(phone: string): Promise<Customer | null>;
}
