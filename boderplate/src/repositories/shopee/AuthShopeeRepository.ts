import { db } from '../../infra/database/connection';
import { authShopee } from '../../infra/database/schema';
import { AuthShopee } from '../../entities/AuthShopee';
import { eq } from 'drizzle-orm';

export class AuthShopeeRepository {
  async create(entity: AuthShopee): Promise<AuthShopee> {
    const [result] = await db
      .insert(authShopee)
      .values({
        userMarketplaceId: entity.userMarketplaceId,
        shopId: entity.shopId,
        mainAccountId: entity.mainAccountId,
        merchantIdList: entity.merchantIdList,
        shpIdList: entity.shpIdList,
      })
      .onConflictDoUpdate({
        target: authShopee.userMarketplaceId,
        set: {
          shopId: entity.shopId,
          mainAccountId: entity.mainAccountId,
          merchantIdList: entity.merchantIdList,
          shpIdList: entity.shpIdList,
          updatedAt: new Date(),
        },
      })
      .returning();

    return new AuthShopee(
      result.userMarketplaceId,
      result.shopId ?? undefined,
      result.mainAccountId ?? undefined,
      result.merchantIdList ?? undefined,
      result.shpIdList ?? undefined
    );
  }

  async findByUserMarketplaceId(userMarketplaceId: string): Promise<AuthShopee | null> {
    const [result] = await db
      .select()
      .from(authShopee)
      .where(eq(authShopee.userMarketplaceId, userMarketplaceId));

    if (!result) return null;

    return new AuthShopee(
      result.userMarketplaceId,
      result.shopId ?? undefined,
      result.mainAccountId ?? undefined,
      result.merchantIdList ?? undefined,
      result.shpIdList ?? undefined
    );
  }

  async update(
    userMarketplaceId: string,
    entity: Partial<AuthShopee>
  ): Promise<AuthShopee | null> {
    const updateData: any = {};
    if (entity.shopId !== undefined) updateData.shopId = entity.shopId;
    if (entity.mainAccountId !== undefined) updateData.mainAccountId = entity.mainAccountId;
    if (entity.merchantIdList !== undefined) updateData.merchantIdList = entity.merchantIdList;
    if (entity.shpIdList !== undefined) updateData.shpIdList = entity.shpIdList;

    const [result] = await db
      .update(authShopee)
      .set(updateData)
      .where(eq(authShopee.userMarketplaceId, userMarketplaceId))
      .returning();

    if (!result) return null;

    return new AuthShopee(
      result.userMarketplaceId,
      result.shopId ?? undefined,
      result.mainAccountId ?? undefined,
      result.merchantIdList ?? undefined,
      result.shpIdList ?? undefined
    );
  }

  async delete(userMarketplaceId: string): Promise<boolean> {
    const result = await db
      .delete(authShopee)
      .where(eq(authShopee.userMarketplaceId, userMarketplaceId))
      .returning();
    return result.length > 0;
  }
}
