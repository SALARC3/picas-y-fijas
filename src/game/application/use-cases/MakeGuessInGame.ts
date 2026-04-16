import { SinglePlayerGameRepository } from '../ports/SinglePlayerGameRepository';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { MakeGuess } from '../../../trivia/application/use-cases/MakeGuess';
import { SinglePlayerGameDTO } from '../dto/SinglePlayerGameDTO';
import { toSinglePlayerGameDTO } from '../mappers/SinglePlayerGameMapper';

export class MakeGuessInGame {
    constructor(
        private readonly gameRepository: SinglePlayerGameRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly makeGuess: MakeGuess,
    ) {}

    async execute(gameId: string, guessValue: string): Promise<SinglePlayerGameDTO> {
        const game = await this.gameRepository.findById(gameId);
        if (!game) {
            throw new Error(`Juego con id: ${gameId} no encontrado.`);
        }

        const player = await this.playerRepository.findById(game.playerId);
        if (!player) {
            throw new Error(`Jugador con id: ${game.playerId} no encontrado.`);
        }

        const trivia = await this.makeGuess.execute(game.triviaId, guessValue);
        game.updatedAt = new Date();

        await this.gameRepository.save(game);

        return toSinglePlayerGameDTO(game, player, trivia);
    }
}
