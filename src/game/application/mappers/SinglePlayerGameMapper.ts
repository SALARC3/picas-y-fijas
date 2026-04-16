import { SinglePlayerGame } from '../../domain/entities/SinglePlayerGame';
import { SinglePlayerGameDTO } from '../dto/SinglePlayerGameDTO';
import { GuessResultDTO } from '../../../trivia/application/dto/TriviaDTO';
import { Trivia } from '../../../trivia/domain/entities/Trivia';
import { Player } from '../../../player/domain/entities/Player';
import { GameState } from '../../domain/value_objects/GameState';

export function toSinglePlayerGameDTO(game: SinglePlayerGame, player: Player, trivia: Trivia): SinglePlayerGameDTO {
    return {
        id: game.id,
        playerId: game.playerId,
        playerNickname: player.nickname.value,
        triviaId: game.triviaId,
        guesses: trivia.getGuesses().map<GuessResultDTO>(g => ({
            guess: g.guess.value,
            picas: g.picas,
            fijas: g.fijas,
        })),
        state: trivia.isFinished() ? GameState.FINISHED : GameState.PLAYING,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
    };
}
