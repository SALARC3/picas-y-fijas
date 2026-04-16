import { SinglePlayerGameRepository } from '../ports/SinglePlayerGameRepository';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';
import { SinglePlayerGameDTO } from '../dto/SinglePlayerGameDTO';
import { toSinglePlayerGameDTO } from '../mappers/SinglePlayerGameMapper';

export class GetGameStatus {
    constructor(
        private readonly gameRepository: SinglePlayerGameRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly triviaRepository: TriviaRepository,
    ) {}

    async execute(gameId: string): Promise<SinglePlayerGameDTO> {
        const game = await this.gameRepository.findById(gameId);
        if (!game) {
            throw new Error(`Juego con id: ${gameId} no encontrado.`);
        }

        const player = await this.playerRepository.findById(game.playerId);
        if (!player) {
            throw new Error(`Jugador con id: ${game.playerId} no encontrado.`);
        }

        const trivia = await this.triviaRepository.findById(game.triviaId);
        if (!trivia) {
            throw new Error(`Trivia con id: ${game.triviaId} no encontrada.`);
        }

        return toSinglePlayerGameDTO(game, player, trivia);
    }
}
