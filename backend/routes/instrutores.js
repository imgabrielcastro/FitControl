const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota para obter todos os instrutores
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Instrutor WHERE ativo = true ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar instrutores:', err);
    res.status(500).json({ message: 'Erro ao buscar instrutores' });
  }
});

// Rota para obter um instrutor específico
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Instrutor WHERE id_instrutor = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Instrutor não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar instrutor:', err);
    res.status(500).json({ message: 'Erro ao buscar instrutor' });
  }
});

// Rota para criar/atualizar instrutor
router.post('/', async (req, res) => {
  const { id_instrutor, ...data } = req.body;
  
  try {
    if (id_instrutor) {
      // Atualização
      const result = await db.query(
        `UPDATE Instrutor SET
          nome = $1, cpf = $2, telefone = $3, email = $4, sexo = $5,
          rua = $6, bairro = $7, cidade = $8, cep = $9, situacao = $10,
          data_atualizacao = CURRENT_TIMESTAMP
         WHERE id_instrutor = $11
         RETURNING *`,
        [
          data.nome, data.cpf, data.telefone, data.email, data.sexo,
          data.rua, data.bairro, data.cidade, data.cep, data.situacao,
          id_instrutor
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Instrutor não encontrado' 
        });
      }

      res.json({ 
        success: true,
        data: result.rows[0],
        message: 'Instrutor atualizado com sucesso'
      });

    } else {
      // Criação
      const result = await db.query(
        `INSERT INTO Instrutor (
          nome, cpf, telefone, email, sexo,
          rua, bairro, cidade, cep, situacao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          data.nome, data.cpf, data.telefone, data.email, data.sexo,
          data.rua, data.bairro, data.cidade, data.cep, data.situacao
        ]
      );
      
      res.status(201).json({ 
        success: true,
        data: result.rows[0],
        message: 'Instrutor cadastrado com sucesso'
      });
    }
  } catch (err) {
    console.error('Erro ao salvar instrutor:', err);
    res.status(500).json({ 
      success: false,
      message: err.detail || 'Erro ao salvar instrutor'
    });
  }
});

// Rota para desativar um instrutor
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE Instrutor SET ativo = false WHERE id_instrutor = $1 RETURNING *',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Instrutor não encontrado' });
    }
    
    res.json({ 
      success: true,
      message: 'Instrutor desativado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao desativar instrutor:', err);
    res.status(500).json({ message: 'Erro ao desativar instrutor' });
  }
});

module.exports = router;