import { GetMultiplayerGameStatus } from '../GetMultiplayerGameStatus';
import { MultiplayerGameRepository } from '../../ports/MultiplayerGameRepository';
import { IPlayerRepository } from '../../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../../trivia/application/ports/TriviaRepository';
import { MultiplayerGame } from '../../../domain/entities/MultiplayerGame';
import { Player } from '../../../../player/domain/entities/Player';
import { Nickname } from '../../../../player/domain/value_objects/Nickname';
import { Trivia } from '../../../../trivia/domain/entities/Trivia';
import { SecretNumber } from '../../../../trivia/domain/value_objects/SecretNumber';
import { GameState } from '../../../domain/value_objects/GameState';
import { PlayerTurn } from '../../../domain/value_objects/PlayerTurn';

describe('GetMultiplayerGameStatus', () => {
    let mockGameRepo: jest.Mocked<MultiplayerGameRepository>;
    let mockPlayerRepo: jest.Mocked<IPlayerRepository>;
    let mockTriviaRepo: jest.Mocked<TriviaRepository>;
    let useCase: GetMultiplayerGameStatus;

    beforeEach(() => {
        mockGameRepo = {
            save: jest.fn(),
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

        useCase = new GetMultiplayerGameStatus(mockGameRepo, mockPlayerRepo, mockTriviaRepo);
    });

    it('debe retornar el estado completo de una partida', async () => {
        const game = MultiplayerGame.create('game-id', 'p1-id', 'p2-id', 't1-id', 't2-id');
        const player1 = Player.create('p1-id', new Nickname('player_one'));
        const player2 = Player.create('p2-id', new Nickname('player_two'));
        const trivia1 = new Trivia('t1-id', new SecretNumber('1234'));
        const trivia2 = new Trivia('t2-id', new SecretNumber('5678'));

        mockGameRepo.findById.mockResolvedValue(game);
        mockPlayerRepo.findById
            .mockResolvedValueOnce(player1)
            .mockResolvedValueOnce(player2);
        mockTriviaRepo.findById
            .mockResolvedValueOnce(trivia1)
            .mockResolvedValueOnce(trivia2);

        const result = await useCase.execute('game-id');

        expect(result.id).toBe('game-id');
        expect(result.player1.playerNickname).toBe('player_one');
        expect(result.player2.playerNickname).toBe('player_two');
        expect(result.state).toBe(GameState.PLAYING);
        expect(result.currentTurn).toBe(PlayerTurn.PLAYER_1);
    });

    it('debe retornar error cuando la partida no existe', async () => {
        mockGameRepo.findById.mockResolvedValue(null);

        await expect(useCase.execute('nonexistent'))
            .rejects.toThrow('no encontrado');
    });
});
