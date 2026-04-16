import { IdProvider } from '../../../shared/application/ports/IdProvider';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';
import { SinglePlayerGameRepository } from '../ports/SinglePlayerGameRepository';
import { SinglePlayerGame } from '../../domain/entities/SinglePlayerGame';
import { Nickname } from '../../../player/domain/value_objects/Nickname';
import { Player } from '../../../player/domain/entities/Player';
import { Trivia } from '../../../trivia/domain/entities/Trivia';
import { SecretNumber } from '../../../trivia/domain/value_objects/SecretNumber';
import { SinglePlayerGameDTO } from '../dto/SinglePlayerGameDTO';
import { toSinglePlayerGameDTO } from '../mappers/SinglePlayerGameMapper';

export class StartSinglePlayerGame {
    constructor(
        private readonly gameRepository: SinglePlayerGameRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly triviaRepository: TriviaRepository,
        private readonly idProvider: IdProvider,
    ) {}

    async execute(nickname: string): Promise<SinglePlayerGameDTO> {
        const player = await this.getOrCreatePlayer(nickname);
        const trivia = this.createTrivia();

        await this.triviaRepository.save(trivia);

        const game = SinglePlayerGame.create(this.idProvider.generate(), player, trivia);
        await this.gameRepository.save(game);

        return toSinglePlayerGameDTO(game);
    }

    private async getOrCreatePlayer(nicknameValue: string): Promise<Player> {
        const nickname = new Nickname(nicknameValue);
        const existing = await this.playerRepository.findByNickname(nickname);
        if (existing) return existing;

        const player = Player.create(this.idProvider.generate(), nickname);
        await this.playerRepository.save(player);
        return player;
    }

    private createTrivia(): Trivia {
        return new Trivia(this.idProvider.generate(), SecretNumber.generate());
    }
}
