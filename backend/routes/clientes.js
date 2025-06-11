const express = require('express');
const router = express.Router();
const db = require('../db'); // A conexão com o banco de dados que você já configurou no db.js

// Rota para obter todos os clientes
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM clientes_completo'); // Consulta a view clientes_completo
    res.json(result.rows); // Retorna os dados como JSON
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao consultar os clientes');
  }
});

module.exports = router;
