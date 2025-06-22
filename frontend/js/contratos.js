// Funções auxiliares
function formatarValor(valor) {
  if (!valor) return "0,00";
  const num = typeof valor === "string" ? parseFloat(valor) : valor;
  return num.toFixed(2).replace(".", ",");
}

function formatarDuracao(dias) {
  if (!dias) return "Não definido";
  if (dias >= 30) {
    const meses = Math.floor(dias / 30);
    return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  }
  return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

// Modal
function abrirModal(edicao = false) {
  const modal = document.getElementById("modal-cadastro");
  const modalTitle = document.querySelector("#modal-cadastro h2");
  const submitButton = document.querySelector(
    '#form-cadastro-contrato button[type="submit"]'
  );

  modalTitle.textContent = edicao ? "Editar Contrato" : "Cadastrar Novo Contrato";
  submitButton.textContent = edicao ? "Salvar Edições" : "Cadastrar Contrato";
  modal.style.display = "block";
}

function fecharModal() {
  const modal = document.getElementById("modal-cadastro");
  const form = document.getElementById("form-cadastro-contrato");
  const submitButton = document.querySelector(
    '#form-cadastro-contrato button[type="submit"]'
  );

  modal.style.display = "none";
  form.reset();
  delete form.dataset.editId;
  submitButton.textContent = "Cadastrar Contrato";
}

// CRUD Contratos
async function carregarContratos() {
  try {
    const res = await fetch("http://localhost:3000/contratos");
    const contratos = await res.json();

    contratos.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    const contratosGrid = document.getElementById("contratos-list");
    contratosGrid.innerHTML = "";

    if (contratos.length === 0) {
      contratosGrid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-info-circle"></i>
          <p>Nenhum contrato cadastrado</p>
        </div>
      `;
      return;
    }

    contratos.forEach((contrato, index) => {
      const card = document.createElement("div");
      card.className = "client-card fade-in";
      card.style.animationDelay = `${0.1 * index}s`;
      card.dataset.status = contrato.ativo;

      card.innerHTML = `
        <div class="client-header">
          <div class="client-avatar" style="background-color: ${contrato.ativo ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'}">
            <i class="fas fa-file-contract" style="color: ${contrato.ativo ? '#2ecc71' : '#e74c3c'}"></i>
          </div>
          <div class="client-name">${contrato.nome || 'Contrato sem nome'}</div>
        </div>
        <div class="client-details">
          <div class="detail-item">
            <div class="detail-label">Duração:</div>
            <div class="detail-value">${formatarDuracao(contrato.duracao_contrato)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Acessos/dia:</div>
            <div class="detail-value">${contrato.qtde_acesso_dia || 'Ilimitado'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Status:</div>
            <div class="detail-value">
              <span class="status-badge ${contrato.ativo ? 'active' : 'inactive'}">
                ${contrato.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>
        <div class="contract-info">
          <div class="contract-name">Valor mensal</div>
          <div class="contract-value">R$ ${formatarValor(contrato.valor) || '0,00'}</div>
        </div>
        <div class="client-actions">
          <button class="btn btn-edit" onclick="editarContrato(${contrato.id_contrato})">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn ${contrato.ativo ? 'btn-remove' : 'btn-activate'}" 
            onclick="${contrato.ativo ? 'desativarContrato' : 'ativarContrato'}(${contrato.id_contrato})">
            <i class="fas ${contrato.ativo ? 'fa-times' : 'fa-check'}"></i> 
            ${contrato.ativo ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      `;

      contratosGrid.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao carregar contratos:", error);
    mostrarFeedback("Erro ao carregar lista de contratos", "error");
    
    const contratosGrid = document.getElementById("contratos-list");
    contratosGrid.innerHTML = `
      <div class="error-message">
        <p>Erro ao carregar contratos</p>
        <p>${error.message}</p>
      </div>
    `;
  }
}

async function editarContrato(id) {
  try {
    const res = await fetch(`http://localhost:3000/contratos/${id}`);
    if (!res.ok) throw new Error("Contrato não encontrado");

    const response = await res.json();
    const contrato = response.data || response;

    const form = document.getElementById("form-cadastro-contrato");
    form.dataset.editId = id;
    
    function setValueIfExists(id, value) {
      const element = document.getElementById(id);
      if (element) element.value = value || "";
    }
    
    setValueIfExists("nome", contrato.nome);
    setValueIfExists("duracao_contrato", contrato.duracao_contrato);
    setValueIfExists("qtde_acesso_dia", contrato.qtde_acesso_dia);
    setValueIfExists("valor", contrato.valor);

    abrirModal(true);
  } catch (error) {
    console.error("Erro ao editar contrato:", error);
    mostrarFeedback(error.message, "error");
  }
}

async function cadastrarContrato(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const rawData = Object.fromEntries(formData.entries());
  const isEdit = form.dataset.editId;

  const data = {
    ...rawData,
    duracao_contrato: rawData.duracao_contrato ? parseInt(rawData.duracao_contrato) : null,
    qtde_acesso_dia: rawData.qtde_acesso_dia ? parseInt(rawData.qtde_acesso_dia) : null,
    valor: parseFloat(rawData.valor) || 0,
  };

  try {
    const res = await fetch("http://localhost:3000/contratos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id_contrato: isEdit, ...data } : data),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erro ao salvar contrato");

    mostrarFeedback(result.message, "success");
    fecharModal();
    await carregarContratos();
  } catch (error) {
    console.error("Erro ao salvar contrato:", error);
    mostrarFeedback(error.message, "error");
  }
}

async function ativarContrato(id) {
  try {
    const res = await fetch(`http://localhost:3000/contratos/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: true }),
    });

    if (!res.ok) throw new Error("Erro ao ativar contrato");

    mostrarFeedback("Contrato ativado com sucesso", "success");
    await carregarContratos();
  } catch (error) {
    console.error("Erro ao ativar contrato:", error);
    mostrarFeedback(error.message, "error");
  }
}

async function desativarContrato(id) {
  if (!confirm("Tem certeza que deseja desativar este contrato?")) return;

  try {
    const res = await fetch(`http://localhost:3000/contratos/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: false }),
    });

    if (!res.ok) throw new Error("Erro ao desativar contrato");

    mostrarFeedback("Contrato desativado com sucesso", "success");
    await carregarContratos();
  } catch (error) {
    console.error("Erro ao desativar contrato:", error);
    mostrarFeedback(error.message, "error");
  }
}

// Feedback
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

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-novo-contrato").addEventListener("click", abrirModal);
  document.querySelector(".close-modal").addEventListener("click", fecharModal);
  document
    .getElementById("form-cadastro-contrato")
    .addEventListener("submit", cadastrarContrato);
  carregarContratos();
});