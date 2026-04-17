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

async function buildDevRepositories() {
    return {
        playerRepo: new FileSystemPlayerRepository('./data/players') as IPlayerRepository,
        triviaRepo: new FileSystemTriviaRepository('./data/trivias') as TriviaRepository,
        gameRepo: new FileSystemSinglePlayerGameRepository('./data/games') as SinglePlayerGameRepository,
    };
}

async function buildProdRepositories() {
    const secretProvider = new DotEnvSecretProvider();
    const [playerRepo, triviaRepo, gameRepo] = await Promise.all([
        MySqlPlayerRepository.create(secretProvider),
        MySqlTriviaRepository.create(secretProvider),
        MySqlSinglePlayerGameRepository.create(secretProvider),
    ]);
    return {
        playerRepo: playerRepo as IPlayerRepository,
        triviaRepo: triviaRepo as TriviaRepository,
        gameRepo: gameRepo as SinglePlayerGameRepository,
    };
}

async function main() {
    const env = process.env.ENV || 'DEV';
    const repos = env === 'PROD'
        ? await buildProdRepositories()
        : await buildDevRepositories();

    const { playerRepo, triviaRepo, gameRepo } = repos;

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

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Picas y Fijas API corriendo en http://localhost:${PORT}`);
    });
}

main().catch((err) => {
    console.error('Error al iniciar la aplicación:', err);
    process.exit(1);
});
