import { SECRET_NUMBER_DIGITS } from '../GameRules';
import { Guess } from './Guess';

export class GuessResult {
    public readonly guess: Guess;
    public readonly picas: number;
    public readonly fijas: number;

    constructor(guess: Guess, picas: number, fijas: number) {
        this.guess = guess;
        this.picas = picas;
        this.fijas = fijas;
    }

    public isSecretGuessed(): boolean {
        return this.fijas === SECRET_NUMBER_DIGITS;
    }
}
