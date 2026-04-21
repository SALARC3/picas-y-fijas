import fs from 'fs';
import path from 'path';
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

export class FileSystemMultiPlayerGameRepository implements MultiPlayerGameRepository {
    constructor(private readonly folderPath: string) {
        if (!fs.existsSync(this.folderPath)) {
            fs.mkdirSync(this.folderPath, { recursive: true });
        }
    }

    async save(game: MultiPlayerGame): Promise<void> {
        const filePath = this.getFilePath(game.id);
        const data = this.serialize(game);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    async findById(id: string): Promise<MultiPlayerGame | null> {
        const filePath = this.getFilePath(id);
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf-8');
        return this.deserialize(JSON.parse(raw));
    }

    async findAll(): Promise<MultiPlayerGame[]> {
        const files = fs.readdirSync(this.folderPath).filter(f => f.endsWith('.json'));
        return files.map(file => {
            const raw = fs.readFileSync(path.join(this.folderPath, file), 'utf-8');
            return this.deserialize(JSON.parse(raw));
        });
    }

    private getFilePath(id: string): string {
        return path.join(this.folderPath, `${id}.json`);
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
            stored.id,
            stored.hostPlayerId,
            stored.secretNumberValue,
            stored.maxPlayers,
            sessions,
            stored.state as MultiPlayerGameState,
            stored.winnerId,
            new Date(stored.createdAt),
            new Date(stored.updatedAt),
        );
    }
}
