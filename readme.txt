
-- VIEWS

-- 1 CREATE VIEW clientes_completo AS
SELECT *
FROM Cliente;


-- 2 Clientes por Contrato
CREATE OR REPLACE VIEW vw_clientes_por_contrato AS
SELECT 
    ct.id_contrato,
    ct.nome AS nome_contrato,
    COUNT(cl.id_cliente) AS total_clientes,
    SUM(CASE WHEN cl.situacao = TRUE THEN 1 ELSE 0 END) AS clientes_ativos,
    SUM(CASE WHEN cl.situacao = FALSE THEN 1 ELSE 0 END) AS clientes_inativos
FROM 
    Contrato ct
JOIN 
    Cliente cl ON ct.id_contrato = cl.id_contrato
GROUP BY 
    ct.id_contrato, ct.nome
ORDER BY 
    ct.nome;
    
-- 3 Total de Clientes por Modalidades (Somente Ativos)

CREATE OR REPLACE VIEW vw_clientes_por_modalidade_ativos AS
SELECT 
    m.id_modalidade,
    m.nome AS nome_modalidade,
    COUNT(DISTINCT cl.id_cliente) AS total_clientes_ativos
FROM 
    Modalidade m
JOIN 
    Agenda a ON m.id_modalidade = a.id_modalidade
JOIN 
    Cliente_Agenda ca ON a.id_agenda = ca.id_agenda
JOIN 
    Cliente cl ON ca.id_cliente = cl.id_cliente
WHERE
    cl.ativo = TRUE
GROUP BY 
    m.id_modalidade, m.nome
ORDER BY 
    m.nome;
    
-- 4 Total de Clientes por Instrutor (Somente Ativos)   
    
CREATE OR REPLACE VIEW vw_clientes_por_instrutor_ativos AS
SELECT 
    i.id_instrutor,
    i.nome AS nome_instrutor,
    COUNT(DISTINCT cl.id_cliente) AS total_clientes_ativos
FROM 
    Instrutor i
LEFT JOIN 
    Cliente cl ON i.id_instrutor = cl.id_instrutor
    AND cl.situacao = TRUE
GROUP BY 
    i.id_instrutor, i.nome
ORDER BY 
    i.nome;
 
 
 -- Triggers
 
 1. Trigger de Soft Delete em Cascata
Quando um cliente for desativado, remover automaticamente ele da Cliente_Agenda (via ativo = FALSE).

CREATE OR REPLACE FUNCTION desativar_cliente_agenda()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Cliente_Agenda
    SET ativo = FALSE,
        data_atualizacao = CURRENT_TIMESTAMP
    WHERE id_cliente = OLD.id_cliente;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_soft_delete_cliente_agenda
AFTER UPDATE ON Cliente
FOR EACH ROW
WHEN (OLD.ativo = TRUE AND NEW.ativo = FALSE)
EXECUTE FUNCTION desativar_cliente_agenda();

2- Trigger para atualizar a data de atualização das tabelas:

CREATE OR REPLACE FUNCTION atualizar_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_data_atualizacao_instrutor
BEFORE UPDATE ON Instrutor
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER trg_data_atualizacao_contrato
BEFORE UPDATE ON Contrato
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER trg_data_atualizacao_modalidade
BEFORE UPDATE ON Modalidade
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER trg_data_atualizacao_cliente
BEFORE UPDATE ON Cliente
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER trg_data_atualizacao_agenda
BEFORE UPDATE ON Agenda
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao();

CREATE TRIGGER trg_data_atualizacao_cliente_agenda
BEFORE UPDATE ON Cliente_Agenda
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_atualizacao();


-- FUNCTIONS 

CREATE OR REPLACE FUNCTION dias_restantes_contrato(p_id_contrato INT)
RETURNS INT AS $$
DECLARE
    fim DATE;
BEGIN
    SELECT data_final INTO fim FROM Contrato WHERE id_contrato = p_id_contrato;
    RETURN GREATEST(0, fim - CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;


--PROCEDURES

1. 
CREATE OR REPLACE PROCEDURE vincular_cliente_agenda(p_id_cliente INT, p_id_agenda INT)
LANGUAGE plpgsql
AS $$
DECLARE
    total_inscritos INT;
    max_vagas INT;
BEGIN
    SELECT COUNT(*) INTO total_inscritos
    FROM Cliente_Agenda
    WHERE id_agenda = p_id_agenda;

    SELECT qtde_max_cli INTO max_vagas
    FROM Agenda
    WHERE id_agenda = p_id_agenda;

    IF total_inscritos >= max_vagas THEN
        RAISE EXCEPTION 'Agenda cheia!';
    END IF;

    INSERT INTO Cliente_Agenda(id_cliente, id_agenda, data_criacao, data_atualizacao)
    VALUES (p_id_cliente, p_id_agenda, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
END;
$$;


2.
CREATE OR REPLACE PROCEDURE limpar_agenda(p_id_agenda INT)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM Cliente_Agenda
    WHERE id_agenda = p_id_agenda;
END;
$$;

-- INDICES 

-- Índices para Junções (JOINs)
CREATE INDEX idx_cliente_agenda_composto ON Cliente_Agenda(id_cliente, id_agenda);
CREATE INDEX idx_agenda_modalidade_instrutor ON Agenda(id_modalidade, id_instrutor);

-- Índices para Filtros Temporais
CREATE INDEX idx_cliente_data_criacao ON Cliente(data_criacao);
CREATE INDEX idx_agenda_data_ini ON Agenda(data_ini);
CREATE INDEX idx_agenda_data_fim ON Agenda(data_fim);

--> Comandos de inicialização 
    - npm install 
	- node backend/index.js
