import * as readline from 'readline';
import { StartMultiPlayerGame } from '../../application/use-cases/StartMultiPlayerGame';
import { MakeGuessInMultiPlayerGame } from '../../application/use-cases/MakeGuessInMultiPlayerGame';
import { MultiPlayerGameDTO } from '../../application/dto/MultiPlayerGameDTO';
import { FileSystemMultiPlayerGameRepository } from '../output/FileSystemMultiPlayerGameRepository';
import { FileSystemPlayerRepository } from '../../../player/infrastructure/output/FileSystemPlayerRepository';
import { FileSystemTriviaRepository } from '../../../trivia/infrastructure/output/FileSystemTriviaRepository';
import { UuidV4IdProvider } from '../../../shared/infrastructure/output/UuidV4IdProvider';
import { SECRET_NUMBER_DIGITS } from '../../../trivia/domain/GameRules';
import { GetOrCreatePlayer } from '../../../player/application/use-cases/GetOrCreatePlayer';
import { CreateTrivia } from '../../../trivia/application/use-cases/CreateTrivia';
import { MakeGuess } from '../../../trivia/application/use-cases/MakeGuess';

class ConsoleMultiPlayerAdapter {
    private readonly rl: readline.Interface;
    private readonly startGame: StartMultiPlayerGame;
    private readonly makeGuess: MakeGuessInMultiPlayerGame;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const multiGameRepo = new FileSystemMultiPlayerGameRepository('./data/multi-games');
        const playerRepo = new FileSystemPlayerRepository('./data/players');
        const triviaRepo = new FileSystemTriviaRepository('./data/trivias');
        const idProvider = new UuidV4IdProvider();

        const getOrCreatePlayer = new GetOrCreatePlayer(playerRepo, idProvider);
        const createTrivia = new CreateTrivia(triviaRepo, idProvider);
        const makeGuessTrivia = new MakeGuess(triviaRepo);
        this.startGame = new StartMultiPlayerGame(multiGameRepo, getOrCreatePlayer, createTrivia, idProvider);
        this.makeGuess = new MakeGuessInMultiPlayerGame(multiGameRepo, playerRepo, triviaRepo, makeGuessTrivia);
    }

    async run(): Promise<void> {
        console.log('\n🆚 ============ Picas y Fijas — 2 Jugadores ============\n');

        const nickname1 = await this.ask('Nickname Jugador 1: ');
        const nickname2 = await this.ask('Nickname Jugador 2: ');

        let game: MultiPlayerGameDTO;

        try {
            game = await this.startGame.execute(nickname1, nickname2);
        } catch (error: unknown) {
            console.error(`Error al crear la partida: ${(error as Error).message}`);
            this.rl.close();
            return;
        }

        console.log('\n=========================================================');
        console.log(`  ${game.player1.playerNickname} 🆚 ${game.player2.playerNickname}`);
        console.log(`  Adivina el número secreto de ${SECRET_NUMBER_DIGITS} dígitos únicos.`);
        console.log('=========================================================\n');

        while (game.state !== 'FINISHED') {
            const currentNickname = game.currentTurnNickname;
            const guessValue = await this.ask(`🎮 ${currentNickname} — Tu intento: `);

            if (guessValue.toLowerCase() === 'salir') {
                console.log('\n👋 ¡Hasta la próxima!');
                this.rl.close();
                return;
            }

            try {
                game = await this.makeGuess.execute(game.id, guessValue);
            } catch (error: unknown) {
                console.error(`  ⚠️  ${(error as Error).message}\n`);
                continue;
            }

            // Mostrar resultado del último intento
            const isP1Turn = game.currentTurnPlayerId !== game.player1.playerId;
            const lastPlayer = isP1Turn ? game.player1 : game.player2;
            const lastGuess = lastPlayer.guesses[lastPlayer.guesses.length - 1];

            if (lastGuess) {
                console.log(`  → Picas: ${lastGuess.picas} | Fijas: ${lastGuess.fijas}`);
                console.log(`    (${lastPlayer.playerNickname}: ${lastPlayer.guesses.length} intentos)\n`);
            }
        }

        // Mostrar resultado final
        console.log('=========================================================');
        console.log(`  🏆 ¡${game.winnerNickname} GANA!`);
        console.log(`  ${game.player1.playerNickname}: ${game.player1.guesses.length} intentos`);
        console.log(`  ${game.player2.playerNickname}: ${game.player2.guesses.length} intentos`);
        console.log('=========================================================\n');

        this.rl.close();
    }

    private ask(question: string): Promise<string> {
        return new Promise(resolve => {
            this.rl.question(question, answer => resolve(answer.trim()));
        });
    }
}

const adapter = new ConsoleMultiPlayerAdapter();
adapter.run();
