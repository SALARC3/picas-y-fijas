import { IdProvider } from '../../../shared/application/ports/IdProvider';
import { MultiPlayerGameRepository } from '../ports/MultiPlayerGameRepository';
import { MultiPlayerGame } from '../../domain/entities/MultiPlayerGame';
import { MultiPlayerGameDTO } from '../dto/MultiPlayerGameDTO';
import { toMultiPlayerGameDTO } from '../mappers/MultiPlayerGameMapper';
import { GetOrCreatePlayer } from '../../../player/application/use-cases/GetOrCreatePlayer';
import { CreateTrivia } from '../../../trivia/application/use-cases/CreateTrivia';
import { SecretNumber } from '../../../trivia/domain/value_objects/SecretNumber';

/**
 * Caso de uso: Iniciar una partida multijugador.
 * Crea 2 trivias con el MISMO número secreto (una por jugador).
 */
export class StartMultiPlayerGame {
    constructor(
        private readonly gameRepository: MultiPlayerGameRepository,
        private readonly getOrCreatePlayer: GetOrCreatePlayer,
        private readonly createTrivia: CreateTrivia,
        private readonly idProvider: IdProvider,
    ) {}

    async execute(nickname1: string, nickname2: string): Promise<MultiPlayerGameDTO> {
        const player1 = await this.getOrCreatePlayer.execute(nickname1);
        const player2 = await this.getOrCreatePlayer.execute(nickname2);

        // Ambos jugadores adivinan el mismo número secreto
        const sharedSecret = SecretNumber.generate();
        const trivia1 = await this.createTrivia.execute(sharedSecret);
        const trivia2 = await this.createTrivia.execute(sharedSecret);

        const game = MultiPlayerGame.create(
            this.idProvider.generate(),
            player1.id,
            player2.id,
            trivia1.getId(),
            trivia2.getId(),
        );

        await this.gameRepository.save(game);

        return toMultiPlayerGameDTO(game, player1, player2, trivia1, trivia2);
    }
}
