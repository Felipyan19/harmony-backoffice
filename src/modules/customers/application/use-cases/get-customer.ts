import type { CustomerRepository } from '../ports/customer-repository';

export class GetCustomer {
  constructor(private readonly customers: CustomerRepository) {}

  execute(id: string) {
    return this.customers.findById(id);
  }
}
