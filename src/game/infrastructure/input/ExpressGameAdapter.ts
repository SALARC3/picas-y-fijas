import express, { Request, Response } from 'express';
import { StartSinglePlayerGame } from '../../application/use-cases/StartSinglePlayerGame';
import { MakeGuessInGame } from '../../application/use-cases/MakeGuessInGame';
import { GetGameStatus } from '../../application/use-cases/GetGameStatus';
import { FileSystemSinglePlayerGameRepository } from '../output/FileSystemSinglePlayerGameRepository';
import { FileSystemPlayerRepository } from '../../../player/infrastructure/output/FileSystemPlayerRepository';
import { FileSystemTriviaRepository } from '../../../trivia/infrastructure/output/FileSystemTriviaRepository';
import { UuidV4IdProvider } from '../../../shared/infrastructure/output/UuidV4IdProvider';
import { GetOrCreatePlayer } from '../../../player/application/use-cases/GetOrCreatePlayer';
import { CreateTrivia } from '../../../trivia/application/use-cases/CreateTrivia';

const app = express();
app.use(express.json());

const idProvider = new UuidV4IdProvider();
const playerRepo = new FileSystemPlayerRepository('./data/players');
const triviaRepo = new FileSystemTriviaRepository('./data/trivias');
const gameRepo = new FileSystemSinglePlayerGameRepository('./data/games');

const getOrCreatePlayer = new GetOrCreatePlayer(playerRepo, idProvider);
const createTrivia = new CreateTrivia(triviaRepo, idProvider);
const startGame = new StartSinglePlayerGame(gameRepo, getOrCreatePlayer, createTrivia, idProvider);
const makeGuess = new MakeGuessInGame(gameRepo, triviaRepo);
const getGameStatus = new GetGameStatus(gameRepo);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Picas y Fijas API corriendo en http://localhost:${PORT}`);
});
