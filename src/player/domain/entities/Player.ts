import { Nickname } from '../value_objects/Nickname';

export class Player {
    public readonly id: string;
    public readonly nickname: Nickname;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(id: string, nickname: Nickname, createdAt?: Date, updatedAt?: Date) {
        this.id = id;
        this.nickname = nickname;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
    }

    public static create(id: string, nickname: Nickname, createdAt?: Date, updatedAt?: Date): Player {
        return new Player(id, nickname, createdAt, updatedAt);
    }
}
