import { UserMarketplace } from '../entities/UserMarketplace';
import { UserMarketplaceRepository } from '../repositories/UserMarketplaceRepository';
import {
  CreateUserMarketplaceDTO,
  UpdateUserMarketplaceDTO,
  UserMarketplaceResponseDTO,
} from '../dtos/UserMarketplaceDTO';


export class UserMarketplaceService {
  private repository: UserMarketplaceRepository;

  constructor() {
    this.repository = new UserMarketplaceRepository();
  }

  async create(dto: CreateUserMarketplaceDTO): Promise<UserMarketplaceResponseDTO> {
    const entity = new UserMarketplace(dto.nome, dto.type);
    const created = await this.repository.create(entity);
    return this.toDTO(created);
  }

  async findAll(): Promise<UserMarketplaceResponseDTO[]> {
    const entities = await this.repository.findAll();
    return entities.map((e) => this.toDTO(e));
  }

  async findById(id: string): Promise<UserMarketplaceResponseDTO | null> {
    const entity = await this.repository.findById(id);
    return entity ? this.toDTO(entity) : null;
  }

  async update(
    id: string,
    dto: UpdateUserMarketplaceDTO
  ): Promise<UserMarketplaceResponseDTO | null> {
    const partial: Partial<UserMarketplace> = {};
    if (dto.nome !== undefined) partial.nome = dto.nome;
    if (dto.type !== undefined) partial.type = dto.type;
    if (dto.status !== undefined) partial.status = dto.status;
    if (dto.accessToken !== undefined) partial.accessToken = dto.accessToken;
    if (dto.refreshToken !== undefined) partial.refreshToken = dto.refreshToken;

    const updated = await this.repository.update(id, partial);
    return updated ? this.toDTO(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    return await this.repository.delete(id);
  }

  private toDTO(entity: UserMarketplace): UserMarketplaceResponseDTO {
    return {
      id: entity.id!,
      nome: entity.nome,
      type: entity.type,
      createdIn: entity.createdIn,
      status: entity.status,
      accessToken: entity.accessToken,
      refreshToken: entity.refreshToken,
    };
  }
}

