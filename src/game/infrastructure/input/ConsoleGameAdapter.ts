import * as readline from 'readline';
import { StartSinglePlayerGame } from '../../application/use-cases/StartSinglePlayerGame';
import { MakeGuessInGame } from '../../application/use-cases/MakeGuessInGame';
import { SinglePlayerGameDTO } from '../../application/dto/SinglePlayerGameDTO';
import { FileSystemSinglePlayerGameRepository } from '../output/FileSystemSinglePlayerGameRepository';
import { FileSystemPlayerRepository } from '../../../player/infrastructure/output/FileSystemPlayerRepository';
import { FileSystemTriviaRepository } from '../../../trivia/infrastructure/output/FileSystemTriviaRepository';
import { UuidV4IdProvider } from '../../../shared/infrastructure/output/UuidV4IdProvider';
import { SECRET_NUMBER_DIGITS } from '../../../trivia/domain/GameRules';
import { GetOrCreatePlayer } from '../../../player/application/use-cases/GetOrCreatePlayer';
import { CreateTrivia } from '../../../trivia/application/use-cases/CreateTrivia';

export class ConsoleGameAdapter {
    private readonly rl: readline.Interface;
    private readonly startGame: StartSinglePlayerGame;
    private readonly makeGuess: MakeGuessInGame;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

    
        const gameRepo = new FileSystemSinglePlayerGameRepository('./data/games');
        const playerRepo = new FileSystemPlayerRepository('./data/players');
        const triviaRepo = new FileSystemTriviaRepository('./data/trivias');
        const idProvider = new UuidV4IdProvider();

        const getOrCreatePlayer = new GetOrCreatePlayer(playerRepo, idProvider);
        const createTrivia = new CreateTrivia(triviaRepo, idProvider);
        this.startGame = new StartSinglePlayerGame(gameRepo, getOrCreatePlayer, createTrivia, idProvider);
        this.makeGuess = new MakeGuessInGame(gameRepo, triviaRepo);
    }

    async run(): Promise<void> {
        console.log('===================== Picas y Fijas =====================\n');

        const nickname = await this.ask('Ingresa tu nickname: ');
        let game: SinglePlayerGameDTO;

        try {
            game = await this.startGame.execute(nickname);
        } catch (error: unknown) {
            console.error(`Error al crear el juego: ${(error as Error).message}`);
            this.rl.close();
            return;
        }
        console.log("=========================================================\n");
        console.log(`Bienvenido, ${game.playerNickname}!\n`);
        console.log(`Adivina el número secreto de ${SECRET_NUMBER_DIGITS} dígitos únicos.\n`);
        console.log("=========================================================\n");

        while (game.state !== 'FINISHED') {
            const guessValue = await this.ask('Tu intento: ');

            try {
                game = await this.makeGuess.execute(game.id, guessValue);
            } catch (error: unknown) {
                console.error(`  Error: ${(error as Error).message}\n`);
                continue;
            }

            const lastGuess = game.guesses[game.guesses.length - 1];
            console.log(`  Picas: ${lastGuess.picas} | Fijas: ${lastGuess.fijas}\n`);
            console.log("--------------------------------------------------------\n");
        }
        
        console.log(`Felicidades, ${game.playerNickname}! Adivinaste en ${game.guesses.length} intentos.`);
        console.log("=========================================================\n");
        this.rl.close();
    }

    private ask(question: string): Promise<string> {
        return new Promise(resolve => {
            this.rl.question(question, answer => resolve(answer.trim()));
        });
    }
}

const adapter = new ConsoleGameAdapter();
adapter.run();
