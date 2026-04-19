import { MultiplayerGame } from '../../domain/entities/MultiplayerGame';
import { MultiplayerGameDTO, MultiplayerPlayerDTO } from '../dto/MultiplayerGameDTO';
import { GuessResultDTO } from '../../../trivia/application/dto/TriviaDTO';
import { Trivia } from '../../../trivia/domain/entities/Trivia';
import { Player } from '../../../player/domain/entities/Player';
import { GameState } from '../../domain/value_objects/GameState';
import { PlayerTurn } from '../../domain/value_objects/PlayerTurn';
import { MultiplayerResult } from '../../domain/value_objects/MultiplayerResult';

function mapPlayerDTO(player: Player, trivia: Trivia): MultiplayerPlayerDTO {
    return {
        playerId: player.id,
        playerNickname: player.nickname.value,
        triviaId: trivia.getId(),
        guesses: trivia.getGuesses().map<GuessResultDTO>(g => ({
            guess: g.guess.value,
            picas: g.picas,
            fijas: g.fijas,
        })),
        attemptsCount: trivia.getGuesses().length,
        score: trivia.getScore(),
    };
}

function resolveWinner(
    game: MultiplayerGame,
    player1: Player,
    player2: Player,
): { winnerId: string | null; winnerNickname: string | null } {
    if (!game.result) return { winnerId: null, winnerNickname: null };

    switch (game.result) {
        case MultiplayerResult.PLAYER_1_WINS:
            return { winnerId: player1.id, winnerNickname: player1.nickname.value };
        case MultiplayerResult.PLAYER_2_WINS:
            return { winnerId: player2.id, winnerNickname: player2.nickname.value };
        case MultiplayerResult.DRAW:
            return { winnerId: null, winnerNickname: null };
    }
}

export function toMultiplayerGameDTO(
    game: MultiplayerGame,
    player1: Player,
    player2: Player,
    trivia1: Trivia,
    trivia2: Trivia,
): MultiplayerGameDTO {
    const { winnerId, winnerNickname } = resolveWinner(game, player1, player2);

    return {
        id: game.id,
        player1: mapPlayerDTO(player1, trivia1),
        player2: mapPlayerDTO(player2, trivia2),
        currentTurn: game.currentTurn,
        currentPlayerId: game.currentTurn === PlayerTurn.PLAYER_1 ? game.player1Id : game.player2Id,
        state: game.state,
        result: game.result,
        winnerId,
        winnerNickname,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
    };
}
