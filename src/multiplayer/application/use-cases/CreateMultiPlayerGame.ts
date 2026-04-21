import { IdProvider } from '../../../shared/application/ports/IdProvider';
import { GetOrCreatePlayer } from '../../../player/application/use-cases/GetOrCreatePlayer';
import { CreateTrivia } from '../../../trivia/application/use-cases/CreateTrivia';
import { SecretNumber } from '../../../trivia/domain/value_objects/SecretNumber';
import { MultiPlayerGame } from '../../domain/entities/MultiPlayerGame';
import { PlayerSession } from '../../domain/entities/PlayerSession';
import { MultiPlayerGameRepository } from '../ports/MultiPlayerGameRepository';
import { MultiPlayerGameDTO } from '../dto/MultiPlayerGameDTO';
import { toMultiPlayerGameDTO } from '../mappers/MultiPlayerGameMapper';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';

export class CreateMultiPlayerGame {
    constructor(
        private readonly gameRepository: MultiPlayerGameRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly triviaRepository: TriviaRepository,
        private readonly getOrCreatePlayer: GetOrCreatePlayer,
        private readonly createTrivia: CreateTrivia,
        private readonly idProvider: IdProvider,
    ) {}

    async execute(nickname: string, maxPlayers: number): Promise<MultiPlayerGameDTO> {
        const player = await this.getOrCreatePlayer.execute(nickname);
        const secretNumber = SecretNumber.generate();

        // El host obtiene su propia trivia con el secreto compartido
        const trivia = await this.createTrivia.execute(secretNumber);
        const session = PlayerSession.create(player.id, trivia.getId());

        const game = MultiPlayerGame.create(
            this.idProvider.generate(),
            player.id,
            secretNumber.getValue(),
            maxPlayers,
            [session],
        );

        await this.gameRepository.save(game);

        const players = new Map([[player.id, player]]);
        const trivias = new Map([[trivia.getId(), trivia]]);

        return toMultiPlayerGameDTO(game, players, trivias);
    }
}
