import 'server-only';

import { desc, eq, sql } from 'drizzle-orm';
import type { CustomerRepository } from '../../application/ports/customer-repository';
import type { Customer } from '../../domain/customer';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import { customers } from '@/shared/infrastructure/database/schema';

export class NeonCustomerRepository implements CustomerRepository {
  async list(): Promise<Customer[]> {
    const db = getDrizzleDatabase();
    const rows = await db.select().from(customers).orderBy(desc(sql`coalesce(${customers.lastSeenAt}, ${customers.createdAt})`));
    return rows.map(mapCustomer);
  }

  async findById(id: string): Promise<Customer | null> {
    const db = getDrizzleDatabase();
    const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return row ? mapCustomer(row) : null;
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    const db = getDrizzleDatabase();
    const [row] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
    return row ? mapCustomer(row) : null;
  }
}

function mapCustomer(row: typeof customers.$inferSelect): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.createdAt.toISOString(),
    lastSeen: row.lastSeenAt ? row.lastSeenAt.toISOString() : 'Sin actividad',
  };
}
