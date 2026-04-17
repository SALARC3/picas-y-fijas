import fs from 'fs';
import path from 'path';
import { MultiPlayerGame } from '../../domain/entities/MultiPlayerGame';
import { MultiPlayerGameRepository } from '../../application/ports/MultiPlayerGameRepository';

interface StoredMultiPlayerGame {
    id: string;
    player1Id: string;
    player2Id: string;
    trivia1Id: string;
    trivia2Id: string;
    currentTurnPlayerId: string;
    winnerId: string | null;
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
            player1Id: game.player1Id,
            player2Id: game.player2Id,
            trivia1Id: game.trivia1Id,
            trivia2Id: game.trivia2Id,
            currentTurnPlayerId: game.getCurrentTurnPlayerId(),
            winnerId: game.getWinnerId(),
            createdAt: game.createdAt.toISOString(),
            updatedAt: game.updatedAt.toISOString(),
        };
    }

    private deserialize(stored: StoredMultiPlayerGame): MultiPlayerGame {
        return MultiPlayerGame.create(
            stored.id,
            stored.player1Id,
            stored.player2Id,
            stored.trivia1Id,
            stored.trivia2Id,
            stored.currentTurnPlayerId,
            stored.winnerId,
            new Date(stored.createdAt),
            new Date(stored.updatedAt),
        );
    }
}
