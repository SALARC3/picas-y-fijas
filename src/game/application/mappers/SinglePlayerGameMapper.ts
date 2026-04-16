import { SinglePlayerGame } from '../../domain/entities/SinglePlayerGame';
import { SinglePlayerGameDTO } from '../dto/SinglePlayerGameDTO';
import { GuessResultDTO } from '../../../trivia/application/dto/TriviaDTO';

export function toSinglePlayerGameDTO(game: SinglePlayerGame): SinglePlayerGameDTO {
    return {
        id: game.id,
        playerId: game.player.id,
        playerNickname: game.player.nickname.value,
        triviaId: game.trivia.getId(),
        guesses: game.trivia.getGuesses().map<GuessResultDTO>(g => ({
            guess: g.guess.value,
            picas: g.picas,
            fijas: g.fijas,
        })),
        state: game.getState(),
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
    };
}
