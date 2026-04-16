import fs from 'fs';
import path from 'path';
import { SinglePlayerGame } from '../../domain/entities/SinglePlayerGame';
import { SinglePlayerGameRepository } from '../../application/ports/SinglePlayerGameRepository';
import { Player } from '../../../player/domain/entities/Player';
import { Nickname } from '../../../player/domain/value_objects/Nickname';
import { Trivia } from '../../../trivia/domain/entities/Trivia';
import { SecretNumber } from '../../../trivia/domain/value_objects/SecretNumber';
import { Guess } from '../../../trivia/domain/value_objects/Guess';
import { GuessResult } from '../../../trivia/domain/value_objects/GuessResult';

interface StoredGame {
    id: string;
    playerId: string;
    playerNickname: string;
    triviaId: string;
    secretNumber: string;
    guesses: { guess: string; picas: number; fijas: number }[];
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

    private getFilePath(id: string): string {
        return path.join(this.folderPath, `${id}.json`);
    }

    private serialize(game: SinglePlayerGame): StoredGame {
        return {
            id: game.id,
            playerId: game.player.id,
            playerNickname: game.player.nickname.value,
            triviaId: game.trivia.getId(),
            secretNumber: game.trivia.getSecretNumber().getValue(),
            guesses: game.trivia.getGuesses().map(g => ({
                guess: g.guess.value,
                picas: g.picas,
                fijas: g.fijas,
            })),
            createdAt: game.createdAt.toISOString(),
            updatedAt: game.updatedAt.toISOString(),
        };
    }

    private deserialize(stored: StoredGame): SinglePlayerGame {
        const player = Player.create(stored.playerId, new Nickname(stored.playerNickname));
        const guesses = stored.guesses.map(
            g => new GuessResult(new Guess(g.guess), g.picas, g.fijas),
        );
        const trivia = new Trivia(stored.triviaId, new SecretNumber(stored.secretNumber), guesses);
        return SinglePlayerGame.create(stored.id, player, trivia, new Date(stored.createdAt), new Date(stored.updatedAt));
    }
}
