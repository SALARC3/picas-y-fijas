import { StartMultiplayerGame } from '../StartMultiplayerGame';
import { MultiplayerGameRepository } from '../../ports/MultiplayerGameRepository';
import { GetOrCreatePlayer } from '../../../../player/application/use-cases/GetOrCreatePlayer';
import { CreateTrivia } from '../../../../trivia/application/use-cases/CreateTrivia';
import { IdProvider } from '../../../../shared/application/ports/IdProvider';
import { Player } from '../../../../player/domain/entities/Player';
import { Nickname } from '../../../../player/domain/value_objects/Nickname';
import { Trivia } from '../../../../trivia/domain/entities/Trivia';
import { SecretNumber } from '../../../../trivia/domain/value_objects/SecretNumber';
import { GameState } from '../../../domain/value_objects/GameState';
import { PlayerTurn } from '../../../domain/value_objects/PlayerTurn';

describe('StartMultiplayerGame', () => {
    let mockGameRepo: jest.Mocked<MultiplayerGameRepository>;
    let mockGetOrCreatePlayer: jest.Mocked<GetOrCreatePlayer>;
    let mockCreateTrivia: jest.Mocked<CreateTrivia>;
    let mockIdProvider: jest.Mocked<IdProvider>;
    let useCase: StartMultiplayerGame;

    const player1 = Player.create('p1-id', new Nickname('player_one'));
    const player2 = Player.create('p2-id', new Nickname('player_two'));
    const trivia1 = new Trivia('t1-id', new SecretNumber('1234'));
    const trivia2 = new Trivia('t2-id', new SecretNumber('5678'));

    beforeEach(() => {
        mockGameRepo = {
            save: jest.fn().mockResolvedValue(undefined),
            findById: jest.fn(),
            findAll: jest.fn(),
        };
        mockGetOrCreatePlayer = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<GetOrCreatePlayer>;
        mockCreateTrivia = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<CreateTrivia>;
        mockIdProvider = {
            generate: jest.fn().mockReturnValue('game-id'),
        };

        mockGetOrCreatePlayer.execute
            .mockResolvedValueOnce(player1)
            .mockResolvedValueOnce(player2);
        mockCreateTrivia.execute
            .mockResolvedValueOnce(trivia1)
            .mockResolvedValueOnce(trivia2);

        useCase = new StartMultiplayerGame(mockGameRepo, mockGetOrCreatePlayer, mockCreateTrivia, mockIdProvider);
    });

    it('debe crear una partida multijugador con dos jugadores distintos', async () => {
        const result = await useCase.execute('player_one', 'player_two');

        expect(result.id).toBe('game-id');
        expect(result.player1.playerNickname).toBe('player_one');
        expect(result.player2.playerNickname).toBe('player_two');
        expect(result.state).toBe(GameState.PLAYING);
        expect(result.currentTurn).toBe(PlayerTurn.PLAYER_1);
        expect(result.result).toBeNull();
        expect(mockGameRepo.save).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar nicknames idénticos', async () => {
        await expect(useCase.execute('player_one', 'player_one'))
            .rejects.toThrow('Los jugadores deben tener nicknames distintos.');
    });

    it('debe propagar error de Nickname inválido', async () => {
        mockGetOrCreatePlayer.execute.mockReset();
        mockGetOrCreatePlayer.execute.mockRejectedValueOnce(new Error('Nickname must be at least 3 characters long.'));

        await expect(useCase.execute('ab', 'player_two'))
            .rejects.toThrow('Nickname must be at least 3 characters long.');
    });
});
