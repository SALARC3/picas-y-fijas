import { MultiplayerGameRepository } from '../ports/MultiplayerGameRepository';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';
import { MultiplayerGameDTO } from '../dto/MultiplayerGameDTO';
import { toMultiplayerGameDTO } from '../mappers/MultiplayerGameMapper';

export class GetMultiplayerGameStatus {
    constructor(
        private readonly gameRepository: MultiplayerGameRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly triviaRepository: TriviaRepository,
    ) {}

    async execute(gameId: string): Promise<MultiplayerGameDTO> {
        const game = await this.gameRepository.findById(gameId);
        if (!game) {
            throw new Error(`Juego con id: ${gameId} no encontrado.`);
        }

        const [player1, player2, trivia1, trivia2] = await Promise.all([
            this.playerRepository.findById(game.player1Id),
            this.playerRepository.findById(game.player2Id),
            this.triviaRepository.findById(game.trivia1Id),
            this.triviaRepository.findById(game.trivia2Id),
        ]);

        if (!player1) throw new Error(`Jugador con id: ${game.player1Id} no encontrado.`);
        if (!player2) throw new Error(`Jugador con id: ${game.player2Id} no encontrado.`);
        if (!trivia1) throw new Error(`Trivia con id: ${game.trivia1Id} no encontrada.`);
        if (!trivia2) throw new Error(`Trivia con id: ${game.trivia2Id} no encontrada.`);

        return toMultiplayerGameDTO(game, player1, player2, trivia1, trivia2);
    }
}
