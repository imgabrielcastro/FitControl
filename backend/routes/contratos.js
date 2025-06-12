// routes/contratos.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id_contrato, nome, valor FROM Contrato WHERE ativo = true ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao consultar contratos:', err);
    res.status(500).json({ message: 'Erro ao carregar contratos' });
  }
});

module.exports = router;