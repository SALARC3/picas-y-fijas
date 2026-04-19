import { MakeMultiplayerGuess } from '../MakeMultiplayerGuess';
import { MultiplayerGameRepository } from '../../ports/MultiplayerGameRepository';
import { IPlayerRepository } from '../../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../../trivia/application/ports/TriviaRepository';
import { MakeGuess } from '../../../../trivia/application/use-cases/MakeGuess';
import { MultiplayerGame } from '../../../domain/entities/MultiplayerGame';
import { Player } from '../../../../player/domain/entities/Player';
import { Nickname } from '../../../../player/domain/value_objects/Nickname';
import { Trivia } from '../../../../trivia/domain/entities/Trivia';
import { SecretNumber } from '../../../../trivia/domain/value_objects/SecretNumber';
import { Guess } from '../../../../trivia/domain/value_objects/Guess';
import { GameState } from '../../../domain/value_objects/GameState';

describe('MakeMultiplayerGuess', () => {
    let mockGameRepo: jest.Mocked<MultiplayerGameRepository>;
    let mockPlayerRepo: jest.Mocked<IPlayerRepository>;
    let mockTriviaRepo: jest.Mocked<TriviaRepository>;
    let mockMakeGuess: jest.Mocked<MakeGuess>;
    let useCase: MakeMultiplayerGuess;

    const player1 = Player.create('p1-id', new Nickname('player_one'));
    const player2 = Player.create('p2-id', new Nickname('player_two'));

    beforeEach(() => {
        mockGameRepo = {
            save: jest.fn().mockResolvedValue(undefined),
            findById: jest.fn(),
            findAll: jest.fn(),
        };
        mockPlayerRepo = {
            findById: jest.fn(),
            findByNickname: jest.fn(),
            save: jest.fn(),
        };
        mockTriviaRepo = {
            save: jest.fn(),
            findById: jest.fn(),
        };
        mockMakeGuess = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<MakeGuess>;

        mockPlayerRepo.findById
            .mockImplementation(async (id: string) => {
                if (id === 'p1-id') return player1;
                if (id === 'p2-id') return player2;
                return null;
            });

        useCase = new MakeMultiplayerGuess(mockGameRepo, mockPlayerRepo, mockTriviaRepo, mockMakeGuess);
    });

    it('debe procesar un intento válido en el turno correcto', async () => {
        const game = MultiplayerGame.create('game-id', 'p1-id', 'p2-id', 't1-id', 't2-id');
        mockGameRepo.findById.mockResolvedValue(game);

        const trivia1 = new Trivia('t1-id', new SecretNumber('1234'));
        trivia1.makeGuess(new Guess('5678'));
        mockMakeGuess.execute.mockResolvedValue(trivia1);

        const trivia2 = new Trivia('t2-id', new SecretNumber('5678'));
        mockTriviaRepo.findById.mockResolvedValue(trivia2);

        const result = await useCase.execute('game-id', 'p1-id', '5678');

        expect(result.state).toBe(GameState.PLAYING);
        expect(result.player1.guesses).toHaveLength(1);
        expect(mockGameRepo.save).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar intento fuera de turno', async () => {
        const game = MultiplayerGame.create('game-id', 'p1-id', 'p2-id', 't1-id', 't2-id');
        mockGameRepo.findById.mockResolvedValue(game);

        await expect(useCase.execute('game-id', 'p2-id', '5678'))
            .rejects.toThrow('No es tu turno.');
    });

    it('debe retornar error cuando el game no existe', async () => {
        mockGameRepo.findById.mockResolvedValue(null);

        await expect(useCase.execute('nonexistent', 'p1-id', '5678'))
            .rejects.toThrow('no encontrado');
    });

    it('debe terminar la partida cuando player1 acierta y player2 falla el equalizer', async () => {
        const game = MultiplayerGame.create('game-id', 'p1-id', 'p2-id', 't1-id', 't2-id');
        mockGameRepo.findById.mockResolvedValue(game);

        // Player 1 acierta
        const trivia1Win = new Trivia('t1-id', new SecretNumber('1234'));
        trivia1Win.makeGuess(new Guess('1234'));
        mockMakeGuess.execute.mockResolvedValue(trivia1Win);

        const trivia2Fresh = new Trivia('t2-id', new SecretNumber('5678'));
        mockTriviaRepo.findById.mockResolvedValue(trivia2Fresh);

        const resultAfterP1 = await useCase.execute('game-id', 'p1-id', '1234');
        expect(resultAfterP1.state).toBe(GameState.PLAYING);

        // Player 2 falla
        const trivia2Fail = new Trivia('t2-id', new SecretNumber('5678'));
        trivia2Fail.makeGuess(new Guess('1234'));
        mockMakeGuess.execute.mockResolvedValue(trivia2Fail);

        const trivia1Finished = new Trivia('t1-id', new SecretNumber('1234'));
        trivia1Finished.makeGuess(new Guess('1234'));
        mockTriviaRepo.findById.mockResolvedValue(trivia1Finished);

        const resultAfterP2 = await useCase.execute('game-id', 'p2-id', '1234');
        expect(resultAfterP2.state).toBe(GameState.FINISHED);
        expect(resultAfterP2.winnerNickname).toBe('player_one');
    });
});
