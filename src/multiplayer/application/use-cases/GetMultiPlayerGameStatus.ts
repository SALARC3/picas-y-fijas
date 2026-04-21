import { MultiPlayerGameRepository } from '../ports/MultiPlayerGameRepository';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';
import { MultiPlayerGameDTO } from '../dto/MultiPlayerGameDTO';
import { toMultiPlayerGameDTO } from '../mappers/MultiPlayerGameMapper';
import { Player } from '../../../player/domain/entities/Player';
import { Trivia } from '../../../trivia/domain/entities/Trivia';

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

        const players = new Map<string, Player>();
        const trivias = new Map<string, Trivia>();

        for (const session of game.getSessions()) {
            const player = await this.playerRepository.findById(session.playerId);
            if (player) players.set(player.id, player);
            const trivia = await this.triviaRepository.findById(session.triviaId);
            if (trivia) trivias.set(trivia.getId(), trivia);
        }

        return toMultiPlayerGameDTO(game, players, trivias);
    }
}
