const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota para obter todos os clientes
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM clientes_completo'); 
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao consultar os clientes:', err);
    res.status(500).send('Erro ao consultar os clientes');
  }
});

// Rota para cadastrar um novo cliente
router.post('/', async (req, res) => {
  console.log('Dados recebidos:', req.body); // Adicione esta linha
  
  const {
    nome,
    cpf,
    telefone,
    email,
    sexo,
    data_nascimento,
    rua,
    bairro,
    cidade,
    cep,
    id_instrutor,
    id_contrato
  } = req.body;

  // Validações básicas
  if (!nome || !cpf || !sexo || !id_contrato) {
    return res.status(400).json({ message: 'Campos obrigatórios não preenchidos' });
  }

  try {
    // Verifica se o CPF já existe
    const cpfExistente = await db.query('SELECT id_cliente FROM Cliente WHERE cpf = $1', [cpf]);
    if (cpfExistente.rows.length > 0) {
      return res.status(400).json({ message: 'CPF já cadastrado' });
    }

    // Insere o novo cliente
    const result = await db.query(
      `INSERT INTO Cliente (
        nome, cpf, telefone, email, sexo, data_nascimento, 
        rua, bairro, cidade, cep, id_instrutor, id_contrato
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id_cliente`,
      [
        nome, cpf, telefone || null, email || null, sexo, data_nascimento || null,
        rua || null, bairro || null, cidade || null, cep || null, 
        id_instrutor || null, id_contrato
      ]
    );

    res.status(201).json({
      message: 'Cliente cadastrado com sucesso',
      id_cliente: result.rows[0].id_cliente
    });
  } catch (err) {
    console.error('Erro ao cadastrar cliente:', err);
    res.status(500).json({ message: 'Erro ao cadastrar cliente' });
  }
});

// Rota para remover um cliente
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`Tentando remover cliente com ID: ${id}`);

  try {
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