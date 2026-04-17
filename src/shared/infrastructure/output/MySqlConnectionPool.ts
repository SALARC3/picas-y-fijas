import mysql, { Pool } from "mysql2/promise";
import { SecretProvider } from "../../application/ports/SecretProvider";

export class MySqlConnectionPool {
    private static pool: Pool | null = null;

    static getPool(secretProvider: SecretProvider): Pool {
        if (!this.pool) {
            this.pool = mysql.createPool({
                host: secretProvider.get("MYSQL_HOST"),
                port: Number(secretProvider.get("MYSQL_PORT")),
                user: secretProvider.get("MYSQL_USER"),
                password: secretProvider.get("MYSQL_PASSWORD"),
                database: secretProvider.get("MYSQL_DATABASE"),
                waitForConnections: true,
                connectionLimit: 10,
            });
        }
        return this.pool;
    }

    static async closePool(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}
