import { GuessResultDTO } from '../../../trivia/application/dto/TriviaDTO';

export interface PlayerSessionDTO {
    playerId: string;
    playerNickname: string;
    triviaId: string;
    guesses: GuessResultDTO[];
    finished: boolean;
    score: number | null;
    joinedAt: string;
}

export interface MultiPlayerGameDTO {
    id: string;
    hostPlayerId: string;
    maxPlayers: number;
    state: string;
    winnerId: string | null;
    winnerNickname: string | null;
    players: PlayerSessionDTO[];
    createdAt: string;
    updatedAt: string;
}
