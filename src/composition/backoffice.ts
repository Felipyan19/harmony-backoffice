import { NeonCustomerRepository } from '@/modules/customers/infrastructure/persistence/neon-customer-repository';
import { NeonConversationRepository } from '@/modules/conversations/infrastructure/persistence/neon-conversation-repository';
import { ListCustomers } from '@/modules/customers/application/use-cases/list-customers';
import { GetCustomer } from '@/modules/customers/application/use-cases/get-customer';
import { ListConversations } from '@/modules/conversations/application/use-cases/list-conversations';
import { ChangeConversationStatus } from '@/modules/conversations/application/use-cases/change-conversation-status';

const customerRepository = new NeonCustomerRepository();
const conversationRepository = new NeonConversationRepository();

export const backoffice = {
  customers: {
    list: new ListCustomers(customerRepository),
    get: new GetCustomer(customerRepository),
  },
  conversations: {
    list: new ListConversations(conversationRepository),
    changeStatus: new ChangeConversationStatus(conversationRepository),
  },
};
