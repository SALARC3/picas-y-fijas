import { SinglePlayerGameRepository } from '../ports/SinglePlayerGameRepository';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';
import { SinglePlayerRankingElementDTO } from '../dto/SinglePlayerRankingElementDTO';

export class GetSinglePlayerRanking {
    constructor(
        private readonly gameRepository: SinglePlayerGameRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly triviaRepository: TriviaRepository,
    ) {}

    async execute(): Promise<SinglePlayerRankingElementDTO[]> {
        const games = await this.gameRepository.findAll();

        const playerStats = new Map<string, { gamesPlayed: number; totalScore: number; bestScore: number }>();

        for (const game of games) {
            const trivia = await this.triviaRepository.findById(game.triviaId);
            if (!trivia || !trivia.isFinished()) continue;

            const score = trivia.getScore() ?? 0;
            const stats = playerStats.get(game.playerId) ?? { gamesPlayed: 0, totalScore: 0, bestScore: 0 };

            stats.gamesPlayed++;
            stats.totalScore += score;
            stats.bestScore = Math.max(stats.bestScore, score);

            playerStats.set(game.playerId, stats);
        }

        const ranking: SinglePlayerRankingElementDTO[] = [];

        for (const [playerId, stats] of playerStats) {
            const player = await this.playerRepository.findById(playerId);
            if (!player) continue;

            ranking.push({
                avatarUrl: `https://api.dicebear.com/9.x/thumbs/svg?seed=${player.nickname.value}`,
                playerNickname: player.nickname.value,
                gamesPlayed: stats.gamesPlayed,
                bestScore: stats.bestScore,
                totalScore: stats.totalScore,
            });
        }

        ranking.sort((a, b) => b.bestScore - a.bestScore);

        return ranking;
    }
}
