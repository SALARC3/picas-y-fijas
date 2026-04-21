import { MultiPlayerGameRepository } from '../ports/MultiPlayerGameRepository';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';
import { MakeGuess } from '../../../trivia/application/use-cases/MakeGuess';
import { MultiPlayerGameDTO } from '../dto/MultiPlayerGameDTO';
import { toMultiPlayerGameDTO } from '../mappers/MultiPlayerGameMapper';
import { MultiPlayerGameState } from '../../domain/value_objects/MultiPlayerGameState';
import { Player } from '../../../player/domain/entities/Player';
import { Trivia } from '../../../trivia/domain/entities/Trivia';

export class MakeGuessInMultiPlayerGame {
    constructor(
        private readonly gameRepository: MultiPlayerGameRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly triviaRepository: TriviaRepository,
        private readonly makeGuess: MakeGuess,
    ) {}

    async execute(gameId: string, playerId: string, guessValue: string): Promise<MultiPlayerGameDTO> {
        const game = await this.gameRepository.findById(gameId);
        if (!game) {
            throw new Error(`Partida multijugador con id: ${gameId} no encontrada.`);
        }

        if (game.getState() !== MultiPlayerGameState.PLAYING) {
            throw new Error('La partida no está en curso.');
        }

        const session = game.getSessionByPlayerId(playerId);
        if (!session) {
            throw new Error('El jugador no está en esta partida.');
        }

        const trivia = await this.makeGuess.execute(session.triviaId, guessValue);

        // Si el jugador adivinó, la partida termina
        if (trivia.isFinished()) {
            game.finish(playerId);
            await this.gameRepository.save(game);
        }

        // Cargar datos completos para el DTO
        const players = new Map<string, Player>();
        const trivias = new Map<string, Trivia>();

        for (const s of game.getSessions()) {
            const player = await this.playerRepository.findById(s.playerId);
            if (player) players.set(player.id, player);
            if (s.triviaId === session.triviaId) {
                trivias.set(trivia.getId(), trivia);
            } else {
                const t = await this.triviaRepository.findById(s.triviaId);
                if (t) trivias.set(t.getId(), t);
            }
        }

        return toMultiPlayerGameDTO(game, players, trivias);
    }
}
