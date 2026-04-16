import fs from "fs";
import path from "path";
import { Guess } from "../../domain/value_objects/Guess";
import { GuessResult } from "../../domain/value_objects/GuessResult";
import { SecretNumber } from "../../domain/value_objects/SecretNumber";
import { Trivia } from "../../domain/entities/Trivia";
import { TriviaRepository } from "../../application/ports/TriviaRepository";

interface StoredTrivia {
    id: string;
    secretNumber: string;
    guesses: { guess: string; picas: number; fijas: number }[];
    createdAt: string;
    updatedAt: string;
}

export class FileSystemTriviaRepository implements TriviaRepository {
    constructor(private readonly folderPath: string) {
        if (!fs.existsSync(this.folderPath)) {
            fs.mkdirSync(this.folderPath, { recursive: true });
        }
    }

    async save(trivia: Trivia): Promise<void> {
        const filePath = this.getFilePath(trivia.getId());
        const data = this.serialize(trivia);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    }

    async findById(id: string): Promise<Trivia | null> {
        const filePath = this.getFilePath(id);
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, "utf-8");
        const stored: StoredTrivia = JSON.parse(raw);
        return this.deserialize(stored);
    }

    private getFilePath(id: string): string {
        return path.join(this.folderPath, `${id}.json`);
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
            createdAt: trivia.getCreatedAt().toISOString(),
            updatedAt: trivia.getUpdatedAt().toISOString(),
        };
    }

    private deserialize(stored: StoredTrivia): Trivia {
        const secretNumber = new SecretNumber(stored.secretNumber);
        const guesses = stored.guesses.map(
            g => new GuessResult(new Guess(g.guess), g.picas, g.fijas),
        );
        return new Trivia(stored.id, secretNumber, guesses, new Date(stored.createdAt), new Date(stored.updatedAt));
    }
}
