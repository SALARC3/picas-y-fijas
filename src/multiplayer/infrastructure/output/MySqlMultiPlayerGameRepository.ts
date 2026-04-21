import { Pool, RowDataPacket } from 'mysql2/promise';
import { MultiPlayerGame } from '../../domain/entities/MultiPlayerGame';
import { PlayerSession } from '../../domain/entities/PlayerSession';
import { MultiPlayerGameState } from '../../domain/value_objects/MultiPlayerGameState';
import { MultiPlayerGameRepository } from '../../application/ports/MultiPlayerGameRepository';
import { SecretProvider } from '../../../shared/application/ports/SecretProvider';
import { MySqlConnectionPool } from '../../../shared/infrastructure/output/MySqlConnectionPool';

interface GameRow extends RowDataPacket {
    id: string;
    host_player_id: string;
    secret_number_value: string;
    max_players: number;
    state: string;
    winner_id: string | null;
    created_at: Date;
    updated_at: Date;
}

interface SessionRow extends RowDataPacket {
    player_id: string;
    trivia_id: string;
    joined_at: Date;
}

export class MySqlMultiPlayerGameRepository implements MultiPlayerGameRepository {
    private readonly pool: Pool;

    private constructor(pool: Pool) {
        this.pool = pool;
    }

    static async create(secretProvider: SecretProvider): Promise<MySqlMultiPlayerGameRepository> {
        const pool = MySqlConnectionPool.getPool(secretProvider);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS multi_player_games (
                id VARCHAR(36) PRIMARY KEY,
                host_player_id VARCHAR(36) NOT NULL,
                secret_number_value VARCHAR(4) NOT NULL,
                max_players INT NOT NULL,
                state VARCHAR(20) NOT NULL,
                winner_id VARCHAR(36) DEFAULT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                FOREIGN KEY (host_player_id) REFERENCES players(id)
            )
        `);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS multi_player_sessions (
                game_id VARCHAR(36) NOT NULL,
                player_id VARCHAR(36) NOT NULL,
                trivia_id VARCHAR(36) NOT NULL,
                joined_at DATETIME NOT NULL,
                PRIMARY KEY (game_id, player_id),
                FOREIGN KEY (game_id) REFERENCES multi_player_games(id),
                FOREIGN KEY (player_id) REFERENCES players(id),
                FOREIGN KEY (trivia_id) REFERENCES trivias(id)
            )
        `);
        return new MySqlMultiPlayerGameRepository(pool);
    }

    async save(game: MultiPlayerGame): Promise<void> {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute(
                `INSERT INTO multi_player_games (id, host_player_id, secret_number_value, max_players, state, winner_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    state = VALUES(state),
                    winner_id = VALUES(winner_id),
                    updated_at = VALUES(updated_at)`,
                [game.id, game.hostPlayerId, game.getSecretNumberValue(), game.maxPlayers, game.getState(), game.getWinnerId(), game.createdAt, game.updatedAt]
            );

            await connection.execute('DELETE FROM multi_player_sessions WHERE game_id = ?', [game.id]);

            for (const session of game.getSessions()) {
                await connection.execute(
                    `INSERT INTO multi_player_sessions (game_id, player_id, trivia_id, joined_at) VALUES (?, ?, ?, ?)`,
                    [game.id, session.playerId, session.triviaId, session.joinedAt]
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

    async findById(id: string): Promise<MultiPlayerGame | null> {
        const [gameRows] = await this.pool.execute<GameRow[]>(
            'SELECT * FROM multi_player_games WHERE id = ?', [id]
        );
        if (gameRows.length === 0) return null;

        const row = gameRows[0];
        const [sessionRows] = await this.pool.execute<SessionRow[]>(
            'SELECT player_id, trivia_id, joined_at FROM multi_player_sessions WHERE game_id = ? ORDER BY joined_at ASC', [id]
        );

        const sessions = sessionRows.map(s =>
            PlayerSession.create(s.player_id, s.trivia_id, new Date(s.joined_at))
        );

        return MultiPlayerGame.create(
            row.id, row.host_player_id, row.secret_number_value, row.max_players,
            sessions, row.state as MultiPlayerGameState, row.winner_id,
            new Date(row.created_at), new Date(row.updated_at),
        );
    }

    async findAll(): Promise<MultiPlayerGame[]> {
        const [gameRows] = await this.pool.execute<GameRow[]>('SELECT * FROM multi_player_games');
        const games: MultiPlayerGame[] = [];

        for (const row of gameRows) {
            const [sessionRows] = await this.pool.execute<SessionRow[]>(
                'SELECT player_id, trivia_id, joined_at FROM multi_player_sessions WHERE game_id = ? ORDER BY joined_at ASC',
                [row.id]
            );
            const sessions = sessionRows.map(s =>
                PlayerSession.create(s.player_id, s.trivia_id, new Date(s.joined_at))
            );
            games.push(MultiPlayerGame.create(
                row.id, row.host_player_id, row.secret_number_value, row.max_players,
                sessions, row.state as MultiPlayerGameState, row.winner_id,
                new Date(row.created_at), new Date(row.updated_at),
            ));
        }

        return games;
    }
}
