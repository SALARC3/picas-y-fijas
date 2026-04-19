import * as readline from 'readline';
import { StartMultiplayerGame } from '../../application/use-cases/StartMultiplayerGame';
import { MakeMultiplayerGuess } from '../../application/use-cases/MakeMultiplayerGuess';
import { MultiplayerGameDTO } from '../../application/dto/MultiplayerGameDTO';
import { FileSystemMultiplayerGameRepository } from '../output/FileSystemMultiplayerGameRepository';
import { FileSystemPlayerRepository } from '../../../player/infrastructure/output/FileSystemPlayerRepository';
import { FileSystemTriviaRepository } from '../../../trivia/infrastructure/output/FileSystemTriviaRepository';
import { UuidV4IdProvider } from '../../../shared/infrastructure/output/UuidV4IdProvider';
import { SECRET_NUMBER_DIGITS } from '../../../trivia/domain/GameRules';
import { GetOrCreatePlayer } from '../../../player/application/use-cases/GetOrCreatePlayer';
import { CreateTrivia } from '../../../trivia/application/use-cases/CreateTrivia';
import { MakeGuess } from '../../../trivia/application/use-cases/MakeGuess';

export class ConsoleMultiplayerAdapter {
    private readonly rl: readline.Interface;
    private readonly startGame: StartMultiplayerGame;
    private readonly makeGuess: MakeMultiplayerGuess;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const multiplayerGameRepo = new FileSystemMultiplayerGameRepository('./data/multiplayer-games');
        const playerRepo = new FileSystemPlayerRepository('./data/players');
        const triviaRepo = new FileSystemTriviaRepository('./data/trivias');
        const idProvider = new UuidV4IdProvider();

        const getOrCreatePlayer = new GetOrCreatePlayer(playerRepo, idProvider);
        const createTrivia = new CreateTrivia(triviaRepo, idProvider);
        const makeGuessTrivia = new MakeGuess(triviaRepo);
        this.startGame = new StartMultiplayerGame(multiplayerGameRepo, getOrCreatePlayer, createTrivia, idProvider);
        this.makeGuess = new MakeMultiplayerGuess(multiplayerGameRepo, playerRepo, triviaRepo, makeGuessTrivia);
    }

    async run(): Promise<void> {
        console.log('============ Picas y Fijas — Modo 2 Jugadores ============\n');

        const nickname1 = await this.ask('Nickname del Jugador 1: ');
        const nickname2 = await this.ask('Nickname del Jugador 2: ');

        let game: MultiplayerGameDTO;

        try {
            game = await this.startGame.execute(nickname1, nickname2);
        } catch (error: unknown) {
            console.error(`Error al crear la partida: ${(error as Error).message}`);
            this.rl.close();
            return;
        }

        console.log('=========================================================\n');
        console.log(`${game.player1.playerNickname} vs ${game.player2.playerNickname}\n`);
        console.log(`Cada jugador debe adivinar un número secreto de ${SECRET_NUMBER_DIGITS} dígitos únicos.\n`);
        console.log('=========================================================\n');

        while (game.state !== 'FINISHED') {
            const currentPlayer = game.currentTurn === 'PLAYER_1' ? game.player1 : game.player2;
            const currentPlayerId = currentPlayer.playerId;

            const guessValue = await this.ask(`Turno de ${currentPlayer.playerNickname}: `);

            try {
                game = await this.makeGuess.execute(game.id, currentPlayerId, guessValue);
            } catch (error: unknown) {
                console.error(`  Error: ${(error as Error).message}\n`);
                continue;
            }

            const playerAfterGuess = currentPlayerId === game.player1.playerId ? game.player1 : game.player2;
            const lastGuess = playerAfterGuess.guesses[playerAfterGuess.guesses.length - 1];
            console.log(`  Picas: ${lastGuess.picas} | Fijas: ${lastGuess.fijas}\n`);
            console.log('--------------------------------------------------------\n');
        }

        if (game.winnerNickname) {
            console.log(`¡${game.winnerNickname} gana la partida!`);
        } else {
            console.log('¡La partida terminó en empate!');
        }

        console.log(`${game.player1.playerNickname}: ${game.player1.attemptsCount} intentos | Score: ${game.player1.score ?? 'N/A'}`);
        console.log(`${game.player2.playerNickname}: ${game.player2.attemptsCount} intentos | Score: ${game.player2.score ?? 'N/A'}`);
        console.log('=========================================================\n');
        this.rl.close();
    }

    private ask(question: string): Promise<string> {
        return new Promise(resolve => {
            this.rl.question(question, answer => resolve(answer.trim()));
        });
    }
}

const adapter = new ConsoleMultiplayerAdapter();
adapter.run();
