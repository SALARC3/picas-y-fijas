import { GuessResultDTO } from '../../../trivia/application/dto/TriviaDTO';

export interface MultiPlayerPlayerDTO {
    playerId: string;
    playerNickname: string;
    guesses: GuessResultDTO[];
    score: number | null;
}

export interface MultiPlayerGameDTO {
    id: string;
    player1: MultiPlayerPlayerDTO;
    player2: MultiPlayerPlayerDTO;
    currentTurnPlayerId: string;
    currentTurnNickname: string;
    winnerId: string | null;
    winnerNickname: string | null;
    state: string;
    createdAt: string;
    updatedAt: string;
}
