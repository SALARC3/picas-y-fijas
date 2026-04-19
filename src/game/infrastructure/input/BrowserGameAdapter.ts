import { StartSinglePlayerGame } from '../../application/use-cases/StartSinglePlayerGame';
import { MakeGuessInGame } from '../../application/use-cases/MakeGuessInGame';
import { StartMultiplayerGame } from '../../application/use-cases/StartMultiplayerGame';
import { MakeMultiplayerGuess } from '../../application/use-cases/MakeMultiplayerGuess';
import { GetMultiplayerGameStatus } from '../../application/use-cases/GetMultiplayerGameStatus';
import { LocalStorageSinglePlayerGameRepository } from '../output/LocalStorageSinglePlayerGameRepository';
import { LocalStorageMultiplayerGameRepository } from '../output/LocalStorageMultiplayerGameRepository';
import { LocalStoragePlayerRepository } from '../../../player/infrastructure/output/LocalStoragePlayerRepository';
import { LocalStorageTriviaRepository } from '../../../trivia/infrastructure/output/LocalStorageTriviaRepository';
import { UuidV4IdProvider } from '../../../shared/infrastructure/output/UuidV4IdProvider';
import { SinglePlayerGameDTO } from '../../application/dto/SinglePlayerGameDTO';
import { MultiplayerGameDTO } from '../../application/dto/MultiplayerGameDTO';
import { GetOrCreatePlayer } from '../../../player/application/use-cases/GetOrCreatePlayer';
import { CreateTrivia } from '../../../trivia/application/use-cases/CreateTrivia';
import { MakeGuess } from '../../../trivia/application/use-cases/MakeGuess';

declare global {
    // eslint-disable-next-line no-var
    var PicasYFijas: {
        startGame: (nickname: string) => Promise<SinglePlayerGameDTO>;
        makeGuess: (gameId: string, guess: string) => Promise<SinglePlayerGameDTO>;
        startMultiplayerGame: (nickname1: string, nickname2: string) => Promise<MultiplayerGameDTO>;
        makeMultiplayerGuess: (gameId: string, playerId: string, guess: string) => Promise<MultiplayerGameDTO>;
        getMultiplayerGameStatus: (gameId: string) => Promise<MultiplayerGameDTO>;
    };
}

const idProvider = new UuidV4IdProvider();
const playerRepo = new LocalStoragePlayerRepository();
const triviaRepo = new LocalStorageTriviaRepository();
const gameRepo = new LocalStorageSinglePlayerGameRepository();
const multiplayerGameRepo = new LocalStorageMultiplayerGameRepository();

const getOrCreatePlayer = new GetOrCreatePlayer(playerRepo, idProvider);
const createTrivia = new CreateTrivia(triviaRepo, idProvider);
const makeGuessTrivia = new MakeGuess(triviaRepo);
const startGameUseCase = new StartSinglePlayerGame(gameRepo, getOrCreatePlayer, createTrivia, idProvider);
const makeGuessUseCase = new MakeGuessInGame(gameRepo, playerRepo, makeGuessTrivia);
const startMultiplayerGameUseCase = new StartMultiplayerGame(multiplayerGameRepo, getOrCreatePlayer, createTrivia, idProvider);
const makeMultiplayerGuessUseCase = new MakeMultiplayerGuess(multiplayerGameRepo, playerRepo, triviaRepo, makeGuessTrivia);
const getMultiplayerGameStatusUseCase = new GetMultiplayerGameStatus(multiplayerGameRepo, playerRepo, triviaRepo);

export async function startGame(nickname: string): Promise<SinglePlayerGameDTO> {
    return startGameUseCase.execute(nickname);
}

export async function makeGuess(gameId: string, guess: string): Promise<SinglePlayerGameDTO> {
    return makeGuessUseCase.execute(gameId, guess);
}

export async function startMultiplayerGame(nickname1: string, nickname2: string): Promise<MultiplayerGameDTO> {
    return startMultiplayerGameUseCase.execute(nickname1, nickname2);
}

export async function makeMultiplayerGuess(gameId: string, playerId: string, guess: string): Promise<MultiplayerGameDTO> {
    return makeMultiplayerGuessUseCase.execute(gameId, playerId, guess);
}

export async function getMultiplayerGameStatus(gameId: string): Promise<MultiplayerGameDTO> {
    return getMultiplayerGameStatusUseCase.execute(gameId);
}

globalThis.PicasYFijas = { startGame, makeGuess, startMultiplayerGame, makeMultiplayerGuess, getMultiplayerGameStatus };
