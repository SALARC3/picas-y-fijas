import { Pool, RowDataPacket } from "mysql2/promise";
import { Player } from "../../domain/entities/Player";
import { Nickname } from "../../domain/value_objects/Nickname";
import { IPlayerRepository } from "../../application/ports/IPlayerRepository";
import { SecretProvider } from "../../../shared/application/ports/SecretProvider";
import { MySqlConnectionPool } from "../../../shared/infrastructure/output/MySqlConnectionPool";

interface PlayerRow extends RowDataPacket {
    id: string;
    nickname: string;
    created_at: Date;
    updated_at: Date;
}

export class MySqlPlayerRepository implements IPlayerRepository {
    private readonly pool: Pool;

    private constructor(pool: Pool) {
        this.pool = pool;
    }

    static async create(secretProvider: SecretProvider): Promise<MySqlPlayerRepository> {
        const pool = MySqlConnectionPool.getPool(secretProvider);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS players (
                id VARCHAR(36) PRIMARY KEY,
                nickname VARCHAR(20) UNIQUE NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            )
        `);
        return new MySqlPlayerRepository(pool);
    }

    async save(player: Player): Promise<void> {
        await this.pool.execute(
            `INSERT INTO players (id, nickname, created_at, updated_at)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                nickname = VALUES(nickname),
                updated_at = VALUES(updated_at)`,
            [player.id, player.nickname.value, player.createdAt, player.updatedAt]
        );
    }

    async findById(id: string): Promise<Player | null> {
        const [rows] = await this.pool.execute<PlayerRow[]>(
            "SELECT id, nickname, created_at, updated_at FROM players WHERE id = ?",
            [id]
        );

        if (rows.length === 0) return null;

        return this.toPlayer(rows[0]);
    }

    async findByNickname(nickname: Nickname): Promise<Player | null> {
        const [rows] = await this.pool.execute<PlayerRow[]>(
            "SELECT id, nickname, created_at, updated_at FROM players WHERE nickname = ?",
            [nickname.value]
        );

        if (rows.length === 0) return null;

        return this.toPlayer(rows[0]);
    }

    private toPlayer(row: PlayerRow): Player {
        return Player.create(
            row.id,
            new Nickname(row.nickname),
            new Date(row.created_at),
            new Date(row.updated_at)
        );
    }
}
