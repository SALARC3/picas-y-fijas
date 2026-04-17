import { MultiPlayerGameRepository } from '../ports/MultiPlayerGameRepository';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';
import { MultiPlayerGameDTO } from '../dto/MultiPlayerGameDTO';
import { toMultiPlayerGameDTO } from '../mappers/MultiPlayerGameMapper';

/**
 * Caso de uso: Consultar el estado de una partida multijugador.
 */
export class GetMultiPlayerGameStatus {
    constructor(
        private readonly gameRepository: MultiPlayerGameRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly triviaRepository: TriviaRepository,
    ) {}

    async execute(gameId: string): Promise<MultiPlayerGameDTO> {
        const game = await this.gameRepository.findById(gameId);
        if (!game) {
            throw new Error(`Partida multijugador con id: ${gameId} no encontrada.`);
        }

        const player1 = await this.playerRepository.findById(game.player1Id);
        const player2 = await this.playerRepository.findById(game.player2Id);
        const trivia1 = await this.triviaRepository.findById(game.trivia1Id);
        const trivia2 = await this.triviaRepository.findById(game.trivia2Id);

        if (!player1 || !player2 || !trivia1 || !trivia2) {
            throw new Error('Error al cargar datos de la partida.');
        }

        return toMultiPlayerGameDTO(game, player1, player2, trivia1, trivia2);
    }
}
