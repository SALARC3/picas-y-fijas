import fs from "fs";
import path from "path";
import { Player } from "../../domain/entities/Player";
import { Nickname } from "../../domain/value_objects/Nickname";
import { IPlayerRepository } from "../../application/ports/IPlayerRepository";

interface StoredPlayer {
    id: string;
    nickname: string;
    createdAt: string;
    updatedAt: string;
}

export class FileSystemPlayerRepository implements IPlayerRepository {
    constructor(private readonly folderPath: string) {
        if (!fs.existsSync(this.folderPath)) {
            fs.mkdirSync(this.folderPath, { recursive: true });
        }
    }

    async save(player: Player): Promise<void> {
        const filePath = this.getFilePath(player.id);
        const data = this.serialize(player);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    }

    async findById(id: string): Promise<Player | null> {
        const filePath = this.getFilePath(id);
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, "utf-8");
        return this.deserialize(JSON.parse(raw));
    }

    async findByNickname(nickname: Nickname): Promise<Player | null> {
        const files = fs.readdirSync(this.folderPath).filter(f => f.endsWith(".json"));
        for (const file of files) {
            const raw = fs.readFileSync(path.join(this.folderPath, file), "utf-8");
            const stored: StoredPlayer = JSON.parse(raw);
            if (stored.nickname === nickname.value) {
                return this.deserialize(stored);
            }
        }
        return null;
    }

    private getFilePath(id: string): string {
        return path.join(this.folderPath, `${id}.json`);
    }

    private serialize(player: Player): StoredPlayer {
        return {
            id: player.id,
            nickname: player.nickname.value,
            createdAt: player.createdAt.toISOString(),
            updatedAt: player.updatedAt.toISOString(),
        };
    }

    private deserialize(stored: StoredPlayer): Player {
        return Player.create(stored.id, new Nickname(stored.nickname), new Date(stored.createdAt), new Date(stored.updatedAt));
    }
}
