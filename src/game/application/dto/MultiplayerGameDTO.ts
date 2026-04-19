import { GuessResultDTO } from '../../../trivia/application/dto/TriviaDTO';

export interface MultiplayerPlayerDTO {
    playerId: string;
    playerNickname: string;
    triviaId: string;
    guesses: GuessResultDTO[];
    attemptsCount: number;
    score: number | null;
}

export interface MultiplayerGameDTO {
    id: string;
    player1: MultiplayerPlayerDTO;
    player2: MultiplayerPlayerDTO;
    currentTurn: string;
    currentPlayerId: string;
    state: string;
    result: string | null;
    winnerId: string | null;
    winnerNickname: string | null;
    createdAt: string;
    updatedAt: string;
}
