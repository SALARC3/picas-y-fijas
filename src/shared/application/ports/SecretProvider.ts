export interface SecretProvider {
    get(key: string): string;
}
