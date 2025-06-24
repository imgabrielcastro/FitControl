const express = require("express");
const router = express.Router();
const db = require("../db");

router.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

router.post("/:id/clientes", async (req, res) => {
  const { id } = req.params;
  const { id_cliente } = req.body;

  try {
    const agendaResult = await db.query(
      `
      SELECT a.qtde_max_cli, COUNT(ca.id_cliente) as inscritos
      FROM agenda a
      LEFT JOIN cliente_agenda ca ON a.id_agenda = ca.id_agenda AND ca.ativo = true
      WHERE a.id_agenda = $1 AND a.ativo = true
      GROUP BY a.id_agenda
    `,
      [id]
    );

    if (agendaResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Agenda não encontrada ou desativada",
      });
    }

    const agenda = agendaResult.rows[0];

    if (agenda.inscritos >= agenda.qtde_max_cli) {
      return res.status(400).json({
        success: false,
        message: `Agenda cheia. Limite de ${agenda.qtde_max_cli} alunos atingido.`,
      });
    }

    const clienteCheck = await db.query(
      "SELECT 1 FROM cliente_agenda WHERE id_agenda = $1 AND id_cliente = $2 AND ativo = true",
      [id, id_cliente]
    );

    if (clienteCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cliente já está vinculado a esta agenda",
      });
    }

    await db.query(
      `INSERT INTO cliente_agenda (id_agenda, id_cliente)
       VALUES ($1, $2)`,
      [id, id_cliente]
    );

    res.json({
      success: true,
      message: "Cliente vinculado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao vincular cliente:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao vincular cliente",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.delete("/:id/clientes", async (req, res) => {
  const { id } = req.params;

  try {
    const agendaCheck = await db.query(
      "SELECT 1 FROM agenda WHERE id_agenda = $1 AND ativo = true",
      [id]
    );

    if (agendaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Agenda não encontrada ou desativada",
      });
    }

    await db.query("DELETE FROM cliente_agenda WHERE id_agenda = $1", [id]);

    res.json({
      success: true,
      message: "Todos os clientes foram removidos da agenda",
    });
  } catch (err) {
    console.error("Erro ao remover clientes:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao remover clientes",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

const timeToTimestamp = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

router.get("/", async (req, res) => {
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
      WHERE a.ativo = true
    `;

    const params = [];
    if (dia) {
      query += " AND a.diadasemana = $1";
      params.push(dia);
    }

    query += " GROUP BY a.id_agenda, m.nome, i.nome ORDER BY a.data_ini";

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      message: "Agendas listadas com sucesso",
    });
  } catch (err) {
    console.error("Erro ao buscar agendas:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar agendas",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `
      SELECT 
        a.*,
        m.nome as modalidade_nome,
        i.nome as instrutor_nome,
        TO_CHAR(a.data_ini, 'HH24:MI') as hora_ini,
        TO_CHAR(a.data_fim, 'HH24:MI') as hora_fim
      FROM agenda a
      JOIN modalidade m ON a.id_modalidade = m.id_modalidade
      JOIN instrutor i ON a.id_instrutor = i.id_instrutor
      WHERE a.id_agenda = $1 AND a.ativo = true
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Agenda não encontrada",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Agenda encontrada com sucesso",
    });
  } catch (err) {
    console.error("Erro ao buscar agenda:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar agenda",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.post("/", async (req, res) => {
  const {
    id_agenda,
    id_modalidade,
    id_instrutor,
    descricao,
    qtde_max_cli,
    local,
    data_ini,
    data_fim,
    diadasemana,
  } = req.body;

  try {
    const inicioTimestamp = timeToTimestamp(data_ini);
    const fimTimestamp = timeToTimestamp(data_fim);

    let result;

    if (id_agenda) {
      result = await db.query(
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
          id_agenda,
        ]
      );
    } else {
      result = await db.query(
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
          diadasemana,
        ]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Operação não realizada",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: id_agenda
        ? "Agenda atualizada com sucesso"
        : "Agenda criada com sucesso",
    });
  } catch (err) {
    console.error("Erro ao salvar agenda:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao salvar agenda",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "UPDATE agenda SET ativo = false WHERE id_agenda = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Agenda não encontrada",
      });
    }

    res.json({
      success: true,
      message: "Agenda desativada com sucesso",
    });
  } catch (err) {
    console.error("Erro ao desativar agenda:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao desativar agenda",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.get("/:id/clientes", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `
      SELECT 
        c.id_cliente,
        c.nome,
        c.cpf,
        c.email
      FROM cliente c
      JOIN cliente_agenda ca ON c.id_cliente = ca.id_cliente
      WHERE ca.id_agenda = $1 AND c.situacao = true
    `,
      [id]
    );

    res.json({
      success: true,
      data: result.rows,
      message: "Clientes vinculados listados com sucesso",
    });
  } catch (err) {
    console.error("Erro ao buscar clientes vinculados:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar clientes vinculados",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.post("/:id/clientes", async (req, res) => {
  const { id } = req.params;
  const { id_cliente } = req.body;

  try {
    const agendaCheck = await db.query(
      "SELECT ativo FROM agenda WHERE id_agenda = $1",
      [id]
    );

    if (agendaCheck.rows.length === 0 || !agendaCheck.rows[0].ativo) {
      return res.status(400).json({
        success: false,
        message: "Agenda não encontrada ou desativada",
      });
    }

    const clienteCheck = await db.query(
      "SELECT 1 FROM cliente_agenda WHERE id_agenda = $1 AND id_cliente = $2 AND ativo = true",
      [id, id_cliente]
    );

    if (clienteCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cliente já está vinculado a esta agenda",
      });
    }

    await db.query(
      `INSERT INTO cliente_agenda (id_agenda, id_cliente)
       VALUES ($1, $2)`,
      [id, id_cliente]
    );

    res.json({
      success: true,
      message: "Cliente vinculado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao vincular cliente:", err);

    if (err.message && err.message.includes("Agenda cheia")) {
      return res.status(400).json({
        success: false,
        message: "Esta agenda já está cheia. Limite de alunos atingido.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao vincular cliente",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.delete("/:id_agenda/clientes/:id_cliente", async (req, res) => {
  const { id_agenda, id_cliente } = req.params;

  try {
    await db.query(
      `DELETE FROM cliente_agenda 
       WHERE id_agenda = $1 AND id_cliente = $2`,
      [id_agenda, id_cliente]
    );

    res.json({
      success: true,
      message: "Cliente desvinculado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao desvincular cliente:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao desvincular cliente",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.get("/clientes/disponiveis", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id_cliente, nome, cpf, email 
      FROM cliente 
      WHERE situacao = true
      ORDER BY nome
    `);

    res.json({
      success: true,
      data: result.rows,
      message: "Clientes disponíveis listados com sucesso",
    });
  } catch (err) {
    console.error("Erro ao buscar clientes disponíveis:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar clientes disponíveis",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

module.exports = router;
