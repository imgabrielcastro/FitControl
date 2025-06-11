const express = require('express');
const router = express.Router();
const db = require('../db');

// GET todos os clientes
router.get('/', async (req, res) => {
  const result = await db.query('SELECT * FROM cliente WHERE ativo = true ORDER BY id_cliente DESC');
  res.json(result.rows);
});

// POST novo cliente
router.post('/', async (req, res) => {
  const {
    nome, cpf, telefone, email, sexo,
    data_nascimento, rua, bairro, cidade, cep
  } = req.body;

  try {
    const result = await db.query(`
      INSERT INTO cliente (
        nome, cpf, telefone, email, sexo, data_nascimento, rua, bairro, cidade, cep
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [nome, cpf, telefone, email, sexo, data_nascimento, rua, bairro, cidade, cep]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao cadastrar cliente.');
  }
});

// DELETE cliente
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('UPDATE cliente SET ativo = false WHERE id_cliente = $1', [id]);
  res.sendStatus(204);
});

module.exports = router;
