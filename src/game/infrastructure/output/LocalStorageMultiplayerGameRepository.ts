import { MultiplayerGame } from '../../domain/entities/MultiplayerGame';
import { MultiplayerGameRepository } from '../../application/ports/MultiplayerGameRepository';
import { PlayerTurn } from '../../domain/value_objects/PlayerTurn';
import { GameState } from '../../domain/value_objects/GameState';
import { MultiplayerResult } from '../../domain/value_objects/MultiplayerResult';

interface StoredMultiplayerGame {
    id: string;
    player1Id: string;
    player2Id: string;
    trivia1Id: string;
    trivia2Id: string;
    currentTurn: string;
    state: string;
    result: string | null;
    waitingForEqualizer: boolean;
    createdAt: string;
    updatedAt: string;
}

export class LocalStorageMultiplayerGameRepository implements MultiplayerGameRepository {
    private readonly storageKey = 'multiplayer_games';

    async save(game: MultiplayerGame): Promise<void> {
        const entries = this.loadAll();
        entries.set(game.id, this.serialize(game));
        localStorage.setItem(this.storageKey, JSON.stringify([...entries.entries()]));
    }

    async findById(id: string): Promise<MultiplayerGame | null> {
        const entries = this.loadAll();
        const stored = entries.get(id);
        if (!stored) return null;
        return this.deserialize(stored);
    }

    async findAll(): Promise<MultiplayerGame[]> {
        const entries = this.loadAll();
        return Array.from(entries.values()).map(stored => this.deserialize(stored));
    }

    private loadAll(): Map<string, StoredMultiplayerGame> {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return new Map();
        return new Map(JSON.parse(raw));
    }

    private serialize(game: MultiplayerGame): StoredMultiplayerGame {
        return {
            id: game.id,
            player1Id: game.player1Id,
            player2Id: game.player2Id,
            trivia1Id: game.trivia1Id,
            trivia2Id: game.trivia2Id,
            currentTurn: game.currentTurn,
            state: game.state,
            result: game.result,
            waitingForEqualizer: game.waitingForEqualizer,
            createdAt: game.createdAt.toISOString(),
            updatedAt: game.updatedAt.toISOString(),
        };
    }

    private deserialize(stored: StoredMultiplayerGame): MultiplayerGame {
        return MultiplayerGame.restore(
            stored.id,
            stored.player1Id,
            stored.player2Id,
            stored.trivia1Id,
            stored.trivia2Id,
            stored.currentTurn as PlayerTurn,
            stored.state as GameState,
            stored.result as MultiplayerResult | null,
            stored.waitingForEqualizer,
            new Date(stored.createdAt),
            new Date(stored.updatedAt),
        );
    }
}
