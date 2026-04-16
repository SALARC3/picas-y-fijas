import { Player } from '../../domain/entities/Player';
import { Nickname } from '../../domain/value_objects/Nickname';

/**
 * Interfaz para el repositorio de jugadores.
 * Define el contrato que la capa de infraestructura debe implementar.
 */
export interface IPlayerRepository {
    /**
     * Busca un jugador por su ID.
     * @param id El ID del jugador.
     * @returns El jugador o null si no se encuentra.
     */
    findById(id: string): Promise<Player | null>;

    /**
     * Busca un jugador por su nickname.
     * @param nickname El nickname del jugador.
     * @returns El jugador o null si no se encuentra.
     */
    findByNickname(nickname: Nickname): Promise<Player | null>;

    /**
     * Guarda (crea o actualiza) un jugador en la persistencia.
     * @param player El jugador a guardar.
     */
    save(player: Player): Promise<void>;
}
