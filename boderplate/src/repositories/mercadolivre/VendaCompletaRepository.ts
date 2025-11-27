import postgres from 'postgres';
import * as dotenv from 'dotenv';
import logger from '../../utils/logger';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined. Check your .env configuration.');
}

const sqlClient = postgres(connectionString);

export class VendaCompletaRepository {
  async salvarVenda(data: Record<string, any>): Promise<void> {
    try {
      const convertToNumber = (value: any): number | null => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const num = parseInt(value, 10);
          return isNaN(num) ? null : num;
        }
        return null;
      };

      const normalizedData = { ...data };
      if (normalizedData.id_venda !== undefined) {
        normalizedData.id_venda = convertToNumber(normalizedData.id_venda);
      }
      if (normalizedData.comprador_id !== undefined) {
        normalizedData.comprador_id = convertToNumber(normalizedData.comprador_id);
      }
      if (normalizedData.id_envio !== undefined) {
        normalizedData.id_envio = convertToNumber(normalizedData.id_envio);
      }
      if (normalizedData.id_reclamacao !== undefined) {
        normalizedData.id_reclamacao = convertToNumber(normalizedData.id_reclamacao);
      }

      const cleanData: Record<string, any> = {};
      for (const key in normalizedData) {
        if (normalizedData[key] !== undefined) {
          cleanData[key] = normalizedData[key];
        }
      }

      let checkQuery: string;
      let checkParams: any[];

      if (cleanData.tipo_registro === 'pacote') {
        checkQuery = 'SELECT id FROM vendas_completas WHERE tipo_registro = $1 AND pack_id = $2';
        checkParams = [cleanData.tipo_registro, cleanData.pack_id];
      } else if (cleanData.tipo_registro === 'item_pacote') {
        checkQuery =
          'SELECT id FROM vendas_completas WHERE tipo_registro = $1 AND pack_id = $2 AND id_venda = $3 AND mlb_anuncio = $4';
        checkParams = [cleanData.tipo_registro, cleanData.pack_id, cleanData.id_venda, cleanData.mlb_anuncio];
      } else {
        checkQuery =
          'SELECT id FROM vendas_completas WHERE tipo_registro = $1 AND id_venda = $2 AND mlb_anuncio = $3';
        checkParams = [cleanData.tipo_registro, cleanData.id_venda, cleanData.mlb_anuncio];
      }

      const result = await sqlClient.unsafe(checkQuery, checkParams);
      const exists = result[0];

      const columns = Object.keys(cleanData);
      const values = Object.values(cleanData);

      if (exists) {
        const updateParts: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

        for (const col of columns) {
          if (col !== 'id' && col !== 'tipo_registro' && col !== 'created_at') {
            updateParts.push(`${col} = $${paramIndex++}`);
            updateValues.push(cleanData[col]);
          }
        }
        updateValues.push(exists.id);

        const updateQuery = `UPDATE vendas_completas SET ${updateParts.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`;
        await sqlClient.unsafe(updateQuery, updateValues);

        logger.info({
          context: 'VendaCompletaRepository.salvarVenda',
          message: `Registro ATUALIZADO (vendas) - ID: ${exists.id} | Tipo: ${cleanData.tipo_registro} | Venda/Pack: ${cleanData.id_venda || cleanData.pack_id}`,
        });
      } else {
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const insertQuery = `INSERT INTO vendas_completas (${columns.join(', ')}) VALUES (${placeholders})`;
        await sqlClient.unsafe(insertQuery, values);

        logger.info({
          context: 'VendaCompletaRepository.salvarVenda',
          message: `Registro INSERIDO (vendas) - Tipo: ${cleanData.tipo_registro} | Venda/Pack: ${cleanData.id_venda || cleanData.pack_id}`,
        });
      }
    } catch (error: any) {
      logger.error({
        context: 'VendaCompletaRepository.salvarVenda',
        message: `Erro ao salvar no banco (vendas): ${error.message}`,
        error: error.message,
      });
      throw error;
    }
  }
}

