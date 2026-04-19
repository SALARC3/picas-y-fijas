import { IdProvider } from '../../../shared/application/ports/IdProvider';
import { MultiplayerGameRepository } from '../ports/MultiplayerGameRepository';
import { MultiplayerGame } from '../../domain/entities/MultiplayerGame';
import { MultiplayerGameDTO } from '../dto/MultiplayerGameDTO';
import { toMultiplayerGameDTO } from '../mappers/MultiplayerGameMapper';
import { GetOrCreatePlayer } from '../../../player/application/use-cases/GetOrCreatePlayer';
import { CreateTrivia } from '../../../trivia/application/use-cases/CreateTrivia';

export class StartMultiplayerGame {
    constructor(
        private readonly gameRepository: MultiplayerGameRepository,
        private readonly getOrCreatePlayer: GetOrCreatePlayer,
        private readonly createTrivia: CreateTrivia,
        private readonly idProvider: IdProvider,
    ) {}

    async execute(nickname1: string, nickname2: string): Promise<MultiplayerGameDTO> {
        if (nickname1 === nickname2) {
            throw new Error('Los jugadores deben tener nicknames distintos.');
        }

        const [player1, player2] = await Promise.all([
            this.getOrCreatePlayer.execute(nickname1),
            this.getOrCreatePlayer.execute(nickname2),
        ]);

        const [trivia1, trivia2] = await Promise.all([
            this.createTrivia.execute(),
            this.createTrivia.execute(),
        ]);

        const game = MultiplayerGame.create(
            this.idProvider.generate(),
            player1.id,
            player2.id,
            trivia1.getId(),
            trivia2.getId(),
        );

        await this.gameRepository.save(game);

        return toMultiplayerGameDTO(game, player1, player2, trivia1, trivia2);
    }
}
