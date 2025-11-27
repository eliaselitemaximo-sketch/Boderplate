import { db } from '../../infra/database/connection';
import { authMercadolivre } from '../../infra/database/schema';
import { AuthMercadoLivre } from '../../entities/AuthMercadoLivre';
import { eq } from 'drizzle-orm';

export class AuthMercadoLivreRepository {
  async create(entity: AuthMercadoLivre): Promise<AuthMercadoLivre> {
    const [result] = await db
      .insert(authMercadolivre)
      .values({
        userMarketplaceId: entity.userMarketplaceId,
        userId: entity.userId,
        scope: entity.scope,
      })
      .onConflictDoUpdate({
        target: authMercadolivre.userMarketplaceId,
        set: {
          userId: entity.userId,
          scope: entity.scope,
          updatedAt: new Date(),
        },
      })
      .returning();

    return new AuthMercadoLivre(
      result.userMarketplaceId,
      result.userId ?? undefined,
      result.scope ?? undefined
    );
  }

  async findByUserMarketplaceId(userMarketplaceId: string): Promise<AuthMercadoLivre | null> {
    const [result] = await db
      .select()
      .from(authMercadolivre)
      .where(eq(authMercadolivre.userMarketplaceId, userMarketplaceId));

    if (!result) return null;

    return new AuthMercadoLivre(
      result.userMarketplaceId,
      result.userId ?? undefined,
      result.scope ?? undefined
    );
  }

  async update(
    userMarketplaceId: string,
    entity: Partial<AuthMercadoLivre>
  ): Promise<AuthMercadoLivre | null> {
    const updateData: any = {};
    if (entity.userId !== undefined) updateData.userId = entity.userId;
    if (entity.scope !== undefined) updateData.scope = entity.scope;

    const [result] = await db
      .update(authMercadolivre)
      .set(updateData)
      .where(eq(authMercadolivre.userMarketplaceId, userMarketplaceId))
      .returning();

    if (!result) return null;

    return new AuthMercadoLivre(
      result.userMarketplaceId,
      result.userId ?? undefined,
      result.scope ?? undefined
    );
  }

  async delete(userMarketplaceId: string): Promise<boolean> {
    const result = await db
      .delete(authMercadolivre)
      .where(eq(authMercadolivre.userMarketplaceId, userMarketplaceId))
      .returning();
    return result.length > 0;
  }
}
