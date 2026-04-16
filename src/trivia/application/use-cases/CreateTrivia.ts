import { Trivia } from "../../domain/entities/Trivia";
import { SecretNumber } from "../../domain/value_objects/SecretNumber";
import { TriviaDTO } from "../dto/TriviaDTO";
import { IdProvider } from "../../../shared/application/ports/IdProvider";
import { TriviaRepository } from "../ports/TriviaRepository";

export class CreateTrivia {
    constructor(
        private readonly triviaRepository: TriviaRepository,
        private readonly idGenerator: IdProvider,
    ) {}

    async execute(secretNumber?: SecretNumber): Promise<TriviaDTO> {
        const id = this.idGenerator.generate();
        const trivia = new Trivia(id, secretNumber ?? SecretNumber.generate());

        await this.triviaRepository.save(trivia);

        return {
            id: trivia.getId(),
            guesses: [],
            finished: false,
            createdAt: trivia.getCreatedAt().toISOString(),
            updatedAt: trivia.getUpdatedAt().toISOString(),
        };
    }
}
