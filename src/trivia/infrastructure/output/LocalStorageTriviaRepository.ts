import { Guess } from "../../domain/value_objects/Guess";
import { GuessResult } from "../../domain/value_objects/GuessResult";
import { SecretNumber } from "../../domain/value_objects/SecretNumber";
import { Trivia } from "../../domain/entities/Trivia";
import { TriviaRepository } from "../../application/ports/TriviaRepository";

interface StoredTrivia {
    id: string;
    secretNumber: string;
    guesses: { guess: string; picas: number; fijas: number }[];
    score: number | null;
    createdAt: string;
    updatedAt: string;
}

export class LocalStorageTriviaRepository implements TriviaRepository {
    private readonly storageKey = "trivias";

    async save(trivia: Trivia): Promise<void> {
        const trivias = this.loadAll();
        trivias.set(trivia.getId(), this.serialize(trivia));
        localStorage.setItem(this.storageKey, JSON.stringify([...trivias.entries()]));
    }

    async findById(id: string): Promise<Trivia | null> {
        const trivias = this.loadAll();
        const stored = trivias.get(id);
        if (!stored) return null;
        return this.deserialize(stored);
    }

    private loadAll(): Map<string, StoredTrivia> {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return new Map();
        return new Map(JSON.parse(raw));
    }

    private serialize(trivia: Trivia): StoredTrivia {
        return {
            id: trivia.getId(),
            secretNumber: trivia.getSecretNumber().getValue(),
            guesses: trivia.getGuesses().map(g => ({
                guess: g.guess.value,
                picas: g.picas,
                fijas: g.fijas,
            })),
            score: trivia.getScore(),
            createdAt: trivia.getCreatedAt().toISOString(),
            updatedAt: trivia.getUpdatedAt().toISOString(),
        };
    }

    private deserialize(stored: StoredTrivia): Trivia {
        const secretNumber = new SecretNumber(stored.secretNumber);
        const guesses = stored.guesses.map(
            g => new GuessResult(new Guess(g.guess), g.picas, g.fijas),
        );
        return new Trivia(stored.id, secretNumber, guesses, new Date(stored.createdAt), new Date(stored.updatedAt), stored.score);
    }
}
