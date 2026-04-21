import { MultiPlayerGameState } from '../value_objects/MultiPlayerGameState';
import { PlayerSession } from './PlayerSession';

export class MultiPlayerGame {
    public readonly id: string;
    public readonly hostPlayerId: string;
    public readonly maxPlayers: number;
    public readonly createdAt: Date;
    public updatedAt: Date;

    private sessions: PlayerSession[];
    private state: MultiPlayerGameState;
    private winnerId: string | null;
    private secretNumberValue: string;

    private constructor(
        id: string,
        hostPlayerId: string,
        secretNumberValue: string,
        maxPlayers: number,
        sessions: PlayerSession[],
        state: MultiPlayerGameState,
        winnerId: string | null,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        this.id = id;
        this.hostPlayerId = hostPlayerId;
        this.secretNumberValue = secretNumberValue;
        this.maxPlayers = maxPlayers;
        this.sessions = sessions;
        this.state = state;
        this.winnerId = winnerId;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
    }

    public static create(
        id: string,
        hostPlayerId: string,
        secretNumberValue: string,
        maxPlayers: number,
        sessions: PlayerSession[] = [],
        state: MultiPlayerGameState = MultiPlayerGameState.WAITING,
        winnerId: string | null = null,
        createdAt?: Date,
        updatedAt?: Date,
    ): MultiPlayerGame {
        if (maxPlayers < 2 || maxPlayers > 10) {
            throw new Error('La partida multijugador debe tener entre 2 y 10 jugadores.');
        }
        return new MultiPlayerGame(id, hostPlayerId, secretNumberValue, maxPlayers, sessions, state, winnerId, createdAt, updatedAt);
    }

    public addPlayer(session: PlayerSession): void {
        if (this.state !== MultiPlayerGameState.WAITING) {
            throw new Error('No se pueden unir jugadores a una partida que ya inició.');
        }
        if (this.sessions.length >= this.maxPlayers) {
            throw new Error(`La partida ya tiene el máximo de ${this.maxPlayers} jugadores.`);
        }
        if (this.sessions.some(s => s.playerId === session.playerId)) {
            throw new Error('El jugador ya está en esta partida.');
        }
        this.sessions.push(session);
        this.updatedAt = new Date();
    }

    public start(): void {
        if (this.state !== MultiPlayerGameState.WAITING) {
            throw new Error('La partida ya fue iniciada.');
        }
        if (this.sessions.length < 2) {
            throw new Error('Se necesitan al menos 2 jugadores para iniciar.');
        }
        this.state = MultiPlayerGameState.PLAYING;
        this.updatedAt = new Date();
    }

    public finish(winnerId: string): void {
        if (this.state !== MultiPlayerGameState.PLAYING) {
            throw new Error('La partida no está en curso.');
        }
        this.state = MultiPlayerGameState.FINISHED;
        this.winnerId = winnerId;
        this.updatedAt = new Date();
    }

    public getState(): MultiPlayerGameState { return this.state; }
    public getSessions(): PlayerSession[] { return [...this.sessions]; }
    public getWinnerId(): string | null { return this.winnerId; }
    public getSecretNumberValue(): string { return this.secretNumberValue; }

    public getSessionByPlayerId(playerId: string): PlayerSession | undefined {
        return this.sessions.find(s => s.playerId === playerId);
    }
}
