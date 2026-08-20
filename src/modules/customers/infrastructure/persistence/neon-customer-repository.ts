import 'server-only';

import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { CustomerRepository } from '../../application/ports/customer-repository';
import type { Customer } from '../../domain/customer';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import { customerTagAssignments, customerTags, customers } from '@/shared/infrastructure/database/schema';

export class NeonCustomerRepository implements CustomerRepository {
  async list(workspaceId: string): Promise<Customer[]> {
    const db = getDrizzleDatabase();
    const rows = await db
      .select()
      .from(customers)
      .where(eq(customers.workspaceId, workspaceId))
      .orderBy(desc(sql`coalesce(${customers.lastSeenAt}, ${customers.createdAt})`));

    return Promise.all(rows.map(async (row) => mapCustomer(row, await this.loadTags(workspaceId, row.id))));
  }

  async findById(workspaceId: string, id: string): Promise<Customer | null> {
    const db = getDrizzleDatabase();
    const [row] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.workspaceId, workspaceId), eq(customers.id, id)))
      .limit(1);
    return row ? mapCustomer(row, await this.loadTags(workspaceId, row.id)) : null;
  }

  async findByPhone(workspaceId: string, phone: string): Promise<Customer | null> {
    const db = getDrizzleDatabase();
    const [row] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.workspaceId, workspaceId), eq(customers.phone, phone)))
      .limit(1);
    return row ? mapCustomer(row, await this.loadTags(workspaceId, row.id)) : null;
  }

  private async loadTags(workspaceId: string, customerId: string): Promise<string[]> {
    const db = getDrizzleDatabase();
    const rows = await db
      .select({ name: customerTags.name })
      .from(customerTagAssignments)
      .innerJoin(
        customerTags,
        and(
          eq(customerTagAssignments.workspaceId, customerTags.workspaceId),
          eq(customerTagAssignments.tagId, customerTags.id),
        ),
      )
      .where(
        and(
          eq(customerTagAssignments.workspaceId, workspaceId),
          eq(customerTagAssignments.customerId, customerId),
        ),
      )
      .orderBy(asc(customerTags.name));
    return rows.map((row) => row.name);
  }
}

function mapCustomer(row: typeof customers.$inferSelect, tags: string[]): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    tags,
    createdAt: row.createdAt.toISOString(),
    lastSeen: row.lastSeenAt ? row.lastSeenAt.toISOString() : 'Sin actividad',
  };
}
