// js/agenda.js

// Variáveis globais
let modalidades = [];
let instrutores = [];
let clientes = [];
let currentDay = 'SEG';
let currentAgendaId = null;

// Funções auxiliares
function mostrarFeedback(mensagem, tipo = "success") {
  const feedback = document.createElement("div");
  feedback.className = `feedback ${tipo}`;
  feedback.textContent = mensagem;
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.classList.add("show");
    setTimeout(() => {
      feedback.classList.remove("show");
      setTimeout(() => feedback.remove(), 300);
    }, 3000);
  }, 10);
}

function formatarHorario(horario) {
  if (!horario) return '';
  const date = new Date(horario);
  return date.toTimeString().substring(0, 5);
}

// Função auxiliar para carregar recursos com tratamento de erro robusto
async function carregarRecurso(url, nome) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      // Tente extrair a mensagem de erro do JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      } catch (jsonError) {
        // Se não conseguir parsear como JSON, use o texto
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText.substring(0, 100)}`);
      }
    }
    
    // Verifique o tipo de conteúdo
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Resposta de ${nome} não é JSON: ${text.substring(0, 100)}...`);
    }
    
    const result = await response.json();
    
    // Verifique a estrutura da resposta
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error(`Formato inesperado na resposta de ${nome}`);
    }
    
    return result.data;
  } catch (error) {
    console.error(`Erro ao carregar ${nome}:`, error);
    mostrarFeedback(`Erro ao carregar ${nome}: ${error.message}`, "error");
    return [];
  }
}

