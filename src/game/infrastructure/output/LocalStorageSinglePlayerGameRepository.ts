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

    private loadAll(): Map<string, StoredGame> {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return new Map();
        return new Map(JSON.parse(raw));
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
