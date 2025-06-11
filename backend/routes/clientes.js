const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota para obter todos os clientes
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM clientes_completo'); 
    res.json(result.rows); // Retorna os dados dos clientes em formato JSON
  } catch (err) {
    console.error('Erro ao consultar os clientes:', err);
    res.status(500).send('Erro ao consultar os clientes');
  }
});

// Rota para remover um cliente
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM clientes_completo');
    res.json(result.rows);  // Retorna os dados dos clientes
  } catch (err) {
    console.error('Erro ao consultar os clientes:', err);
    res.status(500).send('Erro ao consultar os clientes');
  }
});

// Rota para remover um cliente
router.delete('/:id', async (req, res) => {
  const id = req.params.id;  // Pega o id do cliente da URL
  console.log(`Tentando remover cliente com ID: ${id}`);  // Log para depuração

  try {
    // A exclusão agora é feita automaticamente pela chave estrangeira com ON DELETE CASCADE
    const result = await db.query('DELETE FROM Cliente WHERE id_cliente = $1', [id]);

    if (result.rowCount > 0) {
      console.log(`Cliente com ID: ${id} removido com sucesso`);
      res.status(200).send('Cliente removido com sucesso');
    } else {
      console.log(`Cliente com ID: ${id} não encontrado`);
      res.status(404).send('Cliente não encontrado');
    }
  } catch (err) {
    console.error('Erro ao remover cliente:', err);
    res.status(500).send('Erro ao remover cliente');
  }
});


module.exports = router;
