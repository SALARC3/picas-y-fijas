import { Pool, RowDataPacket } from "mysql2/promise";
import { SinglePlayerGame } from "../../domain/entities/SinglePlayerGame";
import { SinglePlayerGameRepository } from "../../application/ports/SinglePlayerGameRepository";
import { SecretProvider } from "../../../shared/application/ports/SecretProvider";
import { MySqlConnectionPool } from "../../../shared/infrastructure/output/MySqlConnectionPool";

interface GameRow extends RowDataPacket {
    id: string;
    player_id: string;
    trivia_id: string;
    created_at: Date;
    updated_at: Date;
}

export class MySqlSinglePlayerGameRepository implements SinglePlayerGameRepository {
    private readonly pool: Pool;

    private constructor(pool: Pool) {
        this.pool = pool;
    }

    static async create(secretProvider: SecretProvider): Promise<MySqlSinglePlayerGameRepository> {
        const pool = MySqlConnectionPool.getPool(secretProvider);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS single_player_games (
                id VARCHAR(36) PRIMARY KEY,
                player_id VARCHAR(36) NOT NULL,
                trivia_id VARCHAR(36) NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                FOREIGN KEY (player_id) REFERENCES players(id),
                FOREIGN KEY (trivia_id) REFERENCES trivias(id)
            )
        `);
        return new MySqlSinglePlayerGameRepository(pool);
    }

    async save(game: SinglePlayerGame): Promise<void> {
        await this.pool.execute(
            `INSERT INTO single_player_games (id, player_id, trivia_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                player_id = VALUES(player_id),
                trivia_id = VALUES(trivia_id),
                updated_at = VALUES(updated_at)`,
            [game.id, game.playerId, game.triviaId, game.createdAt, game.updatedAt]
        );
    }

    async findById(id: string): Promise<SinglePlayerGame | null> {
        const [rows] = await this.pool.execute<GameRow[]>(
            "SELECT id, player_id, trivia_id, created_at, updated_at FROM single_player_games WHERE id = ?",
            [id]
        );

        if (rows.length === 0) return null;

        const row = rows[0];
        return SinglePlayerGame.create(
            row.id,
            row.player_id,
            row.trivia_id,
            new Date(row.created_at),
            new Date(row.updated_at)
        );
    }

    async findAll(): Promise<SinglePlayerGame[]> {
        const [rows] = await this.pool.execute<GameRow[]>(
            "SELECT id, player_id, trivia_id, created_at, updated_at FROM single_player_games"
        );

        return rows.map(row => SinglePlayerGame.create(
            row.id,
            row.player_id,
            row.trivia_id,
            new Date(row.created_at),
            new Date(row.updated_at)
        ));
    }
}
