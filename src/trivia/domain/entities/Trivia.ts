import { Guess } from "../value_objects/Guess";
import { GuessResult } from "../value_objects/GuessResult";
import { SecretNumber } from "../value_objects/SecretNumber";


export class Trivia {
    private readonly id: string;
    private readonly secretNumber: SecretNumber;
    private readonly guesses: GuessResult[];
    private readonly createdAt: Date;
    private updatedAt: Date;

    constructor(id: string, secretNumber: SecretNumber, guesses: GuessResult[] = [], createdAt?: Date, updatedAt?: Date) {
        this.id = id;
        this.secretNumber = secretNumber;
        this.guesses = guesses;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
    }

    public makeGuess(guess: Guess): GuessResult {
        if (this.isFinished()) {
            throw new Error('Ya se ha adivinado el número secreto.');
        }
        const result = this.secretNumber.checkGuess(guess);
        this.guesses.push(result);
        this.updatedAt = new Date();
        return result;
    }

    public getId(): string {
        return this.id;
    }

    public getSecretNumber(): SecretNumber {
        return this.secretNumber;
    }

    public getGuesses(): GuessResult[] {
        return [...this.guesses];
    }

    public getCreatedAt(): Date {
        return this.createdAt;
    }

    public getUpdatedAt(): Date {
        return this.updatedAt;
    }

    public isFinished(): boolean {
        return this.guesses.some(g =>
            g.isSecretGuessed()
        );
    }
}
