import { Pool, RowDataPacket } from 'mysql2/promise';
import { MultiplayerGame } from '../../domain/entities/MultiplayerGame';
import { MultiplayerGameRepository } from '../../application/ports/MultiplayerGameRepository';
import { SecretProvider } from '../../../shared/application/ports/SecretProvider';
import { MySqlConnectionPool } from '../../../shared/infrastructure/output/MySqlConnectionPool';
import { PlayerTurn } from '../../domain/value_objects/PlayerTurn';
import { GameState } from '../../domain/value_objects/GameState';
import { MultiplayerResult } from '../../domain/value_objects/MultiplayerResult';

interface MultiplayerGameRow extends RowDataPacket {
    id: string;
    player1_id: string;
    player2_id: string;
    trivia1_id: string;
    trivia2_id: string;
    current_turn: string;
    state: string;
    result: string | null;
    waiting_for_equalizer: number;
    created_at: Date;
    updated_at: Date;
}

export class MySqlMultiplayerGameRepository implements MultiplayerGameRepository {
    private readonly pool: Pool;

    private constructor(pool: Pool) {
        this.pool = pool;
    }

    static async create(secretProvider: SecretProvider): Promise<MySqlMultiplayerGameRepository> {
        const pool = MySqlConnectionPool.getPool(secretProvider);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS multiplayer_games (
                id VARCHAR(36) PRIMARY KEY,
                player1_id VARCHAR(36) NOT NULL,
                player2_id VARCHAR(36) NOT NULL,
                trivia1_id VARCHAR(36) NOT NULL,
                trivia2_id VARCHAR(36) NOT NULL,
                current_turn VARCHAR(10) NOT NULL DEFAULT 'PLAYER_1',
                state VARCHAR(10) NOT NULL DEFAULT 'PLAYING',
                result VARCHAR(15) NULL,
                waiting_for_equalizer BOOLEAN NOT NULL DEFAULT FALSE,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                FOREIGN KEY (player1_id) REFERENCES players(id),
                FOREIGN KEY (player2_id) REFERENCES players(id),
                FOREIGN KEY (trivia1_id) REFERENCES trivias(id),
                FOREIGN KEY (trivia2_id) REFERENCES trivias(id)
            )
        `);
        return new MySqlMultiplayerGameRepository(pool);
    }

    async save(game: MultiplayerGame): Promise<void> {
        await this.pool.execute(
            `INSERT INTO multiplayer_games (id, player1_id, player2_id, trivia1_id, trivia2_id, current_turn, state, result, waiting_for_equalizer, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                current_turn = VALUES(current_turn),
                state = VALUES(state),
                result = VALUES(result),
                waiting_for_equalizer = VALUES(waiting_for_equalizer),
                updated_at = VALUES(updated_at)`,
            [
                game.id, game.player1Id, game.player2Id,
                game.trivia1Id, game.trivia2Id,
                game.currentTurn, game.state, game.result,
                game.waitingForEqualizer ? 1 : 0,
                game.createdAt, game.updatedAt,
            ],
        );
    }

    async findById(id: string): Promise<MultiplayerGame | null> {
        const [rows] = await this.pool.execute<MultiplayerGameRow[]>(
            `SELECT id, player1_id, player2_id, trivia1_id, trivia2_id, current_turn, state, result, waiting_for_equalizer, created_at, updated_at
             FROM multiplayer_games WHERE id = ?`,
            [id],
        );

        if (rows.length === 0) return null;
        return this.toEntity(rows[0]);
    }

    async findAll(): Promise<MultiplayerGame[]> {
        const [rows] = await this.pool.execute<MultiplayerGameRow[]>(
            `SELECT id, player1_id, player2_id, trivia1_id, trivia2_id, current_turn, state, result, waiting_for_equalizer, created_at, updated_at
             FROM multiplayer_games`,
        );
        return rows.map(row => this.toEntity(row));
    }

    private toEntity(row: MultiplayerGameRow): MultiplayerGame {
        return MultiplayerGame.restore(
            row.id,
            row.player1_id,
            row.player2_id,
            row.trivia1_id,
            row.trivia2_id,
            row.current_turn as PlayerTurn,
            row.state as GameState,
            row.result as MultiplayerResult | null,
            Boolean(row.waiting_for_equalizer),
            new Date(row.created_at),
            new Date(row.updated_at),
        );
    }
}
