import { MultiPlayerGameRepository } from '../ports/MultiPlayerGameRepository';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';
import { MakeGuess } from '../../../trivia/application/use-cases/MakeGuess';
import { MultiPlayerGameDTO } from '../dto/MultiPlayerGameDTO';
import { toMultiPlayerGameDTO } from '../mappers/MultiPlayerGameMapper';

/**
 * Caso de uso: Realizar un intento en una partida multijugador.
 * Solo el jugador del turno actual puede jugar.
 */
export class MakeGuessInMultiPlayerGame {
    constructor(
        private readonly gameRepository: MultiPlayerGameRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly triviaRepository: TriviaRepository,
        private readonly makeGuess: MakeGuess,
    ) {}

    async execute(gameId: string, guessValue: string): Promise<MultiPlayerGameDTO> {
        const game = await this.gameRepository.findById(gameId);
        if (!game) {
            throw new Error(`Partida multijugador con id: ${gameId} no encontrada.`);
        }

        if (game.isFinished()) {
            throw new Error('La partida ya terminó.');
        }

        // Hacer el intento en la trivia del jugador actual
        const currentTriviaId = game.getCurrentTriviaId();
        const trivia = await this.makeGuess.execute(currentTriviaId, guessValue);

        // Si adivinó, marcar ganador
        if (trivia.isFinished()) {
            game.setWinner(game.getCurrentTurnPlayerId());
        } else {
            game.switchTurn();
        }

        await this.gameRepository.save(game);

        // Cargar datos completos para el DTO
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
