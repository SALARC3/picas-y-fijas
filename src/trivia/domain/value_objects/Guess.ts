import { SECRET_NUMBER_DIGITS } from '../GameRules';

export class Guess {
    public readonly value: string;

    constructor(value: string) {
        if (!this.isValid(value)) {
            throw new Error(`Invalid guess. It must have ${SECRET_NUMBER_DIGITS} unique digits.`);
        }
        this.value = value;
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
}
