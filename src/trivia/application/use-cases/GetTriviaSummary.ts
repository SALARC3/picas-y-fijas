import { GuessResultDTO, TriviaDTO } from "../dto/TriviaDTO";
import { TriviaRepository } from "../ports/TriviaRepository";

export class GetTriviaSummary {
    constructor(private readonly triviaRepository: TriviaRepository) {}

    async execute(triviaId: string): Promise<TriviaDTO> {
        const trivia = await this.triviaRepository.findById(triviaId);
        if (!trivia) {
            throw new Error(`Trivia con el id: ${triviaId} no encontrada.`);
        }

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
