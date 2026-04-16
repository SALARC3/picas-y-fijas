import { StartSinglePlayerGame } from '../../application/use-cases/StartSinglePlayerGame';
import { MakeGuessInGame } from '../../application/use-cases/MakeGuessInGame';
import { LocalStorageSinglePlayerGameRepository } from '../output/LocalStorageSinglePlayerGameRepository';
import { LocalStoragePlayerRepository } from '../../../player/infrastructure/output/LocalStoragePlayerRepository';
import { LocalStorageTriviaRepository } from '../../../trivia/infrastructure/output/LocalStorageTriviaRepository';
import { UuidV4IdProvider } from '../../../shared/infrastructure/output/UuidV4IdProvider';
import { SinglePlayerGameDTO } from '../../application/dto/SinglePlayerGameDTO';

declare global {
    // eslint-disable-next-line no-var
    var PicasYFijas: {
        startGame: (nickname: string) => Promise<SinglePlayerGameDTO>;
        makeGuess: (gameId: string, guess: string) => Promise<SinglePlayerGameDTO>;
    };
}

const idProvider = new UuidV4IdProvider();
const playerRepo = new LocalStoragePlayerRepository();
const triviaRepo = new LocalStorageTriviaRepository();
const gameRepo = new LocalStorageSinglePlayerGameRepository();

const startGameUseCase = new StartSinglePlayerGame(gameRepo, playerRepo, triviaRepo, idProvider);
const makeGuessUseCase = new MakeGuessInGame(gameRepo, triviaRepo);

export async function startGame(nickname: string): Promise<SinglePlayerGameDTO> {
    return startGameUseCase.execute(nickname);
}

export async function makeGuess(gameId: string, guess: string): Promise<SinglePlayerGameDTO> {
    return makeGuessUseCase.execute(gameId, guess);
}

globalThis.PicasYFijas = { startGame, makeGuess };
