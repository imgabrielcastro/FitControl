const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota para obter todos os clientes
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, 
             i.nome as instrutor_nome,
             ct.nome as contrato_nome,
             ct.valor as contrato_valor
      FROM Cliente c
      LEFT JOIN Instrutor i ON c.id_instrutor = i.id_instrutor
      LEFT JOIN Contrato ct ON c.id_contrato = ct.id_contrato
      ORDER BY c.nome
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar clientes:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar clientes' });
  }
});

// Rota para obter um cliente específico
router.post('/', async (req, res) => {
  console.log('Dados recebidos:', req.body); // Adicione esta linha para debug
  const { id_cliente, ...data } = req.body;
  try {
    const result = await db.query(`
      SELECT c.*, 
             i.nome as instrutor_nome,
             ct.nome as contrato_nome,
             ct.valor as contrato_valor
      FROM Cliente c
      LEFT JOIN Instrutor i ON c.id_instrutor = i.id_instrutor
      LEFT JOIN Contrato ct ON c.id_contrato = ct.id_contrato
      WHERE c.id_cliente = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Erro ao buscar cliente:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar cliente' });
  }
});

// Rota para criar/atualizar cliente
router.post('/', async (req, res) => {
  const { id_cliente, ...data } = req.body;
  
  try {
    if (id_cliente) {
      // Atualização
      const result = await db.query(
        `UPDATE Cliente SET
          nome = $1, cpf = $2, telefone = $3, email = $4, sexo = $5,
          data_nascimento = $6, rua = $7, bairro = $8, cidade = $9,
          cep = $10, id_instrutor = $11, id_contrato = $12
         WHERE id_cliente = $13
         RETURNING *`,
        [
          data.nome, data.cpf, data.telefone, data.email, data.sexo,
          data.data_nascimento, data.rua, data.bairro, data.cidade,
          data.cep, data.id_instrutor, data.id_contrato, id_cliente
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Cliente não encontrado' 
        });
      }

      res.json({ 
        success: true,
        data: result.rows[0],
        message: 'Cliente atualizado com sucesso'
      });

    } else {
      // Criação
      const result = await db.query(
        `INSERT INTO Cliente (
          nome, cpf, telefone, email, sexo, data_nascimento,
          rua, bairro, cidade, cep, id_instrutor, id_contrato
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          data.nome, data.cpf, data.telefone, data.email, data.sexo,
          data.data_nascimento, data.rua, data.bairro, data.cidade,
          data.cep, data.id_instrutor, data.id_contrato
        ]
      );
      
      res.status(201).json({ 
        success: true,
        data: result.rows[0],
        message: 'Cliente cadastrado com sucesso'
      });
    }
  } catch (err) {
    console.error('Erro ao salvar cliente:', err);
    res.status(500).json({ 
      success: false,
      message: err.detail || 'Erro ao salvar cliente'
    });
  }
});

// Rota para deletar cliente
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM Cliente WHERE id_cliente = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Cliente não encontrado' 
      });
    }

    res.json({ 
      success: true,
      message: 'Cliente removido com sucesso'
    });
  } catch (err) {
    console.error('Erro ao remover cliente:', err);
    res.status(500).json({ 
      success: false,
      message: err.detail || 'Erro ao remover cliente'
    });
  }
});

module.exports = router;