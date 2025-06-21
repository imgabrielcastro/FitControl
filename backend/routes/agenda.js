const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware para garantir respostas JSON
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Helper para converter time string para timestamp
const timeToTimestamp = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Listar agendas por dia
router.get('/', async (req, res) => {
  const { dia } = req.query;
  
  try {
    let query = `
      SELECT 
        a.id_agenda,
        a.id_modalidade,
        a.id_instrutor,
        a.descricao,
        a.qtde_max_cli,
        a.local,
        a.data_ini,
        a.data_fim,
        a.diadasemana,
        a.ativo,
        TO_CHAR(a.data_criacao, 'DD/MM/YYYY') as data_criacao,
        TO_CHAR(a.data_atualizacao, 'DD/MM/YYYY') as data_atualizacao,
        m.nome as modalidade_nome,
        i.nome as instrutor_nome,
        COUNT(ca.id_cliente) as clientes_vinculados
      FROM agenda a
      JOIN modalidade m ON a.id_modalidade = m.id_modalidade
      JOIN instrutor i ON a.id_instrutor = i.id_instrutor
      LEFT JOIN cliente_agenda ca ON a.id_agenda = ca.id_agenda
    `;

    const params = [];
    if (dia) {
      query += ' WHERE a.diadasemana = $1';
      params.push(dia);
    }

    query += ' GROUP BY a.id_agenda, m.nome, i.nome ORDER BY a.data_ini';

    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      message: 'Agendas listadas com sucesso'
    });
  } catch (err) {
    console.error('Erro ao buscar agendas:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar agendas',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Obter uma agenda por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      SELECT 
        a.*,
        m.nome as modalidade_nome,
        i.nome as instrutor_nome,
        TO_CHAR(a.data_ini, 'HH24:MI') as hora_ini,
        TO_CHAR(a.data_fim, 'HH24:MI') as hora_fim
      FROM agenda a
      JOIN modalidade m ON a.id_modalidade = m.id_modalidade
      JOIN instrutor i ON a.id_instrutor = i.id_instrutor
      WHERE a.id_agenda = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Agenda não encontrada' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Agenda encontrada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao buscar agenda:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar agenda',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Cadastrar nova agenda
router.post('/', async (req, res) => {
  const { 
    id_modalidade, 
    id_instrutor, 
    descricao, 
    qtde_max_cli, 
    local, 
    data_ini, 
    data_fim, 
    diadasemana 
  } = req.body;

  try {
    const inicioTimestamp = timeToTimestamp(data_ini);
    const fimTimestamp = timeToTimestamp(data_fim);

    const result = await db.query(
      `INSERT INTO agenda (
        id_modalidade, 
        id_instrutor, 
        descricao, 
        qtde_max_cli, 
        local, 
        data_ini, 
        data_fim, 
        diadasemana
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id_modalidade, 
        id_instrutor, 
        descricao, 
        qtde_max_cli, 
        local, 
        inicioTimestamp, 
        fimTimestamp, 
        diadasemana
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Agenda criada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao criar agenda:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao criar agenda',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Atualizar agenda
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    id_modalidade, 
    id_instrutor, 
    descricao, 
    qtde_max_cli, 
    local, 
    data_ini, 
    data_fim, 
    diadasemana 
  } = req.body;

  try {
    const inicioTimestamp = timeToTimestamp(data_ini);
    const fimTimestamp = timeToTimestamp(data_fim);

    const result = await db.query(
      `UPDATE agenda SET
        id_modalidade = $1,
        id_instrutor = $2,
        descricao = $3,
        qtde_max_cli = $4,
        local = $5,
        data_ini = $6,
        data_fim = $7,
        diadasemana = $8,
        data_atualizacao = CURRENT_TIMESTAMP
      WHERE id_agenda = $9
      RETURNING *`,
      [
        id_modalidade, 
        id_instrutor, 
        descricao, 
        qtde_max_cli, 
        local, 
        inicioTimestamp, 
        fimTimestamp, 
        diadasemana,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Agenda não encontrada' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Agenda atualizada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao atualizar agenda:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar agenda',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Excluir agenda
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM cliente_agenda WHERE id_agenda = $1', [id]);
    const result = await db.query('DELETE FROM agenda WHERE id_agenda = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Agenda não encontrada' 
      });
    }

    res.json({
      success: true,
      message: 'Agenda excluída com sucesso'
    });
  } catch (err) {
    console.error('Erro ao excluir agenda:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao excluir agenda',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Listar clientes vinculados
router.get('/:id/clientes', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      SELECT 
        c.id_cliente,
        c.nome,
        c.cpf,
        c.email
      FROM cliente c
      JOIN cliente_agenda ca ON c.id_cliente = ca.id_cliente
      WHERE ca.id_agenda = $1
    `, [id]);

    res.json({
      success: true,
      data: result.rows,
      message: 'Clientes vinculados listados com sucesso'
    });
  } catch (err) {
    console.error('Erro ao buscar clientes vinculados:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar clientes vinculados',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Vincular cliente a agenda
router.post('/:id/clientes', async (req, res) => {
  const { id } = req.params;
  const { id_cliente } = req.body;

  try {
    await db.query(
      `INSERT INTO cliente_agenda (id_agenda, id_cliente)
       VALUES ($1, $2)
       ON CONFLICT (id_agenda, id_cliente) DO NOTHING`,
      [id, id_cliente]
    );

    res.status(201).json({
      success: true,
      message: 'Cliente vinculado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao vincular cliente:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao vincular cliente',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Desvincular cliente de agenda
router.delete('/:id_agenda/clientes/:id_cliente', async (req, res) => {
  const { id_agenda, id_cliente } = req.params;

  try {
    await db.query(
      `DELETE FROM cliente_agenda 
       WHERE id_agenda = $1 AND id_cliente = $2`,
      [id_agenda, id_cliente]
    );

    res.json({
      success: true,
      message: 'Cliente desvinculado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao desvincular cliente:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao desvincular cliente',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Listar clientes disponíveis para vincular
router.get('/clientes/disponiveis', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id_cliente, nome, cpf, email 
      FROM cliente 
      WHERE ativo = true
      ORDER BY nome
    `);

    res.json({
      success: true,
      data: result.rows,
      message: 'Clientes disponíveis listados com sucesso'
    });
  } catch (err) {
    console.error('Erro ao buscar clientes disponíveis:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar clientes disponíveis',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;