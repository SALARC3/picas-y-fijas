import express, { Request, Response } from 'express';
import cors from 'cors';
import { StartSinglePlayerGame } from '../../application/use-cases/StartSinglePlayerGame';
import { MakeGuessInGame } from '../../application/use-cases/MakeGuessInGame';
import { GetGameStatus } from '../../application/use-cases/GetGameStatus';
import { SinglePlayerGameRepository } from '../../application/ports/SinglePlayerGameRepository';
import { IPlayerRepository } from '../../../player/application/ports/IPlayerRepository';
import { TriviaRepository } from '../../../trivia/application/ports/TriviaRepository';
import { FileSystemSinglePlayerGameRepository } from '../output/FileSystemSinglePlayerGameRepository';
import { FileSystemPlayerRepository } from '../../../player/infrastructure/output/FileSystemPlayerRepository';
import { FileSystemTriviaRepository } from '../../../trivia/infrastructure/output/FileSystemTriviaRepository';
import { MySqlSinglePlayerGameRepository } from '../output/MySqlSinglePlayerGameRepository';
import { MySqlPlayerRepository } from '../../../player/infrastructure/output/MySqlPlayerRepository';
import { MySqlTriviaRepository } from '../../../trivia/infrastructure/output/MySqlTriviaRepository';
import { DotEnvSecretProvider } from '../../../shared/infrastructure/output/DotEnvSecretProvider';
import { UuidV4IdProvider } from '../../../shared/infrastructure/output/UuidV4IdProvider';
import { GetOrCreatePlayer } from '../../../player/application/use-cases/GetOrCreatePlayer';
import { CreateTrivia } from '../../../trivia/application/use-cases/CreateTrivia';
import { MakeGuess } from '../../../trivia/application/use-cases/MakeGuess';
import { GetSinglePlayerRanking } from '../../application/use-cases/GetSinglePlayerRanking';
import { StartMultiplayerGame } from '../../application/use-cases/StartMultiplayerGame';
import { MakeMultiplayerGuess } from '../../application/use-cases/MakeMultiplayerGuess';
import { GetMultiplayerGameStatus } from '../../application/use-cases/GetMultiplayerGameStatus';
import { FileSystemMultiplayerGameRepository } from '../output/FileSystemMultiplayerGameRepository';
import { MySqlMultiplayerGameRepository } from '../output/MySqlMultiplayerGameRepository';
import { MultiplayerGameRepository } from '../../application/ports/MultiplayerGameRepository';

async function buildDevRepositories() {
    return {
        playerRepo: new FileSystemPlayerRepository('./data/players') as IPlayerRepository,
        triviaRepo: new FileSystemTriviaRepository('./data/trivias') as TriviaRepository,
        gameRepo: new FileSystemSinglePlayerGameRepository('./data/games') as SinglePlayerGameRepository,
        multiplayerGameRepo: new FileSystemMultiplayerGameRepository('./data/multiplayer-games') as MultiplayerGameRepository,
    };
}

async function buildProdRepositories() {
    const secretProvider = new DotEnvSecretProvider();
    const [playerRepo, triviaRepo, gameRepo, multiplayerGameRepo] = await Promise.all([
        MySqlPlayerRepository.create(secretProvider),
        MySqlTriviaRepository.create(secretProvider),
        MySqlSinglePlayerGameRepository.create(secretProvider),
        MySqlMultiplayerGameRepository.create(secretProvider),
    ]);
    return {
        playerRepo: playerRepo as IPlayerRepository,
        triviaRepo: triviaRepo as TriviaRepository,
        gameRepo: gameRepo as SinglePlayerGameRepository,
        multiplayerGameRepo: multiplayerGameRepo as MultiplayerGameRepository,
    };
}

