export class Nickname {
    public readonly value: string;

    constructor(value: string) {
        this.validate(value);
        this.value = value;
    }

    private validate(value: string): void {
        if (!value) {
            throw new Error('Nickname cannot be empty.');
        }
        if (value.length < 3) {
            throw new Error('Nickname must be at least 3 characters long.');
        }
        if (value.length > 20) {
            throw new Error('Nickname cannot be more than 20 characters long.');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            throw new Error('Nickname can only contain letters, numbers, and underscores.');
        }
    }

    public equals(other: Nickname): boolean {
        return this.value === other.value;
    }
}
