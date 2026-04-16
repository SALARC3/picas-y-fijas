export interface GuessResultDTO {
    guess: string;
    picas: number;
    fijas: number;
}

export interface TriviaDTO {
    id: string;
    guesses: GuessResultDTO[];
    finished: boolean;
    createdAt: string;
    updatedAt: string;
}
