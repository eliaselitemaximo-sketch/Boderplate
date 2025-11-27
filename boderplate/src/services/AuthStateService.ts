import crypto from 'crypto';

interface StateEntry {
  userMarketplaceId: string;
  createdAt: number;
  code?: string;
}

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutos

export class AuthStateService {
  private readonly stateStore = new Map<string, StateEntry>();

  constructor(private readonly namespace: string, private readonly ttlMs: number = DEFAULT_TTL_MS) {}

  generateState(userMarketplaceId: string): string {
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const state = `${this.namespace}-${Date.now()}-${randomSuffix}`;

    this.stateStore.set(state, {
      userMarketplaceId,
      createdAt: Date.now(),
    });

    return state;
  }

  consumeState(state: string, code?: string): string {
    this.evictExpiredStates();

    const entry = this.stateStore.get(state);
    if (!entry) {
      throw new Error('Estado de autorização inválido ou expirado');
    }

    this.stateStore.delete(state);

    if (code) {
      entry.code = code;
    }

    return entry.userMarketplaceId;
  }

  private evictExpiredStates() {
    const now = Date.now();
    for (const [state, entry] of this.stateStore.entries()) {
      if (now - entry.createdAt > this.ttlMs) {
        this.stateStore.delete(state);
      }
    }
  }
}