// Carregar dependências (modalidades, instrutores, clientes)
async function carregarDependencias() {
  try {
    // Carregar modalidades
    modalidades = await carregarRecurso("http://localhost:3000/modalidades", "modalidades");
    
    const selectModalidade = document.getElementById("agenda-modalidade");
    selectModalidade.innerHTML = '<option value="">Selecione uma modalidade</option>';
    modalidades.forEach(mod => {
      const option = document.createElement("option");
      option.value = mod.id_modalidade;
      option.textContent = mod.nome;
      selectModalidade.appendChild(option);
    });

    // Carregar instrutores
    instrutores = await carregarRecurso("http://localhost:3000/instrutores", "instrutores");
    
    const selectInstrutor = document.getElementById("agenda-instrutor");
    selectInstrutor.innerHTML = '<option value="">Selecione um instrutor</option>';
    instrutores.forEach(inst => {
      const option = document.createElement("option");
      option.value = inst.id_instrutor;
      option.textContent = inst.nome;
      selectInstrutor.appendChild(option);
    });

    // Carregar clientes disponíveis
    clientes = await carregarRecurso("http://localhost:3000/agendas/clientes/disponiveis", "clientes disponíveis");
    
    const selectCliente = document.getElementById("cliente-select");
    selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';
    clientes.forEach(cli => {
      const option = document.createElement("option");
      option.value = cli.id_cliente;
      option.textContent = cli.nome;
      selectCliente.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar dependências:", error);
    mostrarFeedback("Erro ao carregar dados: " + error.message, "error");
  }
}

// Carregar agendas do dia selecionado
async function carregarAgendas(dia = currentDay) {
  try {
    const response = await fetch(`http://localhost:3000/agendas?dia=${dia}`);
    
    // Verifique se a resposta é OK
    if (!response.ok) {
      // Tente extrair a mensagem de erro do JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      } catch (jsonError) {
        // Se não conseguir parsear como JSON, use o texto
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText.substring(0, 100)}`);
      }
    }
    
    // Verifique o tipo de conteúdo
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Resposta não é JSON: ${text.substring(0, 100)}...`);
    }
    
    const result = await response.json();
    
    // Verifique a estrutura da resposta
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error('Resposta da API em formato inesperado');
    }
    
    const agendas = result.data;
    
    const container = document.getElementById("agendas-list");
    container.innerHTML = '';
    
    if (agendas.length === 0) {
      container.innerHTML = `
        <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <i class="fas fa-calendar-times" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
          <h3 style="color: var(--text-light);">Nenhuma agenda encontrada para ${dia}</h3>
          <p style="color: var(--text-light); margin-top: 10px;">Clique em "Nova Agenda" para criar uma nova programação</p>
        </div>
      `;
      return;
    }
    
    agendas.forEach(agenda => {
      const horarioIni = formatarHorario(agenda.data_ini);
      const horarioFim = formatarHorario(agenda.data_fim);
      const vagasDisponiveis = agenda.qtde_max_cli - (agenda.clientes_vinculados || 0);
      
      const card = document.createElement('div');
      card.className = 'agenda-card';
      card.innerHTML = `
        <div class="agenda-header">
          <div class="agenda-title">${agenda.modalidade_nome}</div>
          <div class="agenda-horario">${horarioIni} - ${horarioFim}</div>
        </div>
        <div class="agenda-details">
          <div class="agenda-detail-item">
            <span class="agenda-detail-label">Instrutor:</span>
            <span class="agenda-detail-value">${agenda.instrutor_nome}</span>
          </div>
          <div class="agenda-detail-item">
            <span class="agenda-detail-label">Local:</span>
            <span class="agenda-detail-value">${agenda.local}</span>
          </div>
          <div class="agenda-detail-item">
            <span class="agenda-detail-label">Vagas:</span>
            <span class="agenda-detail-value">${vagasDisponiveis} de ${agenda.qtde_max_cli} disponíveis</span>
          </div>
          <div class="agenda-detail-item">
            <span class="agenda-detail-label">Descrição:</span>
            <span class="agenda-detail-value">${agenda.descricao || '-'}</span>
          </div>
        </div>
        <div class="agenda-actions">
          <button class="btn btn-edit" data-id="${agenda.id_agenda}">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-remove" data-id="${agenda.id_agenda}">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </div>
      `;
      
      card.querySelector('.btn-edit').addEventListener('click', () => {
        editarAgenda(agenda.id_agenda);
      });
      
      card.querySelector('.btn-remove').addEventListener('click', () => {
        excluirAgenda(agenda.id_agenda);
      });
      
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao carregar agendas:", error);
    mostrarFeedback("Erro ao carregar agendas: " + error.message, "error");
  }
}

// Abrir formulário para nova agenda
function abrirFormularioAgenda() {
  const form = document.getElementById("form-agenda");
  form.style.display = 'block';
  document.getElementById("clientes-section").style.display = 'none';
  document.getElementById("modal-agenda-title").textContent = "Nova Agenda";
  document.getElementById("form-agenda").reset();
  document.getElementById("agenda-dia").value = currentDay;
  currentAgendaId = null;
  
  // Scroll para o formulário
  form.scrollIntoView({ behavior: 'smooth' });
}

// Preencher formulário para edição
async function editarAgenda(id) {
  try {
    const response = await fetch(`http://localhost:3000/agendas/${id}`);
    
    // Verifique se a resposta é OK
    if (!response.ok) {
      // Tente extrair a mensagem de erro do JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      } catch (jsonError) {
        // Se não conseguir parsear como JSON, use o texto
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText.substring(0, 100)}`);
      }
    }
    
    // Verifique o tipo de conteúdo
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Resposta não é JSON: ${text.substring(0, 100)}...`);
    }
    
    const result = await response.json();
    
    // Verifique a estrutura da resposta
    if (!result.success || !result.data) {
      throw new Error('Resposta da API em formato inesperado');
    }
    
    const agenda = result.data;
    
    currentAgendaId = id;
    document.getElementById("agenda-id").value = id;
    document.getElementById("agenda-modalidade").value = agenda.id_modalidade;
    document.getElementById("agenda-instrutor").value = agenda.id_instrutor;
    document.getElementById("agenda-descricao").value = agenda.descricao || '';
    document.getElementById("agenda-qtde-max").value = agenda.qtde_max_cli;
    document.getElementById("agenda-local").value = agenda.local;
    document.getElementById("agenda-data-ini").value = formatarHorario(agenda.data_ini);
    document.getElementById("agenda-data-fim").value = formatarHorario(agenda.data_fim);
    document.getElementById("agenda-dia").value = agenda.diadasemana;
    
    // Mostrar seção de clientes
    document.getElementById("clientes-section").style.display = 'block';
    document.getElementById("modal-agenda-title").textContent = "Editar Agenda";
    document.getElementById("form-agenda").style.display = 'block';
    
    // Carregar clientes vinculados
    await carregarClientesVinculados(id);
  } catch (error) {
    console.error("Erro ao editar agenda:", error);
    mostrarFeedback("Erro ao editar agenda: " + error.message, "error");
  }
}

