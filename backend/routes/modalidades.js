const express = require('express');
const router = express.Router();
const db = require('../db');

// Listar todas as modalidades
router.get('/', async (req, res) => {
  try {
    console.log('Buscando modalidades no banco de dados...');
    const result = await db.query(`
      SELECT 
        id_modalidade,
        nome,
        ativo,
        TO_CHAR(data_criacao, 'DD/MM/YYYY') as data_criacao,
        TO_CHAR(data_atualizacao, 'DD/MM/YYYY') as data_atualizacao
      FROM modalidade 
      ORDER BY nome
    `);
    
    console.log('Modalidades encontradas:', result.rows);
    
    res.json({
      success: true,
      data: result.rows,
      message: 'Modalidades listadas com sucesso'
    });
  } catch (err) {
    console.error('Erro ao buscar modalidades:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar modalidades',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Cadastrar nova modalidade
router.post('/', async (req, res) => {
  const { nome, ativo = true } = req.body;

  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    return res.status(400).json({ 
      success: false,
      message: 'Nome da modalidade é obrigatório e deve ser uma string válida'
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO modalidade (nome, ativo) 
       VALUES ($1, $2) 
       RETURNING 
         id_modalidade,
         nome,
         ativo,
         TO_CHAR(data_criacao, 'DD/MM/YYYY') as data_criacao,
         TO_CHAR(data_atualizacao, 'DD/MM/YYYY') as data_atualizacao`,
      [nome.trim(), ativo]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Modalidade criada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao criar modalidade:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao criar modalidade',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Atualizar modalidade
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, ativo } = req.body;

  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    return res.status(400).json({ 
      success: false,
      message: 'Nome da modalidade é obrigatório e deve ser uma string válida'
    });
  }

  try {
    const result = await db.query(
      `UPDATE modalidade 
       SET nome = $1, ativo = $2, data_atualizacao = CURRENT_TIMESTAMP 
       WHERE id_modalidade = $3
       RETURNING 
         id_modalidade,
         nome,
         ativo,
         TO_CHAR(data_criacao, 'DD/MM/YYYY') as data_criacao,
         TO_CHAR(data_atualizacao, 'DD/MM/YYYY') as data_atualizacao`,
      [nome.trim(), ativo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Modalidade não encontrada' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Modalidade atualizada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao atualizar modalidade:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar modalidade',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Alternar status da modalidade
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;

  try {
    // Primeiro busca o status atual
    const current = await db.query(
      'SELECT ativo FROM modalidade WHERE id_modalidade = $1',
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Modalidade não encontrada' 
      });
    }

    const novoStatus = !current.rows[0].ativo;

    const result = await db.query(
      `UPDATE modalidade 
       SET ativo = $1, data_atualizacao = CURRENT_TIMESTAMP 
       WHERE id_modalidade = $2
       RETURNING 
         id_modalidade,
         nome,
         ativo,
         TO_CHAR(data_criacao, 'DD/MM/YYYY') as data_criacao,
         TO_CHAR(data_atualizacao, 'DD/MM/YYYY') as data_atualizacao`,
      [novoStatus, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: `Modalidade ${novoStatus ? 'ativada' : 'inativada'} com sucesso`
    });
  } catch (err) {
    console.error('Erro ao alternar status da modalidade:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao alternar status da modalidade',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;