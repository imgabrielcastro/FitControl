const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/clientes-por-modalidade", async (req, res) => {
  try {
    const { modalidade, instrutor } = req.query;

    let queryParts = [];
    let params = [];

    queryParts.push(`
      SELECT 
        c.id_cliente, c.nome, c.cpf, c.email, c.telefone,
        ct.nome AS contrato_nome,
        i.nome AS instrutor_nome
      FROM Cliente c
      LEFT JOIN Contrato ct ON c.id_contrato = ct.id_contrato
      LEFT JOIN Instrutor i ON c.id_instrutor = i.id_instrutor
    `);

    const conditions = [];
    if (modalidade) {
      conditions.push(`c.id_contrato = $${conditions.length + 1}`);
      params.push(modalidade);
    }

    if (instrutor) {
      conditions.push(`c.id_instrutor = $${conditions.length + 1}`);
      params.push(instrutor);
    }

    if (conditions.length > 0) {
      queryParts.push(`WHERE ${conditions.join(" AND ")}`);
    }

    queryParts.push("ORDER BY c.nome");

    const query = queryParts.join("\n");
    console.log("Executando query:", query, "com parâmetros:", params);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error("Erro ao gerar relatório:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar relatório",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

module.exports = router;
