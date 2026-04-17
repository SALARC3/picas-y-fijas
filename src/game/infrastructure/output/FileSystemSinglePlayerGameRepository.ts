import fs from 'fs';
import path from 'path';
import { SinglePlayerGame } from '../../domain/entities/SinglePlayerGame';
import { SinglePlayerGameRepository } from '../../application/ports/SinglePlayerGameRepository';

interface StoredGame {
    id: string;
    playerId: string;
    triviaId: string;
    createdAt: string;
    updatedAt: string;
}

export class FileSystemSinglePlayerGameRepository implements SinglePlayerGameRepository {
    constructor(private readonly folderPath: string) {
        if (!fs.existsSync(this.folderPath)) {
            fs.mkdirSync(this.folderPath, { recursive: true });
        }
    }

    async save(game: SinglePlayerGame): Promise<void> {
        const filePath = this.getFilePath(game.id);
        const data = this.serialize(game);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    async findById(id: string): Promise<SinglePlayerGame | null> {
        const filePath = this.getFilePath(id);
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf-8');
        return this.deserialize(JSON.parse(raw));
    }

    async findAll(): Promise<SinglePlayerGame[]> {
        const files = fs.readdirSync(this.folderPath).filter(f => f.endsWith('.json'));
        return files.map(file => {
            const raw = fs.readFileSync(path.join(this.folderPath, file), 'utf-8');
            return this.deserialize(JSON.parse(raw));
        });
    }

    private getFilePath(id: string): string {
        return path.join(this.folderPath, `${id}.json`);
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
