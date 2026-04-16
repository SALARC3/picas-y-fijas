import { Player } from "../../domain/entities/Player";
import { Nickname } from "../../domain/value_objects/Nickname";
import { IPlayerRepository } from "../../application/ports/IPlayerRepository";

interface StoredPlayer {
    id: string;
    nickname: string;
    createdAt: string;
    updatedAt: string;
}

export class LocalStoragePlayerRepository implements IPlayerRepository {
    private readonly storageKey = "players";

    async save(player: Player): Promise<void> {
        const entries = this.loadAll();
        entries.set(player.id, this.serialize(player));
        localStorage.setItem(this.storageKey, JSON.stringify([...entries.entries()]));
    }

    async findById(id: string): Promise<Player | null> {
        const entries = this.loadAll();
        const stored = entries.get(id);
        if (!stored) return null;
        return this.deserialize(stored);
    }

    async findByNickname(nickname: Nickname): Promise<Player | null> {
        const entries = this.loadAll();
        for (const stored of entries.values()) {
            if (stored.nickname === nickname.value) {
                return this.deserialize(stored);
            }
        }
        return null;
    }

    private loadAll(): Map<string, StoredPlayer> {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return new Map();
        return new Map(JSON.parse(raw));
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
