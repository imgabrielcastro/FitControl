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

// CRUD Modalidades
async function carregarModalidades() {
  try {
    console.log("Iniciando carregamento de modalidades...");
    const response = await fetch("http://localhost:3000/modalidades");

    console.log("Resposta da API:", response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }

    const { data: modalidades, message } = await response.json();
    console.log("Modalidades recebidas:", modalidades);

    const modalidadesGrid = document.getElementById("modalidades-list");
    if (!modalidadesGrid) {
      console.warn("Elemento modalidades-list não encontrado no DOM");
      return;
    }

    modalidadesGrid.innerHTML = "";

    if (!modalidades || modalidades.length === 0) {
      modalidadesGrid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-info-circle"></i>
          <p>Nenhuma modalidade cadastrada</p>
        </div>
      `;
      return;
    }

    modalidades.forEach((modalidade, index) => {
      const card = document.createElement("div");
      card.className = "client-card fade-in";
      card.style.animationDelay = `${0.1 * index}s`;
      card.dataset.status = modalidade.ativo ? "true" : "false";

      card.innerHTML = `
        <div class="client-header">
          <div class="client-avatar">${modalidade.nome.charAt(0).toUpperCase()}</div>
          <div class="client-name">${modalidade.nome}</div>
        </div>
        <div class="client-details">
          <div class="detail-item">
            <div class="detail-label">Status:</div>
            <div class="detail-value">
              <span class="status-badge ${modalidade.ativo ? "active" : "inactive"}">
                ${modalidade.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Data Criação:</div>
            <div class="detail-value">${modalidade.data_criacao}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Última Atualização:</div>
            <div class="detail-value">${modalidade.data_atualizacao || "N/A"}</div>
          </div>
        </div>
        <div class="client-actions">
          <button class="btn btn-edit" data-id="${modalidade.id_modalidade}">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn ${modalidade.ativo ? "btn-remove" : "btn-activate"}" data-id="${modalidade.id_modalidade}">
            <i class="fas ${modalidade.ativo ? "fa-ban" : "fa-check"}"></i> 
            ${modalidade.ativo ? "Inativar" : "Ativar"}
          </button>
        </div>
      `;

      modalidadesGrid.appendChild(card);
    });

    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => editarModalidade(btn.dataset.id));
    });

    document.querySelectorAll(".btn-remove, .btn-activate").forEach((btn) => {
      btn.addEventListener("click", () => alternarStatusModalidade(btn.dataset.id));
    });

    mostrarFeedback(message || "Modalidades carregadas com sucesso", "success");
  } catch (error) {
    console.error("Erro ao carregar modalidades:", error);
    mostrarFeedback(error.message || "Erro ao carregar modalidades", "error");
  }
}

async function editarModalidade(id) {
  try {
    console.log(`Editando modalidade ID: ${id}`);
    const response = await fetch(`http://localhost:3000/modalidades/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Modalidade não encontrada");
    }

    const { data: modalidade } = await response.json();

    document.getElementById("modalidade-nome").value = modalidade.nome || "";
    document.getElementById("modalidade-ativo").value = modalidade.ativo ? "true" : "false";

    const form = document.getElementById("form-cadastro-modalidade");
    form.dataset.editId = id;

    document.getElementById("modal-title").textContent = "Editar Modalidade";
    document.getElementById("modal-submit-btn").textContent = "Salvar Alterações";

    document.getElementById("modal-cadastro").style.display = "block";
  } catch (error) {
    console.error("Erro ao editar modalidade:", error);
    mostrarFeedback(error.message, "error");
  }
}

async function alternarStatusModalidade(id) {
  try {
    const confirmacao = confirm("Tem certeza que deseja alterar o status desta modalidade?");
    if (!confirmacao) return;

    console.log(`Alternando status da modalidade ID: ${id}`);
    const response = await fetch(`http://localhost:3000/modalidades/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro ao alterar status");
    }

    const { message } = await response.json();
    mostrarFeedback(message || "Status da modalidade atualizado com sucesso", "success");
    await carregarModalidades();
  } catch (error) {
    console.error("Erro ao alternar status:", error);
    mostrarFeedback(error.message, "error");
  }
}

async function salvarModalidade(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const isEdit = form.dataset.editId;

  const data = {
    nome: formData.get("nome"),
    ativo: formData.get("ativo") === "true",
  };

  try {
    const url = isEdit
      ? `http://localhost:3000/modalidades/${isEdit}`
      : "http://localhost:3000/modalidades";

    const method = isEdit ? "PUT" : "POST";

    console.log(`Enviando dados para: ${url}`, data);
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro ao salvar modalidade");
    }

    const { message } = await response.json();
    mostrarFeedback(
      message || (isEdit ? "Modalidade atualizada com sucesso" : "Modalidade cadastrada com sucesso"),
      "success"
    );

    fecharModalModalidade();
    await carregarModalidades();
  } catch (error) {
    console.error("Erro ao salvar modalidade:", error);
    mostrarFeedback(error.message, "error");
  }
}

function fecharModalModalidade() {
  document.getElementById("modal-cadastro").style.display = "none";
  const form = document.getElementById("form-cadastro-modalidade");
  form.reset();
  delete form.dataset.editId;
  document.getElementById("modal-title").textContent = "Cadastrar Nova Modalidade";
  document.getElementById("modal-submit-btn").textContent = "Salvar Modalidade";
}

// Inicialização
function initModalidades() {
  const btnNovaModalidade = document.getElementById("btn-nova-modalidade");
  const closeModal = document.querySelector("#modal-cadastro .close-modal");
  const formModalidade = document.getElementById("form-cadastro-modalidade");

  if (btnNovaModalidade) {
    btnNovaModalidade.addEventListener("click", () => {
      document.getElementById("modal-cadastro").style.display = "block";
    });
  }

  if (closeModal) {
    closeModal.addEventListener("click", fecharModalModalidade);
  }

  if (formModalidade) {
    formModalidade.addEventListener("submit", salvarModalidade);
  }

  carregarModalidades();
}

// Verifica se estamos na página de modalidades e inicializa
if (document.getElementById("modalidades-list")) {
  document.addEventListener("DOMContentLoaded", initModalidades);
}