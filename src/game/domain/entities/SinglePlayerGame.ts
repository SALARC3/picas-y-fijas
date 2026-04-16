import { GameState } from '../value_objects/GameState';

export class SinglePlayerGame {
    public readonly id: string;
    public readonly playerId: string;
    public readonly triviaId: string;
    public readonly createdAt: Date;
    public updatedAt: Date;

    private constructor(id: string, playerId: string, triviaId: string, createdAt?: Date, updatedAt?: Date) {
        this.id = id;
        this.playerId = playerId;
        this.triviaId = triviaId;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
    }

    public static create(id: string, playerId: string, triviaId: string, createdAt?: Date, updatedAt?: Date): SinglePlayerGame {
        return new SinglePlayerGame(id, playerId, triviaId, createdAt, updatedAt);
    }

}
