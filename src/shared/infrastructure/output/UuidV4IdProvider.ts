import { v4 as uuidv4 } from "uuid";
import { IdProvider } from "../../application/ports/IdProvider";

export class UuidV4IdProvider implements IdProvider {
    generate(): string {
        return uuidv4();
    }
}
