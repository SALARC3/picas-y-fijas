import { SinglePlayerGameRepository } from '../ports/SinglePlayerGameRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';
import { Guess } from '../../../trivia/domain/value_objects/Guess';
import { SinglePlayerGameDTO } from '../dto/SinglePlayerGameDTO';
import { toSinglePlayerGameDTO } from '../mappers/SinglePlayerGameMapper';

export class MakeGuessInGame {
    constructor(
        private readonly gameRepository: SinglePlayerGameRepository,
        private readonly triviaRepository: TriviaRepository,
    ) {}

    async execute(gameId: string, guessValue: string): Promise<SinglePlayerGameDTO> {
        const game = await this.gameRepository.findById(gameId);
        if (!game) {
            throw new Error(`Juego con id: ${gameId} no encontrado.`);
        }

        const guess = new Guess(guessValue);
        game.trivia.makeGuess(guess);
        game.updatedAt = new Date();

        await this.triviaRepository.save(game.trivia);
        await this.gameRepository.save(game);

        return toSinglePlayerGameDTO(game);
    }
}