// Carregar clientes vinculados a uma agenda
async function carregarClientesVinculados(idAgenda) {
  try {
    const response = await fetch(`http://localhost:3000/agendas/${idAgenda}/clientes`);
    
    // Verifique se a resposta é OK
    if (!response.ok) {
      // Tente extrair a mensagem de erro do JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      } catch (jsonError) {
        // Se não conseguir parsear como JSON, use o texto
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText.substring(0, 100)}`);
      }
    }
    
    // Verifique o tipo de conteúdo
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Resposta não é JSON: ${text.substring(0, 100)}...`);
    }
    
    const result = await response.json();
    
    // Verifique a estrutura da resposta
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error('Resposta da API em formato inesperado');
    }
    
    const clientesVinculados = result.data;
    
    const container = document.getElementById("clientes-list");
    container.innerHTML = '';
    
    if (clientesVinculados.length === 0) {
      container.innerHTML = '<p>Nenhum cliente vinculado</p>';
      return;
    }
    
    clientesVinculados.forEach(cliente => {
      const item = document.createElement('div');
      item.className = 'cliente-item';
      item.innerHTML = `
        <div class="cliente-info">
          <span>${cliente.nome}</span>
          <small>${cliente.email}</small>
        </div>
        <button class="btn btn-remove" data-id="${cliente.id_cliente}">
          <i class="fas fa-unlink"></i> Desvincular
        </button>
      `;
      
      item.querySelector('.btn-remove').addEventListener('click', async () => {
        await desvincularCliente(idAgenda, cliente.id_cliente);
      });
      
      container.appendChild(item);
    });
  } catch (error) {
    console.error("Erro ao carregar clientes vinculados:", error);
    mostrarFeedback("Erro ao carregar clientes vinculados: " + error.message, "error");
  }
}

