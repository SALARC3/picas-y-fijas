import { Trivia } from "../../domain/entities/Trivia";
import { Guess } from "../../domain/value_objects/Guess";
import { TriviaRepository } from "../ports/TriviaRepository";

export class MakeGuess {
    constructor(private readonly triviaRepository: TriviaRepository) {}

    async execute(triviaId: string, guessValue: string): Promise<Trivia> {
        const trivia = await this.triviaRepository.findById(triviaId);
        if (!trivia) {
            throw new Error(`Trivia con el id: ${triviaId} no encontrada.`);
        }

        const guess = new Guess(guessValue);
        trivia.makeGuess(guess);

        await this.triviaRepository.save(trivia);

        return trivia;
    }
}
