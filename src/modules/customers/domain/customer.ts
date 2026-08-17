export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  tags: string[];
  lastSeen: string;
  createdAt: string;
  notes?: string;
}
