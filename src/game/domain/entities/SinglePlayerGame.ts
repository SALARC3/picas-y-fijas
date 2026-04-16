import { Player } from '../../../player/domain/entities/Player';
import { Trivia } from '../../../trivia/domain/entities/Trivia';
import { GameState } from '../value_objects/GameState';

export class SinglePlayerGame {
    public readonly id: string;
    public readonly player: Player;
    public readonly trivia: Trivia;
    public readonly createdAt: Date;
    public updatedAt: Date;

    private constructor(id: string, player: Player, trivia: Trivia, createdAt?: Date, updatedAt?: Date) {
        this.id = id;
        this.player = player;
        this.trivia = trivia;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
    }

    public static create(id: string, player: Player, trivia: Trivia, createdAt?: Date, updatedAt?: Date): SinglePlayerGame {
        return new SinglePlayerGame(id, player, trivia, createdAt, updatedAt);
    }

    public getState(): GameState {
        return this.trivia.isFinished() ? GameState.FINISHED : GameState.PLAYING;
    }

}