async function main() {
    const env = process.env.ENV || 'DEV';
    const repos = env === 'PROD'
        ? await buildProdRepositories()
        : await buildDevRepositories();

    const { playerRepo, triviaRepo, gameRepo, multiplayerGameRepo } = repos;

    const app = express();
    app.use(cors());
    app.use(express.json());

    const idProvider = new UuidV4IdProvider();

    const getOrCreatePlayer = new GetOrCreatePlayer(playerRepo, idProvider);
    const createTrivia = new CreateTrivia(triviaRepo, idProvider);
    const makeGuessTrivia = new MakeGuess(triviaRepo);
    const startGame = new StartSinglePlayerGame(gameRepo, getOrCreatePlayer, createTrivia, idProvider);
    const makeGuess = new MakeGuessInGame(gameRepo, playerRepo, makeGuessTrivia);
    const getGameStatus = new GetGameStatus(gameRepo, playerRepo, triviaRepo);
    const getSinglePlayerRanking = new GetSinglePlayerRanking(gameRepo, playerRepo, triviaRepo);

    const startMultiplayerGame = new StartMultiplayerGame(multiplayerGameRepo, getOrCreatePlayer, createTrivia, idProvider);
    const makeMultiplayerGuess = new MakeMultiplayerGuess(multiplayerGameRepo, playerRepo, triviaRepo, makeGuessTrivia);
    const getMultiplayerGameStatus = new GetMultiplayerGameStatus(multiplayerGameRepo, playerRepo, triviaRepo);

    console.log(`Modo: ${env} (${env === 'PROD' ? 'MySQL' : 'FileSystem'})`);

    app.post('/games', async (req: Request, res: Response) => {
        try {
            const { nickname } = req.body;
            if (!nickname || typeof nickname !== 'string') {
                res.status(400).json({ error: 'El campo "nickname" es requerido.' });
                return;
            }
            const game = await startGame.execute(nickname);
            res.status(201).json(game);
        } catch (error: unknown) {
            res.status(400).json({ error: (error as Error).message });
        }
    });

    app.post('/games/:gameId/guesses', async (req: Request<{ gameId: string }>, res: Response) => {
        try {
            const { gameId } = req.params;
            const { guess } = req.body;
            if (!guess || typeof guess !== 'string') {
                res.status(400).json({ error: 'El campo "guess" es requerido.' });
                return;
            }
            const game = await makeGuess.execute(gameId, guess);
            res.status(200).json(game);
        } catch (error: unknown) {
            const message = (error as Error).message;
            const status = message.includes('no encontrado') ? 404 : 400;
            res.status(status).json({ error: message });
        }
    });

    app.get('/games/:gameId', async (req: Request<{ gameId: string }>, res: Response) => {
        try {
            const { gameId } = req.params;
            const game = await getGameStatus.execute(gameId);
            res.status(200).json(game);
        } catch (error: unknown) {
            const message = (error as Error).message;
            const status = message.includes('no encontrado') ? 404 : 500;
            res.status(status).json({ error: message });
        }
    });

    app.get('/ranking', async (_req: Request, res: Response) => {
        try {
            const ranking = await getSinglePlayerRanking.execute();
            res.status(200).json(ranking);
        } catch (error: unknown) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    // ==================== MULTIPLAYER ROUTES ====================

    app.post('/multiplayer/games', async (req: Request, res: Response) => {
        try {
            const { nickname1, nickname2 } = req.body;
            if (!nickname1 || typeof nickname1 !== 'string' || !nickname2 || typeof nickname2 !== 'string') {
                res.status(400).json({ error: 'Los campos "nickname1" y "nickname2" son requeridos.' });
                return;
            }
            const game = await startMultiplayerGame.execute(nickname1, nickname2);
            res.status(201).json(game);
        } catch (error: unknown) {
            res.status(400).json({ error: (error as Error).message });
        }
    });

    app.post('/multiplayer/games/:gameId/guesses', async (req: Request<{ gameId: string }>, res: Response) => {
        try {
            const { gameId } = req.params;
            const { playerId, guess } = req.body;
            if (!playerId || typeof playerId !== 'string' || !guess || typeof guess !== 'string') {
                res.status(400).json({ error: 'Los campos "playerId" y "guess" son requeridos.' });
                return;
            }
            const game = await makeMultiplayerGuess.execute(gameId, playerId, guess);
            res.status(200).json(game);
        } catch (error: unknown) {
            const message = (error as Error).message;
            const status = message.includes('no encontrado') ? 404 : 400;
            res.status(status).json({ error: message });
        }
    });

    app.get('/multiplayer/games/:gameId', async (req: Request<{ gameId: string }>, res: Response) => {
        try {
            const { gameId } = req.params;
            const game = await getMultiplayerGameStatus.execute(gameId);
            res.status(200).json(game);
        } catch (error: unknown) {
            const message = (error as Error).message;
            const status = message.includes('no encontrado') ? 404 : 500;
            res.status(status).json({ error: message });
        }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Picas y Fijas API corriendo en http://localhost:${PORT}`);
    });
}

main().catch((err) => {
    console.error('Error al iniciar la aplicación:', err);
    process.exit(1);
});
