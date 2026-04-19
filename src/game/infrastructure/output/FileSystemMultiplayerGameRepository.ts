import fs from 'fs';
import path from 'path';
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

export class FileSystemMultiplayerGameRepository implements MultiplayerGameRepository {
    constructor(private readonly folderPath: string) {
        if (!fs.existsSync(this.folderPath)) {
            fs.mkdirSync(this.folderPath, { recursive: true });
        }
    }

    async save(game: MultiplayerGame): Promise<void> {
        const filePath = this.getFilePath(game.id);
        const data = this.serialize(game);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    async findById(id: string): Promise<MultiplayerGame | null> {
        const filePath = this.getFilePath(id);
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf-8');
        return this.deserialize(JSON.parse(raw));
    }

    async findAll(): Promise<MultiplayerGame[]> {
        const files = fs.readdirSync(this.folderPath).filter(f => f.endsWith('.json'));
        return files.map(file => {
            const raw = fs.readFileSync(path.join(this.folderPath, file), 'utf-8');
            return this.deserialize(JSON.parse(raw));
        });
    }

    private getFilePath(id: string): string {
        return path.join(this.folderPath, `${id}.json`);
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
