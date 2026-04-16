import * as fs from "fs";
import * as path from "path";
import { SecretProvider } from "../../application/ports/SecretProvider";

export class DotEnvSecretProvider implements SecretProvider {
    private readonly secrets: Map<string, string>;

    constructor(envFilePath?: string) {
        const filePath = envFilePath ?? path.resolve(process.cwd(), ".env");
        this.secrets = this.parseEnvFile(filePath);
    }

    get(key: string): string {
        const value = this.secrets.get(key);
        if (value === undefined) {
            throw new Error(`Secret not found: ${key}`);
        }
        return value;
    }

    private parseEnvFile(filePath: string): Map<string, string> {
        const secrets = new Map<string, string>();

        if (!fs.existsSync(filePath)) {
            throw new Error(`Env file not found: ${filePath}`);
        }

        const content = fs.readFileSync(filePath, "utf-8");

        for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (trimmed === "" || trimmed.startsWith("#")) {
                continue;
            }

            const separatorIndex = trimmed.indexOf("=");
            if (separatorIndex === -1) {
                continue;
            }

            const key = trimmed.substring(0, separatorIndex).trim();
            const value = trimmed.substring(separatorIndex + 1).trim();
            secrets.set(key, value);
        }

        return secrets;
    }
}
