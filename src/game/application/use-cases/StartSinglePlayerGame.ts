import { IdProvider } from '../../../shared/application/ports/IdProvider';
import { SinglePlayerGameRepository } from '../ports/SinglePlayerGameRepository';
import { SinglePlayerGame } from '../../domain/entities/SinglePlayerGame';
import { SinglePlayerGameDTO } from '../dto/SinglePlayerGameDTO';
import { toSinglePlayerGameDTO } from '../mappers/SinglePlayerGameMapper';
import { GetOrCreatePlayer } from '../../../player/application/use-cases/GetOrCreatePlayer';
import { CreateTrivia } from '../../../trivia/application/use-cases/CreateTrivia';

export class StartSinglePlayerGame {
    constructor(
        private readonly gameRepository: SinglePlayerGameRepository,
        private readonly getOrCreatePlayer: GetOrCreatePlayer,
        private readonly createTrivia: CreateTrivia,
        private readonly idProvider: IdProvider,
    ) {}

    async execute(nickname: string): Promise<SinglePlayerGameDTO> {
        const player = await this.getOrCreatePlayer.execute(nickname);
        const trivia = await this.createTrivia.execute();

        const game = SinglePlayerGame.create(this.idProvider.generate(), player, trivia);
        await this.gameRepository.save(game);

        return toSinglePlayerGameDTO(game);
    }
}
