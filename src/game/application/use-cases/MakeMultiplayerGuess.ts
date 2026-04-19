import { MultiplayerGameRepository } from '../ports/MultiplayerGameRepository';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';
import { MakeGuess } from '../../../trivia/application/use-cases/MakeGuess';
import { MultiplayerGameDTO } from '../dto/MultiplayerGameDTO';
import { toMultiplayerGameDTO } from '../mappers/MultiplayerGameMapper';

export class MakeMultiplayerGuess {
    constructor(
        private readonly gameRepository: MultiplayerGameRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly triviaRepository: TriviaRepository,
        private readonly makeGuess: MakeGuess,
    ) {}

    async execute(gameId: string, playerId: string, guessValue: string): Promise<MultiplayerGameDTO> {
        const game = await this.gameRepository.findById(gameId);
        if (!game) {
            throw new Error(`Juego con id: ${gameId} no encontrado.`);
        }

        game.validateTurn(playerId);

        const triviaId = game.getTriviaIdForPlayer(playerId);
        const trivia = await this.makeGuess.execute(triviaId, guessValue);

        const lastGuess = trivia.getGuesses()[trivia.getGuesses().length - 1];

        const otherTriviaId = playerId === game.player1Id ? game.trivia2Id : game.trivia1Id;
        const otherTrivia = await this.triviaRepository.findById(otherTriviaId);
        if (!otherTrivia) {
            throw new Error(`Trivia con id: ${otherTriviaId} no encontrada.`);
        }

        const currentPlayerScore = trivia.isFinished() ? trivia.getScore() : null;
        const otherPlayerScore = otherTrivia.isFinished() ? otherTrivia.getScore() : null;

        game.processGuessResult(playerId, lastGuess, otherTrivia.isFinished(), currentPlayerScore, otherPlayerScore);

        await this.gameRepository.save(game);

        const [player1, player2] = await Promise.all([
            this.playerRepository.findById(game.player1Id),
            this.playerRepository.findById(game.player2Id),
        ]);

        if (!player1 || !player2) {
            throw new Error('Jugador no encontrado.');
        }

        const trivia1 = playerId === game.player1Id ? trivia : otherTrivia;
        const trivia2 = playerId === game.player2Id ? trivia : otherTrivia;

        return toMultiplayerGameDTO(game, player1, player2, trivia1, trivia2);
    }
}
