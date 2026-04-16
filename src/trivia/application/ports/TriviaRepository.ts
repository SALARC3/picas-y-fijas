import { Trivia } from "../../domain/entities/Trivia";

export interface TriviaRepository {
    save(trivia: Trivia): Promise<void>;
    findById(id: string): Promise<Trivia | null>;
}
