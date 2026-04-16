import { SinglePlayerGame } from '../../domain/entities/SinglePlayerGame';

export interface SinglePlayerGameRepository {
    save(game: SinglePlayerGame): Promise<void>;
    findById(id: string): Promise<SinglePlayerGame | null>;
}
