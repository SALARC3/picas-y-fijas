import { MultiplayerGame } from '../../domain/entities/MultiplayerGame';

export interface MultiplayerGameRepository {
    save(game: MultiplayerGame): Promise<void>;
    findById(id: string): Promise<MultiplayerGame | null>;
    findAll(): Promise<MultiplayerGame[]>;
}
