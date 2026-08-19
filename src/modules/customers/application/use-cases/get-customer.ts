import type { CustomerRepository } from '../ports/customer-repository';

export class GetCustomer {
  constructor(private readonly customers: CustomerRepository) {}

  execute(workspaceId: string, id: string) {
    return this.customers.findById(workspaceId, id);
  }
}
