import { Pool, RowDataPacket } from "mysql2/promise";
import { Trivia } from "../../domain/entities/Trivia";
import { TriviaRepository } from "../../application/ports/TriviaRepository";
import { SecretProvider } from "../../../shared/application/ports/SecretProvider";
import { MySqlConnectionPool } from "../../../shared/infrastructure/output/MySqlConnectionPool";
import { SecretNumber } from "../../domain/value_objects/SecretNumber";
import { Guess } from "../../domain/value_objects/Guess";
import { GuessResult } from "../../domain/value_objects/GuessResult";

interface TriviaRow extends RowDataPacket {
    id: string;
    secret_number: string;
    score: number | null;
    created_at: Date;
    updated_at: Date;
}

interface GuessRow extends RowDataPacket {
    guess_value: string;
    picas: number;
    fijas: number;
}

export class MySqlTriviaRepository implements TriviaRepository {
    private readonly pool: Pool;

    private constructor(pool: Pool) {
        this.pool = pool;
    }

    static async create(secretProvider: SecretProvider): Promise<MySqlTriviaRepository> {
        const pool = MySqlConnectionPool.getPool(secretProvider);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS trivias (
                id VARCHAR(36) PRIMARY KEY,
                secret_number VARCHAR(4) NOT NULL,
                score INT DEFAULT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            )
        `);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS trivia_guesses (
                trivia_id VARCHAR(36) NOT NULL,
                guess_order INT NOT NULL,
                guess_value VARCHAR(4) NOT NULL,
                picas INT NOT NULL,
                fijas INT NOT NULL,
                PRIMARY KEY (trivia_id, guess_order),
                FOREIGN KEY (trivia_id) REFERENCES trivias(id)
            )
        `);
        return new MySqlTriviaRepository(pool);
    }

    async save(trivia: Trivia): Promise<void> {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute(
                `INSERT INTO trivias (id, secret_number, score, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    score = VALUES(score),
                    updated_at = VALUES(updated_at)`,
                [trivia.getId(), trivia.getSecretNumber().getValue(), trivia.getScore(), trivia.getCreatedAt(), trivia.getUpdatedAt()]
            );

            await connection.execute(
                "DELETE FROM trivia_guesses WHERE trivia_id = ?",
                [trivia.getId()]
            );

            const guesses = trivia.getGuesses();
            for (let i = 0; i < guesses.length; i++) {
                const g = guesses[i];
                await connection.execute(
                    `INSERT INTO trivia_guesses (trivia_id, guess_order, guess_value, picas, fijas)
                     VALUES (?, ?, ?, ?, ?)`,
                    [trivia.getId(), i, g.guess.value, g.picas, g.fijas]
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async findById(id: string): Promise<Trivia | null> {
        const [triviaRows] = await this.pool.execute<TriviaRow[]>(
            "SELECT id, secret_number, score, created_at, updated_at FROM trivias WHERE id = ?",
            [id]
        );

        if (triviaRows.length === 0) return null;

        const row = triviaRows[0];

        const [guessRows] = await this.pool.execute<GuessRow[]>(
            "SELECT guess_value, picas, fijas FROM trivia_guesses WHERE trivia_id = ? ORDER BY guess_order ASC",
            [id]
        );

        const guesses = guessRows.map(
            (g) => new GuessResult(new Guess(g.guess_value), g.picas, g.fijas)
        );

        return new Trivia(
            row.id,
            new SecretNumber(row.secret_number),
            guesses,
            new Date(row.created_at),
            new Date(row.updated_at),
            row.score
        );
    }
}
