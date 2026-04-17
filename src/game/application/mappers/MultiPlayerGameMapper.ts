import { MultiPlayerGame } from '../../domain/entities/MultiPlayerGame';
import { MultiPlayerGameDTO, MultiPlayerPlayerDTO } from '../dto/MultiPlayerGameDTO';
import { GuessResultDTO } from '../../../trivia/application/dto/TriviaDTO';
import { Trivia } from '../../../trivia/domain/entities/Trivia';
import { Player } from '../../../player/domain/entities/Player';

function toPlayerDTO(player: Player, trivia: Trivia): MultiPlayerPlayerDTO {
    return {
        playerId: player.id,
        playerNickname: player.nickname.value,
        guesses: trivia.getGuesses().map<GuessResultDTO>(g => ({
            guess: g.guess.value,
            picas: g.picas,
            fijas: g.fijas,
        })),
        score: trivia.getScore(),
    };
}

export function toMultiPlayerGameDTO(
    game: MultiPlayerGame,
    player1: Player,
    player2: Player,
    trivia1: Trivia,
    trivia2: Trivia,
): MultiPlayerGameDTO {
    const winnerId = game.getWinnerId();
    const winner = winnerId === player1.id ? player1 : winnerId === player2.id ? player2 : null;

    const currentTurnId = game.getCurrentTurnPlayerId();
    const currentTurnPlayer = currentTurnId === player1.id ? player1 : player2;

    return {
        id: game.id,
        player1: toPlayerDTO(player1, trivia1),
        player2: toPlayerDTO(player2, trivia2),
        currentTurnPlayerId: currentTurnId,
        currentTurnNickname: currentTurnPlayer.nickname.value,
        winnerId: winnerId,
        winnerNickname: winner?.nickname.value ?? null,
        state: game.getState(),
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
    };
}
