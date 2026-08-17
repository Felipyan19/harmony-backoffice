import type { CustomerRepository } from '../../application/ports/customer-repository';
import type { Customer } from '../../domain/customer';
import { getDatabase } from '@/shared/infrastructure/database/neon';

export class NeonCustomerRepository implements CustomerRepository {
  async list(): Promise<Customer[]> {
    const sql = getDatabase();
    const rows = await sql`SELECT id, name, phone, email, notes, tags, created_at, last_seen_at FROM customers ORDER BY COALESCE(last_seen_at, created_at) DESC`;
    return rows.map(mapCustomer);
  }

  async findById(id: string): Promise<Customer | null> {
    const sql = getDatabase();
    const rows = await sql`SELECT id, name, phone, email, notes, tags, created_at, last_seen_at FROM customers WHERE id = ${id} LIMIT 1`;
    return rows[0] ? mapCustomer(rows[0]) : null;
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    const sql = getDatabase();
    const rows = await sql`SELECT id, name, phone, email, notes, tags, created_at, last_seen_at FROM customers WHERE phone = ${phone} LIMIT 1`;
    return rows[0] ? mapCustomer(rows[0]) : null;
  }
}

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    createdAt: new Date(String(row.created_at)).toISOString(),
    lastSeen: row.last_seen_at ? new Date(String(row.last_seen_at)).toISOString() : 'Sin actividad',
  };
}
