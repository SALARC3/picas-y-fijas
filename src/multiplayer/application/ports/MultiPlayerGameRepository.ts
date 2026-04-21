import { MultiPlayerGame } from '../../domain/entities/MultiPlayerGame';

export interface MultiPlayerGameRepository {
    save(game: MultiPlayerGame): Promise<void>;
    findById(id: string): Promise<MultiPlayerGame | null>;
    findAll(): Promise<MultiPlayerGame[]>;
}
