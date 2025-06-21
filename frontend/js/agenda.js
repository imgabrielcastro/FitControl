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

// Carregar dependências (modalidades, instrutores, clientes)
async function carregarDependencias() {
  try {
    // Carregar modalidades
    const resModalidades = await fetch("http://localhost:3000/modalidades");
    const { data: mods } = await resModalidades.json();
    modalidades = mods;
    
    const selectModalidade = document.getElementById("agenda-modalidade");
    selectModalidade.innerHTML = '<option value="">Selecione uma modalidade</option>';
    modalidades.forEach(mod => {
      const option = document.createElement("option");
      option.value = mod.id_modalidade;
      option.textContent = mod.nome;
      selectModalidade.appendChild(option);
    });

    // Carregar instrutores
    const resInstrutores = await fetch("http://localhost:3000/instrutores");
    const { data: instrs } = await resInstrutores.json();
    instrutores = instrs;
    
    const selectInstrutor = document.getElementById("agenda-instrutor");
    selectInstrutor.innerHTML = '<option value="">Selecione um instrutor</option>';
    instrutores.forEach(inst => {
      const option = document.createElement("option");
      option.value = inst.id_instrutor;
      option.textContent = inst.nome;
      selectInstrutor.appendChild(option);
    });

    // Carregar clientes disponíveis
    const resClientes = await fetch("http://localhost:3000/agendas/clientes/disponiveis");
    const { data: clis } = await resClientes.json();
    clientes = clis;
    
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
    mostrarFeedback("Erro ao carregar dados", "error");
  }
}

// Carregar agendas do dia selecionado
async function carregarAgendas(dia = currentDay) {
  try {
    const response = await fetch(`http://localhost:3000/agendas?dia=${dia}`);
    const { data: agendas } = await response.json();
    
    const container = document.getElementById("agendas-list");
    container.innerHTML = '';
    
    if (!agendas || agendas.length === 0) {
      container.innerHTML = `
        <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <i class="fas fa-calendar-times" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
          <h3 style="color: var(--text-light);">Nenhuma agenda encontrada</h3>
          <p style="color: var(--text-light); margin-top: 10px;">Clique em "Nova Agenda" para criar uma nova programação</p>
        </div>
      `;
      return;
    }
    
    agendas.forEach(agenda => {
      const horarioIni = formatarHorario(agenda.data_ini);
      const horarioFim = formatarHorario(agenda.data_fim);
      const vagasDisponiveis = agenda.qtde_max_cli - agenda.clientes_vinculados;
      
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
    mostrarFeedback("Erro ao carregar agendas", "error");
  }
}

// Abrir formulário para nova agenda
function abrirFormularioAgenda() {
  const form = document.getElementById("form-agenda");
  form.style.display = 'block';
  document.getElementById("clientes-section").style.display = 'none';
  document.getElementById("modal-agenda-title").textContent = "Nova Agenda";
  form.reset();
  document.getElementById("agenda-dia").value = currentDay;
  currentAgendaId = null;
}

// Preencher formulário para edição
async function editarAgenda(id) {
  try {
    const response = await fetch(`http://localhost:3000/agendas/${id}`);
    if (!response.ok) throw new Error("Agenda não encontrada");
    
    const { data: agenda } = await response.json();
    
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
    mostrarFeedback(error.message, "error");
  }
}

// Carregar clientes vinculados a uma agenda
async function carregarClientesVinculados(idAgenda) {
  try {
    const response = await fetch(`http://localhost:3000/agendas/${idAgenda}/clientes`);
    const { data: clientes } = await response.json();
    
    const container = document.getElementById("clientes-list");
    container.innerHTML = '';
    
    if (!clientes || clientes.length === 0) {
      container.innerHTML = '<p>Nenhum cliente vinculado</p>';
      return;
    }
    
    clientes.forEach(cliente => {
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
  }
}

// Vincular cliente
async function vincularCliente() {
  if (!currentAgendaId) return;
  
  const idCliente = document.getElementById("cliente-select").value;
  
  if (!idCliente) {
    mostrarFeedback("Selecione um cliente", "error");
    return;
  }
  
  try {
    await fetch(`http://localhost:3000/agendas/${currentAgendaId}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_cliente: idCliente })
    });
    
    mostrarFeedback("Cliente vinculado com sucesso", "success");
    await carregarClientesVinculados(currentAgendaId);
    document.getElementById("cliente-select").value = '';
  } catch (error) {
    console.error("Erro ao vincular cliente:", error);
    mostrarFeedback("Erro ao vincular cliente", "error");
  }
}

// Desvincular cliente
async function desvincularCliente(idAgenda, idCliente) {
  try {
    await fetch(`http://localhost:3000/agendas/${idAgenda}/clientes/${idCliente}`, {
      method: "DELETE"
    });
    
    mostrarFeedback("Cliente desvinculado com sucesso", "success");
    await carregarClientesVinculados(idAgenda);
  } catch (error) {
    console.error("Erro ao desvincular cliente:", error);
    mostrarFeedback("Erro ao desvincular cliente", "error");
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro ao salvar agenda");
    }
    
    mostrarFeedback(
      isEdit ? "Agenda atualizada com sucesso" : "Agenda criada com sucesso", 
      "success"
    );
    
    fecharFormularioAgenda();
    await carregarAgendas(currentDay);
  } catch (error) {
    console.error("Erro ao salvar agenda:", error);
    mostrarFeedback(error.message, "error");
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro ao excluir agenda");
    }
    
    mostrarFeedback("Agenda excluída com sucesso", "success");
    await carregarAgendas(currentDay);
  } catch (error) {
    console.error("Erro ao excluir agenda:", error);
    mostrarFeedback(error.message, "error");
  }
}

// Fechar formulário
function fecharFormularioAgenda() {
  document.getElementById("form-agenda").style.display = 'none';
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