import { db } from '../infra/database/connection';
import { userMarketplace } from '../infra/database/schema';
import { UserMarketplace } from '../entities/UserMarketplace';
import { eq } from 'drizzle-orm';

export class UserMarketplaceRepository {
  async create(entity: UserMarketplace): Promise<UserMarketplace> {
    const [result] = await db
      .insert(userMarketplace)
      .values({
        nome: entity.nome,
        type: entity.type,
        status: entity.status,
        accessToken: entity.accessToken,
        refreshToken: entity.refreshToken,
      })
      .returning();

    return new UserMarketplace(
      result.nome,
      result.type,
      result.status ?? true,
      result.id,
      result.createdIn ?? undefined,
      result.accessToken ?? undefined,
      result.refreshToken ?? undefined
    );
  }

  async findAll(): Promise<UserMarketplace[]> {
    const results = await db.select().from(userMarketplace);
    return results.map(
      (r) =>
        new UserMarketplace(
          r.nome,
          r.type,
          r.status ?? true,
          r.id,
          r.createdIn ?? undefined,
          r.accessToken ?? undefined,
          r.refreshToken ?? undefined
        )
    );
  }

  async findById(id: string): Promise<UserMarketplace | null> {
    const [result] = await db
      .select()
      .from(userMarketplace)
      .where(eq(userMarketplace.id, id));

    if (!result) return null;

    return new UserMarketplace(
      result.nome,
      result.type,
      result.status ?? true,
      result.id,
      result.createdIn ?? undefined,
      result.accessToken ?? undefined,
      result.refreshToken ?? undefined
    );
  }

  async findLastCreated(): Promise<UserMarketplace | null> {
    const results = await db
      .select()
      .from(userMarketplace)
      .orderBy(userMarketplace.createdIn)
      .limit(1);

    if (results.length === 0) return null;

    const r = results[0];
    return new UserMarketplace(
      r.nome,
      r.type,
      r.status ?? true,
      r.id,
      r.createdIn ?? undefined,
      r.accessToken ?? undefined,
      r.refreshToken ?? undefined
    );
  }

  async update(id: string, entity: Partial<UserMarketplace>): Promise<UserMarketplace | null> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`UserMarketplace with id ${id} not found`);
    }

    const updateData: any = {};
    if (entity.nome !== undefined) updateData.nome = entity.nome;
    if (entity.type !== undefined) updateData.type = entity.type;
    if (entity.status !== undefined) updateData.status = entity.status;
    if (entity.accessToken !== undefined) updateData.accessToken = entity.accessToken;
    if (entity.refreshToken !== undefined) updateData.refreshToken = entity.refreshToken;

    const [result] = await db
      .update(userMarketplace)
      .set(updateData)
      .where(eq(userMarketplace.id, id))
      .returning();

    if (!result) return null;

    return new UserMarketplace(
      result.nome,
      result.type,
      result.status ?? true,
      result.id,
      result.createdIn ?? undefined,
      result.accessToken ?? undefined,
      result.refreshToken ?? undefined
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(userMarketplace).where(eq(userMarketplace.id, id)).returning();
    return result.length > 0;
  }
}
