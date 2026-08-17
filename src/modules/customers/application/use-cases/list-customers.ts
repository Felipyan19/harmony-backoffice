import type { CustomerRepository } from '../ports/customer-repository';

export class ListCustomers {
  constructor(private readonly customers: CustomerRepository) {}

  execute() {
    return this.customers.list();
  }
}
