import { MultiplayerGame } from '../MultiplayerGame';
import { PlayerTurn } from '../../value_objects/PlayerTurn';
import { GameState } from '../../value_objects/GameState';
import { MultiplayerResult } from '../../value_objects/MultiplayerResult';
import { Guess } from '../../../../trivia/domain/value_objects/Guess';
import { GuessResult } from '../../../../trivia/domain/value_objects/GuessResult';

function makeGuessResult(picas: number, fijas: number, guessValue = '1234'): GuessResult {
    return new GuessResult(new Guess(guessValue), picas, fijas);
}

function makeWinningGuessResult(guessValue = '1234'): GuessResult {
    return new GuessResult(new Guess(guessValue), 0, 4);
}

describe('MultiplayerGame', () => {
    const PLAYER_1_ID = 'player-1-id';
    const PLAYER_2_ID = 'player-2-id';
    const TRIVIA_1_ID = 'trivia-1-id';
    const TRIVIA_2_ID = 'trivia-2-id';
    const GAME_ID = 'game-id';

    function createGame(): MultiplayerGame {
        return MultiplayerGame.create(GAME_ID, PLAYER_1_ID, PLAYER_2_ID, TRIVIA_1_ID, TRIVIA_2_ID);
    }

    describe('create', () => {
        it('debe crear una partida con turno inicial PLAYER_1 y estado PLAYING', () => {
            const game = createGame();

            expect(game.id).toBe(GAME_ID);
            expect(game.player1Id).toBe(PLAYER_1_ID);
            expect(game.player2Id).toBe(PLAYER_2_ID);
            expect(game.trivia1Id).toBe(TRIVIA_1_ID);
            expect(game.trivia2Id).toBe(TRIVIA_2_ID);
            expect(game.currentTurn).toBe(PlayerTurn.PLAYER_1);
            expect(game.state).toBe(GameState.PLAYING);
            expect(game.result).toBeNull();
            expect(game.waitingForEqualizer).toBe(false);
        });

        it('debe rechazar creación con el mismo playerId para ambos jugadores', () => {
            expect(() => {
                MultiplayerGame.create(GAME_ID, PLAYER_1_ID, PLAYER_1_ID, TRIVIA_1_ID, TRIVIA_2_ID);
            }).toThrow('Los jugadores deben ser distintos.');
        });
    });

    describe('validateTurn', () => {
        it('debe aceptar al jugador correcto en su turno', () => {
            const game = createGame();
            expect(() => game.validateTurn(PLAYER_1_ID)).not.toThrow();
        });

        it('debe rechazar al jugador incorrecto', () => {
            const game = createGame();
            expect(() => game.validateTurn(PLAYER_2_ID)).toThrow('No es tu turno.');
        });

        it('debe rechazar cualquier intento en partida terminada', () => {
            const game = createGame();
            game.processGuessResult(PLAYER_1_ID, makeWinningGuessResult(), false, 5000, null);
            game.processGuessResult(PLAYER_2_ID, makeGuessResult(1, 2), false, null, null);

            expect(() => game.validateTurn(PLAYER_1_ID)).toThrow('La partida ya terminó.');
        });
    });

    describe('getTriviaIdForPlayer', () => {
        it('debe retornar trivia1Id para player1', () => {
            const game = createGame();
            expect(game.getTriviaIdForPlayer(PLAYER_1_ID)).toBe(TRIVIA_1_ID);
        });

        it('debe retornar trivia2Id para player2', () => {
            const game = createGame();
            expect(game.getTriviaIdForPlayer(PLAYER_2_ID)).toBe(TRIVIA_2_ID);
        });

        it('debe lanzar error para un jugador que no pertenece a la partida', () => {
            const game = createGame();
            expect(() => game.getTriviaIdForPlayer('unknown-id')).toThrow('no pertenece a esta partida');
        });
    });

    describe('processGuessResult', () => {
        it('debe cambiar turno tras intento fallido', () => {
            const game = createGame();
            game.processGuessResult(PLAYER_1_ID, makeGuessResult(1, 2), false, null, null);

            expect(game.currentTurn).toBe(PlayerTurn.PLAYER_2);
            expect(game.state).toBe(GameState.PLAYING);
        });

        it('debe alternar turnos correctamente en múltiples intentos fallidos', () => {
            const game = createGame();

            game.processGuessResult(PLAYER_1_ID, makeGuessResult(1, 0), false, null, null);
            expect(game.currentTurn).toBe(PlayerTurn.PLAYER_2);

            game.processGuessResult(PLAYER_2_ID, makeGuessResult(0, 1), false, null, null);
            expect(game.currentTurn).toBe(PlayerTurn.PLAYER_1);

            game.processGuessResult(PLAYER_1_ID, makeGuessResult(2, 1), false, null, null);
            expect(game.currentTurn).toBe(PlayerTurn.PLAYER_2);
        });

        it('debe activar equalizer cuando player1 acierta y dar turno a player2', () => {
            const game = createGame();
            game.processGuessResult(PLAYER_1_ID, makeWinningGuessResult(), false, 5000, null);

            expect(game.waitingForEqualizer).toBe(true);
            expect(game.currentTurn).toBe(PlayerTurn.PLAYER_2);
            expect(game.state).toBe(GameState.PLAYING);
        });

        it('debe activar equalizer cuando player2 acierta primero y dar turno a player1', () => {
            const game = createGame();
            // Player 1 falla
            game.processGuessResult(PLAYER_1_ID, makeGuessResult(1, 2), false, null, null);
            // Player 2 acierta
            game.processGuessResult(PLAYER_2_ID, makeWinningGuessResult(), false, null, 5000);

            expect(game.waitingForEqualizer).toBe(true);
            expect(game.currentTurn).toBe(PlayerTurn.PLAYER_1);
            expect(game.state).toBe(GameState.PLAYING);
        });

        it('debe declarar ganador a player1 cuando player2 falla el equalizer', () => {
            const game = createGame();
            // Player 1 acierta
            game.processGuessResult(PLAYER_1_ID, makeWinningGuessResult(), false, 5000, null);
            // Player 2 falla el equalizer
            game.processGuessResult(PLAYER_2_ID, makeGuessResult(1, 2), false, null, null);

            expect(game.state).toBe(GameState.FINISHED);
            expect(game.result).toBe(MultiplayerResult.PLAYER_1_WINS);
        });

        it('debe declarar ganador a player2 cuando player1 falla el equalizer', () => {
            const game = createGame();
            // Player 1 falla
            game.processGuessResult(PLAYER_1_ID, makeGuessResult(1, 2), false, null, null);
            // Player 2 acierta
            game.processGuessResult(PLAYER_2_ID, makeWinningGuessResult(), false, null, 5000);
            // Player 1 falla el equalizer
            game.processGuessResult(PLAYER_1_ID, makeGuessResult(2, 1), false, null, null);

            expect(game.state).toBe(GameState.FINISHED);
            expect(game.result).toBe(MultiplayerResult.PLAYER_2_WINS);
        });

        it('debe declarar ganador por mejor puntaje cuando ambos aciertan en la misma ronda', () => {
            const game = createGame();
            // Player 1 acierta con score 5000
            game.processGuessResult(PLAYER_1_ID, makeWinningGuessResult(), false, 5000, null);
            // Player 2 acierta con score 3000 (equalizer)
            game.processGuessResult(PLAYER_2_ID, makeWinningGuessResult(), true, 3000, 5000);

            expect(game.state).toBe(GameState.FINISHED);
            expect(game.result).toBe(MultiplayerResult.PLAYER_1_WINS);
        });

        it('debe declarar ganador a player2 cuando tiene mejor puntaje en empate de ronda', () => {
            const game = createGame();
            // Player 1 acierta con score 3000
            game.processGuessResult(PLAYER_1_ID, makeWinningGuessResult(), false, 3000, null);
            // Player 2 acierta con score 5000 (equalizer)
            game.processGuessResult(PLAYER_2_ID, makeWinningGuessResult(), true, 5000, 3000);

            expect(game.state).toBe(GameState.FINISHED);
            expect(game.result).toBe(MultiplayerResult.PLAYER_2_WINS);
        });

        it('debe declarar empate cuando ambos aciertan con el mismo puntaje', () => {
            const game = createGame();
            // Player 1 acierta con score 5000
            game.processGuessResult(PLAYER_1_ID, makeWinningGuessResult(), false, 5000, null);
            // Player 2 acierta con score 5000 (equalizer)
            game.processGuessResult(PLAYER_2_ID, makeWinningGuessResult(), true, 5000, 5000);

            expect(game.state).toBe(GameState.FINISHED);
            expect(game.result).toBe(MultiplayerResult.DRAW);
        });

        it('debe rechazar intento en partida terminada', () => {
            const game = createGame();
            game.processGuessResult(PLAYER_1_ID, makeWinningGuessResult(), false, 5000, null);
            game.processGuessResult(PLAYER_2_ID, makeGuessResult(1, 2), false, null, null);

            expect(() => {
                game.processGuessResult(PLAYER_1_ID, makeGuessResult(1, 0), false, null, null);
            }).toThrow('La partida ya terminó.');
        });
    });

    describe('restore', () => {
        it('debe restaurar una partida con todos sus campos', () => {
            const now = new Date();
            const game = MultiplayerGame.restore(
                GAME_ID, PLAYER_1_ID, PLAYER_2_ID, TRIVIA_1_ID, TRIVIA_2_ID,
                PlayerTurn.PLAYER_2, GameState.PLAYING, null, true, now, now,
            );

            expect(game.currentTurn).toBe(PlayerTurn.PLAYER_2);
            expect(game.waitingForEqualizer).toBe(true);
        });
    });
});
