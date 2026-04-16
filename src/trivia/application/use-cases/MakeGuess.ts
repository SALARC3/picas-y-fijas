import { Guess } from "../../domain/value_objects/Guess";
import { GuessResultDTO, TriviaDTO } from "../dto/TriviaDTO";
import { TriviaRepository } from "../ports/TriviaRepository";

export class MakeGuess {
    constructor(private readonly triviaRepository: TriviaRepository) {}

    async execute(triviaId: string, guessValue: string): Promise<TriviaDTO> {
        const trivia = await this.triviaRepository.findById(triviaId);
        if (!trivia) {
            throw new Error(`Trivia con el id: ${triviaId} no encontrada.`);
        }

        const guess = new Guess(guessValue);
        trivia.makeGuess(guess);

        await this.triviaRepository.save(trivia);

        return {
            id: trivia.getId(),
            guesses: trivia.getGuesses().map<GuessResultDTO>(g => ({
                guess: g.guess.value,
                picas: g.picas,
                fijas: g.fijas,
            })),
            finished: trivia.isFinished(),
            createdAt: trivia.getCreatedAt().toISOString(),
            updatedAt: trivia.getUpdatedAt().toISOString(),
        };
    }
}