// Vincular cliente
async function vincularCliente() {
  if (!currentAgendaId) {
    mostrarFeedback("Selecione uma agenda antes de vincular clientes", "error");
    return;
  }
  
  const idCliente = document.getElementById("cliente-select").value;
  
  if (!idCliente) {
    mostrarFeedback("Selecione um cliente", "error");
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:3000/agendas/${currentAgendaId}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_cliente: idCliente })
    });
    
    if (!response.ok) {
      // Tente extrair a mensagem de erro do JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      } catch (jsonError) {
        // Se não conseguir parsear como JSON, use o texto
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText.substring(0, 100)}`);
      }
    }
    
    mostrarFeedback("Cliente vinculado com sucesso", "success");
    await carregarClientesVinculados(currentAgendaId);
    document.getElementById("cliente-select").value = '';
  } catch (error) {
    console.error("Erro ao vincular cliente:", error);
    mostrarFeedback("Erro ao vincular cliente: " + error.message, "error");
  }
}

// Desvincular cliente
async function desvincularCliente(idAgenda, idCliente) {
  try {
    const response = await fetch(`http://localhost:3000/agendas/${idAgenda}/clientes/${idCliente}`, {
      method: "DELETE"
    });
    
    if (!response.ok) {
      // Tente extrair a mensagem de erro do JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      } catch (jsonError) {
        // Se não conseguir parsear como JSON, use o texto
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText.substring(0, 100)}`);
      }
    }
    
    mostrarFeedback("Cliente desvinculado com sucesso", "success");
    await carregarClientesVinculados(idAgenda);
  } catch (error) {
    console.error("Erro ao desvincular cliente:", error);
    mostrarFeedback("Erro ao desvincular cliente: " + error.message, "error");
  }
}

// Salvar agenda (criar ou atualizar)
async function salvarAgenda(event) {
  event.preventDefault();
  
  const id = document.getElementById("agenda-id").value;
  const isEdit = !!id;
  
  const data = {
    id_modalidade: document.getElementById("agenda-modalidade").value,
    id_instrutor: document.getElementById("agenda-instrutor").value,
    descricao: document.getElementById("agenda-descricao").value,
    qtde_max_cli: document.getElementById("agenda-qtde-max").value,
    local: document.getElementById("agenda-local").value,
    data_ini: document.getElementById("agenda-data-ini").value,
    data_fim: document.getElementById("agenda-data-fim").value,
    diadasemana: document.getElementById("agenda-dia").value
  };
  
  // Validação básica
  if (!data.id_modalidade || !data.id_instrutor || !data.qtde_max_cli || !data.local || !data.data_ini || !data.data_fim) {
    mostrarFeedback("Preencha todos os campos obrigatórios", "error");
    return;
  }
  
  try {
    const url = isEdit 
      ? `http://localhost:3000/agendas/${id}`
      : 'http://localhost:3000/agendas';
    
    const method = isEdit ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      // Tente extrair a mensagem de erro
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      } catch (jsonError) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText.substring(0, 100)}`);
      }
    }
    
    mostrarFeedback(
      isEdit ? "Agenda atualizada com sucesso!" : "Agenda criada com sucesso!", 
      "success"
    );
    
    fecharFormularioAgenda();
    await carregarAgendas(currentDay);
  } catch (error) {
    console.error("Erro ao salvar agenda:", error);
    mostrarFeedback("Erro ao salvar agenda: " + error.message, "error");
  }
}

// Excluir agenda
async function excluirAgenda(id) {
  if (!confirm("Tem certeza que deseja excluir esta agenda?")) return;
  
  try {
    const response = await fetch(`http://localhost:3000/agendas/${id}`, {
      method: "DELETE"
    });
    
    if (!response.ok) {
      // Tente extrair a mensagem de erro
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      } catch (jsonError) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText.substring(0, 100)}`);
      }
    }
    
    mostrarFeedback("Agenda excluída com sucesso", "success");
    await carregarAgendas(currentDay);
  } catch (error) {
    console.error("Erro ao excluir agenda:", error);
    mostrarFeedback("Erro ao excluir agenda: " + error.message, "error");
  }
}

// Fechar formulário
function fecharFormularioAgenda() {
  document.getElementById("form-agenda").style.display = 'none';
  document.getElementById("clientes-section").style.display = 'none';
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Configurar abas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelector('.tab-btn.active').classList.remove('active');
      this.classList.add('active');
      currentDay = this.dataset.day;
      carregarAgendas(currentDay);
    });
  });
  
  // Botão nova agenda
  document.getElementById('btn-nova-agenda').addEventListener('click', abrirFormularioAgenda);
  
  // Botão cancelar
  document.getElementById('btn-cancelar-agenda').addEventListener('click', fecharFormularioAgenda);
  
  // Formulário de agenda
  document.getElementById('form-agenda').addEventListener('submit', salvarAgenda);
  
  // Vincular cliente
  document.getElementById('btn-vincular-cliente').addEventListener('click', vincularCliente);
  
  // Carregar dados iniciais
  carregarDependencias();
  carregarAgendas();
});