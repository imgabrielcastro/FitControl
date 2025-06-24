// Variáveis globais
let modalidades = [];
let instrutores = [];
let clientes = [];
let currentDay = "SEG";
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

// Função para formatar horário
function formatarHora(dataString) {
  if (!dataString) return "";

  try {
    // Se já estiver no formato HH:MM
    if (typeof dataString === "string" && dataString.match(/^\d{2}:\d{2}$/)) {
      return dataString;
    }

    // Se for um objeto Date ou string de data
    const date = new Date(dataString);

    if (isNaN(date.getTime())) {
      return "";
    }

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch (e) {
    console.error("Erro ao formatar hora:", e);
    return "";
  }
}

// Função auxiliar para carregar recursos
async function carregarRecurso(url, nome) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      return result.data;
    } else if (Array.isArray(result)) {
      return result;
    } else {
      throw new Error(`Formato inesperado na resposta de ${nome}`);
    }
  } catch (error) {
    console.error(`Erro ao carregar ${nome}:`, error);
    mostrarFeedback(`Erro ao carregar ${nome}: ${error.message}`, "error");
    return [];
  }
}

// Carregar dependências
async function carregarDependencias() {
  try {
    // Carregar modalidades
    modalidades = await carregarRecurso(
      "http://localhost:3000/modalidades",
      "modalidades"
    );

    const selectModalidade = document.getElementById("agenda-modalidade");
    selectModalidade.innerHTML =
      '<option value="">Selecione uma modalidade</option>';
    modalidades.forEach((mod) => {
      const option = document.createElement("option");
      option.value = mod.id_modalidade;
      option.textContent = mod.nome;
      selectModalidade.appendChild(option);
    });

    // Carregar instrutores
    instrutores = await carregarRecurso(
      "http://localhost:3000/instrutores",
      "instrutores"
    );

    const selectInstrutor = document.getElementById("agenda-instrutor");
    selectInstrutor.innerHTML =
      '<option value="">Selecione um instrutor</option>';
    instrutores.forEach((inst) => {
      const option = document.createElement("option");
      option.value = inst.id_instrutor;
      option.textContent = inst.nome;
      selectInstrutor.appendChild(option);
    });

    // Carregar clientes disponíveis
    clientes = await carregarRecurso(
      "http://localhost:3000/agendas/clientes/disponiveis",
      "clientes disponíveis"
    );

    const selectCliente = document.getElementById("cliente-select");
    selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';
    clientes.forEach((cli) => {
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

// Carregar agendas
async function carregarAgendas(dia = currentDay) {
  try {
    const response = await fetch(`http://localhost:3000/agendas?dia=${dia}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    const agendas = result.success ? result.data : result;

    const container = document.getElementById("agendas-list");
    container.innerHTML = "";

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

    agendas.forEach((agenda, index) => {
      const horaIni =
        formatarHora(agenda.data_ini) || formatarHora(agenda.hora_ini);
      const horaFim =
        formatarHora(agenda.data_fim) || formatarHora(agenda.hora_fim);

      const card = document.createElement("div");
      card.className = "agenda-card fade-in";
      card.style.animationDelay = `${0.1 * index}s`;

      card.innerHTML = `
        <div class="agenda-header">
          <div class="agenda-title">${agenda.modalidade_nome}</div>
          <div class="agenda-horario">${horaIni} - ${horaFim}</div>
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
            <span class="agenda-detail-value">${agenda.clientes_vinculados} / ${agenda.qtde_max_cli}</span>
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

      card.querySelector(".btn-edit").addEventListener("click", () => {
        editarAgenda(agenda.id_agenda);
      });

      card.querySelector(".btn-remove").addEventListener("click", () => {
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
  form.style.display = "block";
  document.getElementById("clientes-section").style.display = "none";
  document.getElementById("modal-agenda-title").textContent = "Nova Agenda";

  // Resetar formulário
  form.reset();
  document.getElementById("agenda-id").value = "";
  document.getElementById("agenda-dia").value = currentDay;

  currentAgendaId = null;
}

// Preencher formulário para edição
async function editarAgenda(id) {
  try {
    const response = await fetch(`http://localhost:3000/agendas/${id}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const agenda = result.success ? result.data : result;

    currentAgendaId = id;
    document.getElementById("agenda-id").value = id;

    // Preencher campos básicos
    document.getElementById("agenda-modalidade").value =
      agenda.id_modalidade || "";
    document.getElementById("agenda-instrutor").value =
      agenda.id_instrutor || "";
    document.getElementById("agenda-descricao").value = agenda.descricao || "";
    document.getElementById("agenda-qtde-max").value =
      agenda.qtde_max_cli || "";
    document.getElementById("agenda-local").value = agenda.local || "";
    document.getElementById("agenda-dia").value =
      agenda.diadasemana || currentDay;

    // Obter número atual de clientes vinculados
    const numClientes = await carregarClientesVinculados(id);

    // Atualizar título com vagas
    const modalTitle = document.getElementById("modal-agenda-title");
    modalTitle.textContent = `Editar Agenda (${numClientes}/${agenda.qtde_max_cli} vagas)`;

    // Converter e preencher horários
    const horaIni =
      formatarHora(agenda.hora_ini) || formatarHora(agenda.data_ini);
    const horaFim =
      formatarHora(agenda.hora_fim) || formatarHora(agenda.data_fim);

    document.getElementById("agenda-data-ini").value = horaIni;
    document.getElementById("agenda-data-fim").value = horaFim;

    // Exibir formulário
    document.getElementById("form-agenda").style.display = "block";
    document.getElementById("clientes-section").style.display = "block";

    // Exibir formulário
    document.getElementById("form-agenda").style.display = "block";
    document.getElementById("clientes-section").style.display = "block";

    // Adicionar botão de limpar todos os clientes
    const limparButton = document.createElement("button");
    limparButton.className = "btn btn-danger";
    limparButton.innerHTML =
      '<i class="fas fa-broom"></i> Limpar Todos os Clientes';
    limparButton.style.marginTop = "20px";
    limparButton.onclick = () => limparClientesAgenda(id);

    document.getElementById("clientes-section").appendChild(limparButton);
  } catch (error) {
    console.error("Erro ao editar agenda:", error);
    mostrarFeedback("Erro ao editar agenda: " + error.message, "error");
  }
}

// Carregar clientes vinculados
async function carregarClientesVinculados(idAgenda) {
  try {
    const response = await fetch(
      `http://localhost:3000/agendas/${idAgenda}/clientes`
    );

    if (!response.ok) {
      throw new Error("Erro ao carregar clientes");
    }

    const result = await response.json();
    const clientes = result.success ? result.data : result;

    const container = document.getElementById("clientes-list");
    container.innerHTML = "";

    if (!clientes || clientes.length === 0) {
      container.innerHTML = "<p>Nenhum cliente vinculado</p>";
      return 0;
    }

    clientes.forEach((cliente) => {
      const item = document.createElement("div");
      item.className = "cliente-item";
      item.innerHTML = `
        <span>${cliente.nome}</span>
        <button class="btn btn-remove" data-id="${cliente.id_cliente}">
          <i class="fas fa-unlink"></i> Desvincular
        </button>
      `;

      item.querySelector(".btn-remove").addEventListener("click", async () => {
        await desvincularCliente(idAgenda, cliente.id_cliente);
      });

      container.appendChild(item);
    });

    return clientes.length;
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
    mostrarFeedback("Erro ao carregar clientes vinculados", "error");
    return 0;
  }
}

// Limpar todos os clientes de uma agenda
// Adicione esta função para remover todos os clientes
async function removerTodosClientes(idAgenda) {
  if (!confirm('Tem certeza que deseja remover TODOS os clientes desta agenda?')) return;
  
  try {
    const response = await fetch(`http://localhost:3000/agendas/${idAgenda}/clientes`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erro ao remover clientes');
    }
    
    mostrarFeedback('Todos os clientes foram removidos da agenda', 'success');
    
    // Atualizar a lista de clientes e o título
    const numClientes = await carregarClientesVinculados(idAgenda);
    const agendaQtdeMax = document.getElementById("agenda-qtde-max").value;
    const modalTitle = document.getElementById("modal-agenda-title");
    modalTitle.textContent = `Editar Agenda (${numClientes}/${agendaQtdeMax} vagas)`;
    
  } catch (error) {
    console.error('Erro ao remover clientes:', error);
    mostrarFeedback('Erro ao remover clientes: ' + error.message, 'error');
  }
}

// Modifique a função editarAgenda para adicionar o botão de remover todos
async function editarAgenda(id) {
  try {
    const response = await fetch(`http://localhost:3000/agendas/${id}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    const agenda = result.success ? result.data : result;
    
    currentAgendaId = id;
    document.getElementById("agenda-id").value = id;
    
    // Preencher campos básicos
    document.getElementById("agenda-modalidade").value = agenda.id_modalidade || "";
    document.getElementById("agenda-instrutor").value = agenda.id_instrutor || "";
    document.getElementById("agenda-descricao").value = agenda.descricao || "";
    document.getElementById("agenda-qtde-max").value = agenda.qtde_max_cli || "";
    document.getElementById("agenda-local").value = agenda.local || "";
    document.getElementById("agenda-dia").value = agenda.diadasemana || currentDay;
    
    // Obter número atual de clientes vinculados
    const numClientes = await carregarClientesVinculados(id);
    
    // Atualizar título com vagas
    const modalTitle = document.getElementById("modal-agenda-title");
    modalTitle.textContent = `Editar Agenda (${numClientes}/${agenda.qtde_max_cli} vagas)`;
    
    // Adicionar botão de remover todos os clientes
    const clientesSection = document.getElementById("clientes-section");
    if (!document.getElementById("btn-remover-todos")) {
      const btnRemoverTodos = document.createElement("button");
      btnRemoverTodos.id = "btn-remover-todos";
      btnRemoverTodos.className = "btn btn-danger";
      btnRemoverTodos.innerHTML = '<i class="fas fa-users-slash"></i> Remover Todos os Clientes';
      btnRemoverTodos.addEventListener("click", () => removerTodosClientes(id));
      clientesSection.insertBefore(btnRemoverTodos, clientesSection.firstChild);
    }
    
    // Converter e preencher horários
    const horaIni = formatarHora(agenda.hora_ini) || formatarHora(agenda.data_ini);
    const horaFim = formatarHora(agenda.hora_fim) || formatarHora(agenda.data_fim);
    
    document.getElementById("agenda-data-ini").value = horaIni;
    document.getElementById("agenda-data-fim").value = horaFim;
    
    // Exibir formulário
    document.getElementById("form-agenda").style.display = 'block';
    document.getElementById("clientes-section").style.display = 'block';
    
  } catch (error) {
    console.error("Erro ao editar agenda:", error);
    mostrarFeedback("Erro ao editar agenda: " + error.message, "error");
  }
}

// Vincular cliente
async function vincularCliente() {
  const idAgenda = document.getElementById("agenda-id").value;
  const idCliente = document.getElementById("cliente-select").value;

  if (!idAgenda) {
    mostrarFeedback("Primeiro selecione uma agenda para editar", "error");
    return;
  }

  if (!idCliente) {
    mostrarFeedback("Selecione um cliente", "error");
    return;
  }

  try {
    // Verificação no frontend para melhor UX
    const responseAgenda = await fetch(
      `http://localhost:3000/agendas/${idAgenda}`
    );
    const agendaData = await responseAgenda.json();

    if (!responseAgenda.ok) {
      throw new Error(agendaData.message || "Erro ao verificar vagas");
    }

    const agenda = agendaData.success ? agendaData.data : agendaData;
    const vagasDisponiveis = agenda.qtde_max_cli - agenda.clientes_vinculados;

    if (vagasDisponiveis <= 0) {
      mostrarFeedback(
        `Esta agenda já está cheia. Limite de ${agenda.qtde_max_cli} alunos atingido.`,
        "error"
      );
      return;
    }

    // Tentativa de vincular cliente
    const response = await fetch(
      `http://localhost:3000/agendas/${idAgenda}/clientes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cliente: idCliente }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Erro ao vincular cliente");
    }

    mostrarFeedback("Cliente vinculado com sucesso", "success");

    // Atualizar a interface
    const numClientes = await carregarClientesVinculados(idAgenda);
    const modalTitle = document.getElementById("modal-agenda-title");
    modalTitle.textContent = `Editar Agenda (${numClientes}/${agenda.qtde_max_cli} vagas)`;

    document.getElementById("cliente-select").value = "";
  } catch (error) {
    console.error("Erro ao vincular cliente:", error);
    mostrarFeedback(error.message, "error");
  }
}

// Desvincular cliente
async function desvincularCliente(idAgenda, idCliente) {
  try {
    const response = await fetch(
      `http://localhost:3000/agendas/${idAgenda}/clientes/${idCliente}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Erro ao desvincular cliente");
    }

    mostrarFeedback("Cliente desvinculado com sucesso", "success");
    await carregarClientesVinculados(idAgenda);
  } catch (error) {
    console.error("Erro ao desvincular cliente:", error);
    mostrarFeedback("Erro ao desvincular cliente: " + error.message, "error");
  }
}

// Salvar agenda
async function salvarAgenda(event) {
  event.preventDefault();

  const form = event.target;
  const id = form.querySelector("#agenda-id").value;

  const data = {
    id_modalidade: form.querySelector("#agenda-modalidade").value,
    id_instrutor: form.querySelector("#agenda-instrutor").value,
    descricao: form.querySelector("#agenda-descricao").value,
    qtde_max_cli: form.querySelector("#agenda-qtde-max").value,
    local: form.querySelector("#agenda-local").value,
    data_ini: form.querySelector("#agenda-data-ini").value,
    data_fim: form.querySelector("#agenda-data-fim").value,
    diadasemana: form.querySelector("#agenda-dia").value,
  };

  // Validar horários
  if (data.data_ini && data.data_fim) {
    const horaIni = new Date(`1970-01-01T${data.data_ini}:00`);
    const horaFim = new Date(`1970-01-01T${data.data_fim}:00`);

    if (horaFim <= horaIni) {
      mostrarFeedback("O horário final deve ser após o inicial", "error");
      return;
    }
  }

  // Se estamos editando, incluir o ID
  if (id) {
    data.id_agenda = id;
  }

  try {
    const response = await fetch("http://localhost:3000/agendas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Erro ao salvar agenda");
    }

    mostrarFeedback(result.message, "success");
    fecharModalAgenda();
    await carregarAgendas();
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
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Erro ao excluir agenda");
    }

    mostrarFeedback("Agenda excluída com sucesso", "success");
    await carregarAgendas();
  } catch (error) {
    console.error("Erro ao excluir agenda:", error);
    mostrarFeedback("Erro ao excluir agenda: " + error.message, "error");
  }
}

function fecharModalAgenda() {
  document.getElementById("form-agenda").style.display = "none";
}

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  // Configurar abas
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelector(".tab-btn.active").classList.remove("active");
      this.classList.add("active");
      currentDay = this.dataset.day;
      carregarAgendas(currentDay);
    });
  });

  // Botão nova agenda
  document
    .getElementById("btn-nova-agenda")
    .addEventListener("click", abrirFormularioAgenda);

  // Botão cancelar
  document
    .getElementById("btn-cancelar-agenda")
    .addEventListener("click", fecharModalAgenda);

  // Formulário de agenda
  document
    .getElementById("form-agenda")
    .addEventListener("submit", salvarAgenda);

  // Vincular cliente
  document
    .getElementById("btn-vincular-cliente")
    .addEventListener("click", vincularCliente);

  // Carregar dados iniciais
  carregarDependencias();
  carregarAgendas();
});
