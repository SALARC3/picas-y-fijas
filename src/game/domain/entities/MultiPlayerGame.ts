import { GameState } from '../value_objects/GameState';

/**
 * Entidad — partida multijugador (2 jugadores).
 * Ambos jugadores adivinan el MISMO número secreto, turnándose.
 * Cada jugador tiene su propia Trivia para trackear sus intentos.
 * Gana el primero que adivine.
 */
export class MultiPlayerGame {
    public readonly id: string;
    public readonly player1Id: string;
    public readonly player2Id: string;
    public readonly trivia1Id: string;
    public readonly trivia2Id: string;
    public readonly createdAt: Date;
    public updatedAt: Date;
    private currentTurnPlayerId: string;
    private winnerId: string | null;

    private constructor(
        id: string,
        player1Id: string,
        player2Id: string,
        trivia1Id: string,
        trivia2Id: string,
        currentTurnPlayerId: string,
        winnerId: string | null,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        this.id = id;
        this.player1Id = player1Id;
        this.player2Id = player2Id;
        this.trivia1Id = trivia1Id;
        this.trivia2Id = trivia2Id;
        this.currentTurnPlayerId = currentTurnPlayerId;
        this.winnerId = winnerId;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
    }

    public static create(
        id: string,
        player1Id: string,
        player2Id: string,
        trivia1Id: string,
        trivia2Id: string,
        currentTurnPlayerId?: string,
        winnerId?: string | null,
        createdAt?: Date,
        updatedAt?: Date,
    ): MultiPlayerGame {
        return new MultiPlayerGame(
            id,
            player1Id,
            player2Id,
            trivia1Id,
            trivia2Id,
            currentTurnPlayerId ?? player1Id,
            winnerId ?? null,
            createdAt,
            updatedAt,
        );
    }

    /**
     * Retorna el ID de la trivia del jugador actual.
     */
    public getCurrentTriviaId(): string {
        return this.currentTurnPlayerId === this.player1Id
            ? this.trivia1Id
            : this.trivia2Id;
    }

    /**
     * Retorna el ID del jugador que tiene el turno.
     */
    public getCurrentTurnPlayerId(): string {
        return this.currentTurnPlayerId;
    }

    /**
     * Cambia el turno al otro jugador.
     */
    public switchTurn(): void {
        if (this.isFinished()) {
            throw new Error('La partida ya terminó.');
        }
        this.currentTurnPlayerId = this.currentTurnPlayerId === this.player1Id
            ? this.player2Id
            : this.player1Id;
        this.updatedAt = new Date();
    }

    /**
     * Marca al jugador actual como ganador.
     */
    public setWinner(playerId: string): void {
        if (playerId !== this.player1Id && playerId !== this.player2Id) {
            throw new Error('El jugador no pertenece a esta partida.');
        }
        this.winnerId = playerId;
        this.updatedAt = new Date();
    }

    public getWinnerId(): string | null {
        return this.winnerId;
    }

    public isFinished(): boolean {
        return this.winnerId !== null;
    }

    public getState(): GameState {
        return this.isFinished() ? GameState.FINISHED : GameState.PLAYING;
    }

    /**
     * Retorna el ID de la trivia de un jugador específico.
     */
    public getTriviaIdForPlayer(playerId: string): string {
        if (playerId === this.player1Id) return this.trivia1Id;
        if (playerId === this.player2Id) return this.trivia2Id;
        throw new Error('El jugador no pertenece a esta partida.');
    }
}
