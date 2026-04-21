import { IdProvider } from '../../../shared/application/ports/IdProvider';
import { GetOrCreatePlayer } from '../../../player/application/use-cases/GetOrCreatePlayer';
import { CreateTrivia } from '../../../trivia/application/use-cases/CreateTrivia';
import { SecretNumber } from '../../../trivia/domain/value_objects/SecretNumber';
import { PlayerSession } from '../../domain/entities/PlayerSession';
import { MultiPlayerGameRepository } from '../ports/MultiPlayerGameRepository';
import { MultiPlayerGameDTO } from '../dto/MultiPlayerGameDTO';
import { toMultiPlayerGameDTO } from '../mappers/MultiPlayerGameMapper';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';

export class JoinMultiPlayerGame {
    constructor(
        private readonly gameRepository: MultiPlayerGameRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly triviaRepository: TriviaRepository,
        private readonly getOrCreatePlayer: GetOrCreatePlayer,
        private readonly createTrivia: CreateTrivia,
        private readonly idProvider: IdProvider,
    ) {}

    async execute(gameId: string, nickname: string): Promise<MultiPlayerGameDTO> {
        const game = await this.gameRepository.findById(gameId);
        if (!game) {
            throw new Error(`Partida multijugador con id: ${gameId} no encontrada.`);
        }

        const player = await this.getOrCreatePlayer.execute(nickname);

        // Crear trivia con el mismo número secreto de la partida
        const secretNumber = new SecretNumber(game.getSecretNumberValue());
        const trivia = await this.createTrivia.execute(secretNumber);

        const session = PlayerSession.create(player.id, trivia.getId());
        game.addPlayer(session);

        await this.gameRepository.save(game);

        // Cargar datos de todos los jugadores y trivias para el DTO
        const { players, trivias } = await this.loadGameData(game);
        return toMultiPlayerGameDTO(game, players, trivias);
    }

    private async loadGameData(game: import('../../domain/entities/MultiPlayerGame').MultiPlayerGame) {
        const players = new Map<string, import('../../../player/domain/entities/Player').Player>();
        const trivias = new Map<string, import('../../../trivia/domain/entities/Trivia').Trivia>();

        for (const session of game.getSessions()) {
            const player = await this.playerRepository.findById(session.playerId);
            if (player) players.set(player.id, player);
            const trivia = await this.triviaRepository.findById(session.triviaId);
            if (trivia) trivias.set(trivia.getId(), trivia);
        }

        return { players, trivias };
    }
}
