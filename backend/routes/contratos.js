const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota para obter todos os contratos
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Contrato ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar contratos:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar contratos' });
  }
});

// Rota para obter um contrato específico
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Contrato WHERE id_contrato = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contrato não encontrado' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Erro ao buscar contrato:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar contrato' });
  }
});

// Rota para criar/atualizar contrato
router.post('/', async (req, res) => {
  const { id_contrato, ...data } = req.body;
  
  try {
    if (id_contrato) {
      // Atualização
      const result = await db.query(
        `UPDATE Contrato SET
          nome = $1, duracao_contrato = $2, qtde_acesso_dia = $3, valor = $4, ativo = $5
         WHERE id_contrato = $6
         RETURNING *`,
        [
          data.nome, data.duracao_contrato, data.qtde_acesso_dia, 
          data.valor, data.ativo, id_contrato
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Contrato não encontrado' 
        });
      }

      res.json({ 
        success: true,
        data: result.rows[0],
        message: 'Contrato atualizado com sucesso'
      });

    } else {
      // Criação
      const result = await db.query(
        `INSERT INTO Contrato (
          nome, duracao_contrato, qtde_acesso_dia, valor
        ) VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
          data.nome, data.duracao_contrato, data.qtde_acesso_dia, data.valor
        ]
      );
      
      res.status(201).json({ 
        success: true,
        data: result.rows[0],
        message: 'Contrato cadastrado com sucesso'
      });
    }
  } catch (err) {
    console.error('Erro ao salvar contrato:', err);
    res.status(500).json({ 
      success: false,
      message: err.detail || 'Erro ao salvar contrato'
    });
  }
});

// Rota para alterar status do contrato
router.patch('/:id/status', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE Contrato SET ativo = $1 WHERE id_contrato = $2 RETURNING *',
      [req.body.ativo, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Contrato não encontrado' 
      });
    }

    res.json({ 
      success: true,
      data: result.rows[0],
      message: `Contrato ${req.body.ativo ? 'ativado' : 'desativado'} com sucesso`
    });
  } catch (err) {
    console.error('Erro ao alterar status do contrato:', err);
    res.status(500).json({ 
      success: false,
      message: err.detail || 'Erro ao alterar status do contrato'
    });
  }
});

module.exports = router;