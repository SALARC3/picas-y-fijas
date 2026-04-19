import { GameState } from '../value_objects/GameState';
import { PlayerTurn } from '../value_objects/PlayerTurn';
import { MultiplayerResult } from '../value_objects/MultiplayerResult';
import { GuessResult } from '../../../trivia/domain/value_objects/GuessResult';

export class MultiplayerGame {
    public readonly id: string;
    public readonly player1Id: string;
    public readonly player2Id: string;
    public readonly trivia1Id: string;
    public readonly trivia2Id: string;
    private _currentTurn: PlayerTurn;
    private _state: GameState;
    private _result: MultiplayerResult | null;
    private _waitingForEqualizer: boolean;
    public readonly createdAt: Date;
    public updatedAt: Date;

    private constructor(
        id: string,
        player1Id: string,
        player2Id: string,
        trivia1Id: string,
        trivia2Id: string,
        currentTurn: PlayerTurn,
        state: GameState,
        result: MultiplayerResult | null,
        waitingForEqualizer: boolean,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        this.id = id;
        this.player1Id = player1Id;
        this.player2Id = player2Id;
        this.trivia1Id = trivia1Id;
        this.trivia2Id = trivia2Id;
        this._currentTurn = currentTurn;
        this._state = state;
        this._result = result;
        this._waitingForEqualizer = waitingForEqualizer;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
    }

    public static create(
        id: string,
        player1Id: string,
        player2Id: string,
        trivia1Id: string,
        trivia2Id: string,
        createdAt?: Date,
        updatedAt?: Date,
    ): MultiplayerGame {
        if (player1Id === player2Id) {
            throw new Error('Los jugadores deben ser distintos.');
        }
        return new MultiplayerGame(
            id,
            player1Id,
            player2Id,
            trivia1Id,
            trivia2Id,
            PlayerTurn.PLAYER_1,
            GameState.PLAYING,
            null,
            false,
            createdAt,
            updatedAt,
        );
    }

    public static restore(
        id: string,
        player1Id: string,
        player2Id: string,
        trivia1Id: string,
        trivia2Id: string,
        currentTurn: PlayerTurn,
        state: GameState,
        result: MultiplayerResult | null,
        waitingForEqualizer: boolean,
        createdAt: Date,
        updatedAt: Date,
    ): MultiplayerGame {
        return new MultiplayerGame(
            id, player1Id, player2Id, trivia1Id, trivia2Id,
            currentTurn, state, result, waitingForEqualizer,
            createdAt, updatedAt,
        );
    }

    public get currentTurn(): PlayerTurn {
        return this._currentTurn;
    }

    public get state(): GameState {
        return this._state;
    }

    public get result(): MultiplayerResult | null {
        return this._result;
    }

    public get waitingForEqualizer(): boolean {
        return this._waitingForEqualizer;
    }

    public validateTurn(playerId: string): void {
        if (this._state === GameState.FINISHED) {
            throw new Error('La partida ya terminó.');
        }
        const expectedPlayerId = this._currentTurn === PlayerTurn.PLAYER_1
            ? this.player1Id
            : this.player2Id;
        if (playerId !== expectedPlayerId) {
            throw new Error('No es tu turno.');
        }
    }

    public getTriviaIdForPlayer(playerId: string): string {
        if (playerId === this.player1Id) return this.trivia1Id;
        if (playerId === this.player2Id) return this.trivia2Id;
        throw new Error(`El jugador ${playerId} no pertenece a esta partida.`);
    }

    public processGuessResult(
        playerId: string,
        guessResult: GuessResult,
        otherTriviaFinished: boolean,
        currentPlayerScore: number | null,
        otherPlayerScore: number | null,
    ): void {
        if (this._state === GameState.FINISHED) {
            throw new Error('La partida ya terminó.');
        }

        const isPlayer1 = playerId === this.player1Id;
        const guessed = guessResult.isSecretGuessed();

        if (!guessed) {
            if (this._waitingForEqualizer) {
                this.finish(isPlayer1 ? MultiplayerResult.PLAYER_2_WINS : MultiplayerResult.PLAYER_1_WINS);
            } else {
                this.switchTurn();
            }
        } else {
            if (this._waitingForEqualizer) {
                this.resolveByScore(currentPlayerScore, otherPlayerScore, isPlayer1);
            } else {
                this._waitingForEqualizer = true;
                this.switchTurn();
            }
        }

        this.updatedAt = new Date();
    }

    private resolveByScore(
        currentPlayerScore: number | null,
        otherPlayerScore: number | null,
        currentIsPlayer1: boolean,
    ): void {
        const score1 = currentIsPlayer1 ? currentPlayerScore : otherPlayerScore;
        const score2 = currentIsPlayer1 ? otherPlayerScore : currentPlayerScore;

        if (score1 === null || score2 === null) {
            throw new Error('No se pueden comparar puntajes sin calcular.');
        }

        if (score1 > score2) {
            this.finish(MultiplayerResult.PLAYER_1_WINS);
        } else if (score2 > score1) {
            this.finish(MultiplayerResult.PLAYER_2_WINS);
        } else {
            this.finish(MultiplayerResult.DRAW);
        }
    }

    private switchTurn(): void {
        this._currentTurn = this._currentTurn === PlayerTurn.PLAYER_1
            ? PlayerTurn.PLAYER_2
            : PlayerTurn.PLAYER_1;
    }

    private finish(result: MultiplayerResult): void {
        this._state = GameState.FINISHED;
        this._result = result;
    }
}
