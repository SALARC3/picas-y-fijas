import { MultiPlayerGame } from '../../domain/entities/MultiPlayerGame';
import { PlayerSession } from '../../domain/entities/PlayerSession';
import { MultiPlayerGameState } from '../../domain/value_objects/MultiPlayerGameState';
import { MultiPlayerGameRepository } from '../../application/ports/MultiPlayerGameRepository';

interface StoredSession {
    playerId: string;
    triviaId: string;
    joinedAt: string;
}

interface StoredMultiPlayerGame {
    id: string;
    hostPlayerId: string;
    secretNumberValue: string;
    maxPlayers: number;
    state: string;
    winnerId: string | null;
    sessions: StoredSession[];
    createdAt: string;
    updatedAt: string;
}

export class LocalStorageMultiPlayerGameRepository implements MultiPlayerGameRepository {
    private readonly storageKey = 'multiplayerGames';

    async save(game: MultiPlayerGame): Promise<void> {
        const entries = this.loadAll();
        entries.set(game.id, this.serialize(game));
        localStorage.setItem(this.storageKey, JSON.stringify([...entries.entries()]));
    }

    async findById(id: string): Promise<MultiPlayerGame | null> {
        const entries = this.loadAll();
        const stored = entries.get(id);
        if (!stored) return null;
        return this.deserialize(stored);
    }

    async findAll(): Promise<MultiPlayerGame[]> {
        const entries = this.loadAll();
        return Array.from(entries.values()).map(stored => this.deserialize(stored));
    }

    private loadAll(): Map<string, StoredMultiPlayerGame> {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return new Map();
        return new Map(JSON.parse(raw));
    }

    private serialize(game: MultiPlayerGame): StoredMultiPlayerGame {
        return {
            id: game.id,
            hostPlayerId: game.hostPlayerId,
            secretNumberValue: game.getSecretNumberValue(),
            maxPlayers: game.maxPlayers,
            state: game.getState(),
            winnerId: game.getWinnerId(),
            sessions: game.getSessions().map(s => ({
                playerId: s.playerId,
                triviaId: s.triviaId,
                joinedAt: s.joinedAt.toISOString(),
            })),
            createdAt: game.createdAt.toISOString(),
            updatedAt: game.updatedAt.toISOString(),
        };
    }

    private deserialize(stored: StoredMultiPlayerGame): MultiPlayerGame {
        const sessions = stored.sessions.map(s =>
            PlayerSession.create(s.playerId, s.triviaId, new Date(s.joinedAt))
        );
        return MultiPlayerGame.create(
            stored.id, stored.hostPlayerId, stored.secretNumberValue, stored.maxPlayers,
            sessions, stored.state as MultiPlayerGameState, stored.winnerId,
            new Date(stored.createdAt), new Date(stored.updatedAt),
        );
    }
}
