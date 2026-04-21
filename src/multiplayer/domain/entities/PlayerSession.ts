/**
 * Representa la participación de un jugador en una partida multijugador.
 * Cada jugador tiene su propia Trivia (su propio intento de adivinar el secreto compartido).
 */
export class PlayerSession {
    public readonly playerId: string;
    public readonly triviaId: string;
    public readonly joinedAt: Date;

    private constructor(playerId: string, triviaId: string, joinedAt?: Date) {
        this.playerId = playerId;
        this.triviaId = triviaId;
        this.joinedAt = joinedAt ?? new Date();
    }

    public static create(playerId: string, triviaId: string, joinedAt?: Date): PlayerSession {
        return new PlayerSession(playerId, triviaId, joinedAt);
    }
}
