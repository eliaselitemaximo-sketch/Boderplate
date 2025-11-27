import { db } from '../../infra/database/connection';
import { authTiktokshop } from '../../infra/database/schema';
import { AuthTikTokShop } from '../../entities/AuthTikTokShop';
import { eq } from 'drizzle-orm';

export class AuthTikTokShopRepository {
  async create(entity: AuthTikTokShop): Promise<AuthTikTokShop> {
    const [result] = await db
      .insert(authTiktokshop)
      .values({
        userMarketplaceId: entity.userMarketplaceId,
        userId: entity.userId,
        scope: entity.scope,
      })
      .onConflictDoUpdate({
        target: authTiktokshop.userMarketplaceId,
        set: {
          userId: entity.userId,
          scope: entity.scope,
          updatedAt: new Date(),
        },
      })
      .returning();

    return new AuthTikTokShop(
      result.userMarketplaceId,
      result.userId ?? undefined,
      result.scope ?? undefined
    );
  }

  async findByUserMarketplaceId(userMarketplaceId: string): Promise<AuthTikTokShop | null> {
    const [result] = await db
      .select()
      .from(authTiktokshop)
      .where(eq(authTiktokshop.userMarketplaceId, userMarketplaceId));

    if (!result) return null;

    return new AuthTikTokShop(
      result.userMarketplaceId,
      result.userId ?? undefined,
      result.scope ?? undefined
    );
  }

  async update(
    userMarketplaceId: string,
    entity: Partial<AuthTikTokShop>
  ): Promise<AuthTikTokShop | null> {
    const updateData: any = {};
    if (entity.userId !== undefined) updateData.userId = entity.userId;
    if (entity.scope !== undefined) updateData.scope = entity.scope;

    const [result] = await db
      .update(authTiktokshop)
      .set(updateData)
      .where(eq(authTiktokshop.userMarketplaceId, userMarketplaceId))
      .returning();

    if (!result) return null;

    return new AuthTikTokShop(
      result.userMarketplaceId,
      result.userId ?? undefined,
      result.scope ?? undefined
    );
  }

  async delete(userMarketplaceId: string): Promise<boolean> {
    const result = await db
      .delete(authTiktokshop)
      .where(eq(authTiktokshop.userMarketplaceId, userMarketplaceId))
      .returning();
    return result.length > 0;
  }
}
