import { IPlayerRepository } from '../ports/IPlayerRepository';
import { IdProvider } from '../../../shared/application/ports/IdProvider';
import { Nickname } from '../../domain/value_objects/Nickname';
import { Player } from '../../domain/entities/Player';

export class GetOrCreatePlayer {
    constructor(
        private readonly playerRepository: IPlayerRepository,
        private readonly idProvider: IdProvider,
    ) {}

    async execute(nicknameValue: string): Promise<Player> {
        const nickname = new Nickname(nicknameValue);
        const player = await this.playerRepository.findByNickname(nickname);

        if (player) {
            return player;
        }

        const id = this.idProvider.generate();
        const newPlayer = Player.create(id, nickname);
        await this.playerRepository.save(newPlayer);
        return newPlayer;
    }
}
