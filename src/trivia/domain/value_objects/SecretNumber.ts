import { SECRET_NUMBER_DIGITS } from '../GameRules';
import { Guess } from './Guess';
import { GuessResult } from './GuessResult';

export class SecretNumber {
    private readonly value: string;

    constructor(value: string) {
        if (!this.isValid(value)) {
            throw new Error(`Invalid secret number. It must have ${SECRET_NUMBER_DIGITS} unique digits.`);
        }
        this.value = value;
    }

    public getValue(): string {
        return this.value;
    }

    public checkGuess(guess: Guess): GuessResult {
        let picas = 0;
        let fijas = 0;

        for (let i = 0; i < this.value.length; i++) {
            if (this.value[i] === guess.value[i]) {
                fijas++;
            } else if (this.value.includes(guess.value[i])) {
                picas++;
            }
        }

        return new GuessResult(guess, picas, fijas);
    }

    private isValid(num: string): boolean {
        if (num.length !== SECRET_NUMBER_DIGITS) {
            return false;
        }

        const digitPattern = new RegExp(`^\\d{${SECRET_NUMBER_DIGITS}}$`);
        if (!digitPattern.test(num)) {
            return false;
        }

        const uniqueDigits = new Set(num.split(''));
        return uniqueDigits.size === SECRET_NUMBER_DIGITS;
    }

    static generate(): SecretNumber {
        const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        let result = '';
        for (let i = 0; i < SECRET_NUMBER_DIGITS; i++) {
            const randomIndex = Math.floor(Math.random() * digits.length);
            result += digits.splice(randomIndex, 1)[0];
        }
        return new SecretNumber(result);
    }
}
