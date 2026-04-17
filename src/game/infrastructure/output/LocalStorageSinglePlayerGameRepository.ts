import { SinglePlayerGame } from '../../domain/entities/SinglePlayerGame';
import { SinglePlayerGameRepository } from '../../application/ports/SinglePlayerGameRepository';

interface StoredGame {
    id: string;
    playerId: string;
    triviaId: string;
    createdAt: string;
    updatedAt: string;
}

export class LocalStorageSinglePlayerGameRepository implements SinglePlayerGameRepository {
    private readonly storageKey = 'games';

    async save(game: SinglePlayerGame): Promise<void> {
        const entries = this.loadAll();
        entries.set(game.id, this.serialize(game));
        localStorage.setItem(this.storageKey, JSON.stringify([...entries.entries()]));
    }

    async findById(id: string): Promise<SinglePlayerGame | null> {
        const entries = this.loadAll();
        const stored = entries.get(id);
        if (!stored) return null;
        return this.deserialize(stored);
    }

    async findAll(): Promise<SinglePlayerGame[]> {
        const entries = this.loadAll();
        return Array.from(entries.values()).map(stored => this.deserialize(stored));
    }

    private loadAll(): Map<string, StoredGame> {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return new Map();
        return new Map(JSON.parse(raw));
    }

    private serialize(game: SinglePlayerGame): StoredGame {
        return {
            id: game.id,
            playerId: game.playerId,
            triviaId: game.triviaId,
            createdAt: game.createdAt.toISOString(),
            updatedAt: game.updatedAt.toISOString(),
        };
    }

    private deserialize(stored: StoredGame): SinglePlayerGame {
        return SinglePlayerGame.create(stored.id, stored.playerId, stored.triviaId, new Date(stored.createdAt), new Date(stored.updatedAt));
    }
}
