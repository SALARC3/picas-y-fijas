import { GuessResultDTO } from '../../../trivia/application/dto/TriviaDTO';

export interface SinglePlayerGameDTO {
    id: string;
    playerId: string;
    playerNickname: string;
    triviaId: string;
    guesses: GuessResultDTO[];
    state: string;
    createdAt: string;
    updatedAt: string;
}
