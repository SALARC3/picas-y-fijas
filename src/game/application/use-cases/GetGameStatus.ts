import { SinglePlayerGameRepository } from '../ports/SinglePlayerGameRepository';
import { SinglePlayerGameDTO } from '../dto/SinglePlayerGameDTO';
import { toSinglePlayerGameDTO } from '../mappers/SinglePlayerGameMapper';

export class GetGameStatus {
    constructor(
        private readonly gameRepository: SinglePlayerGameRepository,
    ) {}

    async execute(gameId: string): Promise<SinglePlayerGameDTO> {
        const game = await this.gameRepository.findById(gameId);
        if (!game) {
            throw new Error(`Juego con id: ${gameId} no encontrado.`);
        }

        return toSinglePlayerGameDTO(game);
    }
}
