import { MultiPlayerGame } from '../../domain/entities/MultiPlayerGame';
import { MultiPlayerGameDTO, PlayerSessionDTO } from '../dto/MultiPlayerGameDTO';
import { Player } from '../../../player/domain/entities/Player';
import { Trivia } from '../../../trivia/domain/entities/Trivia';
import { GuessResultDTO } from '../../../trivia/application/dto/TriviaDTO';

export function toMultiPlayerGameDTO(
    game: MultiPlayerGame,
    players: Map<string, Player>,
    trivias: Map<string, Trivia>,
): MultiPlayerGameDTO {
    const sessions: PlayerSessionDTO[] = game.getSessions().map(session => {
        const player = players.get(session.playerId);
        const trivia = trivias.get(session.triviaId);

        return {
            playerId: session.playerId,
            playerNickname: player?.nickname.value ?? 'Desconocido',
            triviaId: session.triviaId,
            guesses: trivia ? trivia.getGuesses().map<GuessResultDTO>(g => ({
                guess: g.guess.value,
                picas: g.picas,
                fijas: g.fijas,
            })) : [],
            finished: trivia?.isFinished() ?? false,
            score: trivia?.getScore() ?? null,
            joinedAt: session.joinedAt.toISOString(),
        };
    });

    const winnerId = game.getWinnerId();
    const winnerPlayer = winnerId ? players.get(winnerId) : null;

    return {
        id: game.id,
        hostPlayerId: game.hostPlayerId,
        maxPlayers: game.maxPlayers,
        state: game.getState(),
        winnerId,
        winnerNickname: winnerPlayer?.nickname.value ?? null,
        players: sessions,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
    };
}
