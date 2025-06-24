function formatarCPF(cpf) {
  if (!cpf) return "";
  const numeros = cpf.replace(/\D/g, "");
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarValor(valor) {
  if (!valor) return "0,00";
  const num = typeof valor === "string" ? parseFloat(valor) : valor;
  return num.toFixed(2).replace(".", ",");
}

function formatarDataParaBackend(dataString) {
  if (!dataString) return null;
  const [day, month, year] = dataString.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function abrirModal(edicao = false) {
  const modal = document.getElementById("modal-cadastro");
  const modalTitle = document.querySelector("#modal-cadastro h2");
  const submitButton = document.querySelector(
    '#form-cadastro-cliente button[type="submit"]'
  );

  modalTitle.textContent = edicao ? "Editar Cliente" : "Cadastrar Novo Cliente";
  submitButton.textContent = edicao ? "Salvar Edições" : "Cadastrar Cliente";
  modal.style.display = "block";
}

function fecharModal() {
  const modal = document.getElementById("modal-cadastro");
  const form = document.getElementById("form-cadastro-cliente");
  const submitButton = document.querySelector(
    '#form-cadastro-cliente button[type="submit"]'
  );

  modal.style.display = "none";
  form.reset();
  delete form.dataset.editId;
  submitButton.textContent = "Cadastrar Cliente";
}

async function carregarInstrutores() {
  try {
    const res = await fetch("http://localhost:3000/instrutores");
    const instrutores = await res.json();
    const select = document.getElementById("id_instrutor");
    select.innerHTML = '<option value="">Não atribuído</option>';

    instrutores.forEach((instrutor) => {
      const option = document.createElement("option");
      option.value = instrutor.id_instrutor;
      option.textContent = instrutor.nome;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar instrutores:", error);
  }
}

async function editarCliente(id) {
  try {
    const res = await fetch(`http://localhost:3000/clientes/${id}`);
    if (!res.ok) throw new Error("Cliente não encontrado");

    const response = await res.json();
    const cliente = response.data || response;

    const form = document.getElementById("form-cadastro-cliente");
    if (!form) {
      throw new Error("Formulário de cliente não encontrado");
    }

    form.dataset.editId = id;

    function setValueIfExists(id, value) {
      const element = document.getElementById(id);
      if (element) element.value = value || "";
    }

    setValueIfExists("nome", cliente.nome);
    setValueIfExists("cpf", formatarCPF(cliente.cpf));
    setValueIfExists("telefone", cliente.telefone);
    setValueIfExists("email", cliente.email);

    if (cliente.data_nascimento) {
      const dataParts = cliente.data_nascimento.split("-");
      if (dataParts.length === 3) {
        setValueIfExists(
          "data_nascimento",
          `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`
        );
      }
    }

    setValueIfExists("sexo", cliente.sexo);
    setValueIfExists("rua", cliente.rua);
    setValueIfExists("bairro", cliente.bairro);
    setValueIfExists("cidade", cliente.cidade);
    setValueIfExists("cep", cliente.cep);
    setValueIfExists("observacoes", cliente.observacoes);

    await carregarInstrutores();
    await carregarContratos();

    if (cliente.id_instrutor) {
      setValueIfExists("id_instrutor", cliente.id_instrutor);
    }

    if (cliente.id_contrato) {
      setValueIfExists("id_contrato", cliente.id_contrato);
    }

    abrirModal(true);
  } catch (error) {
    console.error("Erro ao editar cliente:", error);
    mostrarFeedback(error.message, "error");
  }
}

async function carregarContratos() {
  try {
    const res = await fetch("http://localhost:3000/contratos");
    const contratos = await res.json();
    const select = document.getElementById("id_contrato");
    select.innerHTML =
      '<option value="" disabled selected>Selecione um contrato</option>';

    contratos.forEach((contrato) => {
      const option = document.createElement("option");
      option.value = contrato.id_contrato;
      option.textContent = `${contrato.nome} (R$ ${formatarValor(
        contrato.valor
      )})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar contratos:", error);
  }
}

async function carregarClientes() {
  try {
    console.log("Iniciando carregamento de clientes...");
    const res = await fetch("http://localhost:3000/clientes");

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP: ${res.status}`);
    }

    let clientes = await res.json();
    console.log("Dados recebidos:", clientes);

    clientes.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

    const clientsGrid = document.getElementById("clientes-list");
    if (!clientsGrid) {
      throw new Error("Elemento clientes-list não encontrado no DOM");
    }

    clientsGrid.innerHTML = "";

    if (clientes.length === 0) {
      clientsGrid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-info-circle"></i>
          <p>Nenhum cliente cadastrado</p>
        </div>
      `;
      return;
    }

    clientes.forEach((cliente, index) => {
      const card = document.createElement("div");
      card.className = "client-card fade-in";
      card.style.animationDelay = `${0.1 * index}s`;

      card.innerHTML = `
        <div class="client-header">
          <div class="client-avatar">${
            cliente.nome?.charAt(0)?.toUpperCase() || "C"
          }</div>
          <div class="client-name">${cliente.nome || "Cliente sem nome"}</div>
        </div>
        <div class="client-details">
          <div class="detail-item">
            <div class="detail-label">CPF:</div>
            <div class="detail-value">${
              formatarCPF(cliente.cpf) || "Não informado"
            }</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Email:</div>
            <div class="detail-value">${cliente.email || "Não informado"}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Instrutor:</div>
            <div class="detail-value">${
              cliente.instrutor_nome || "Não atribuído"
            }</div>
          </div>
        </div>
        <div class="contract-info">
          <div class="contract-name">${
            cliente.contrato_nome || "Contrato não informado"
          }</div>
          <div class="contract-value">R$ ${
            formatarValor(cliente.contrato_valor) || "0,00"
          }</div>
        </div>
        <div class="client-actions">
          <button class="btn btn-edit" onclick="editarCliente(${
            cliente.id_cliente
          })">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-remove" onclick="removerCliente(${
            cliente.id_cliente
          })">
            <i class="fas fa-trash"></i> Remover
          </button>
        </div>
      `;

      clientsGrid.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
    mostrarFeedback("Erro ao carregar lista de clientes", "error");

    const clientsGrid = document.getElementById("clientes-list");
    if (clientsGrid) {
      clientsGrid.innerHTML = `
        <div class="error-message">
          <p>Erro ao carregar clientes</p>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
}

async function cadastrarCliente(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const rawData = Object.fromEntries(formData.entries());
  const isEdit = form.dataset.editId;

  const data = {
    ...rawData,
    cpf: rawData.cpf.replace(/\D/g, ""),
    telefone: rawData.telefone?.replace(/\D/g, "") || null,
    cep: rawData.cep?.replace(/\D/g, "") || null,
    id_instrutor: rawData.id_instrutor ? parseInt(rawData.id_instrutor) : null,
    id_contrato: parseInt(rawData.id_contrato),
    data_nascimento: rawData.data_nascimento
      ? formatarDataParaBackend(rawData.data_nascimento)
      : null,
  };

  try {
    const res = await fetch("http://localhost:3000/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id_cliente: isEdit, ...data } : data),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erro ao salvar cliente");

    mostrarFeedback(result.message, "success");
    fecharModal();
    await carregarClientes();
  } catch (error) {
    console.error("Erro ao salvar cliente:", error);
    mostrarFeedback(error.message, "error");
  }
}

async function removerCliente(id) {
  if (!confirm("Tem certeza que deseja remover este cliente?")) return;

  try {
    const res = await fetch(`http://localhost:3000/clientes/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Erro ao remover cliente");

    mostrarFeedback("Cliente removido com sucesso", "success");
    await carregarClientes();
  } catch (error) {
    console.error("Erro ao remover cliente:", error);
    mostrarFeedback(error.message, "error");
  }
}

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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-novo-cliente").addEventListener("click", () => {
    abrirModal();
    carregarInstrutores();
    carregarContratos();
  });

  document.querySelector(".close-modal").addEventListener("click", fecharModal);
  document
    .getElementById("form-cadastro-cliente")
    .addEventListener("submit", cadastrarCliente);
  carregarClientes();
});

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
          <div class="client-avatar">${modalidade.nome
            .charAt(0)
            .toUpperCase()}</div>
          <div class="client-name">${modalidade.nome}</div>
        </div>
        <div class="client-details">
          <div class="detail-item">
            <div class="detail-label">Status:</div>
            <div class="detail-value">
              <span class="status-badge ${
                modalidade.ativo ? "active" : "inactive"
              }">
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
            <div class="detail-value">${
              modalidade.data_atualizacao || "N/A"
            }</div>
          </div>
        </div>
        <div class="client-actions">
          <button class="btn btn-edit" data-id="${modalidade.id_modalidade}">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn ${
            modalidade.ativo ? "btn-remove" : "btn-activate"
          }" data-id="${modalidade.id_modalidade}">
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
      btn.addEventListener("click", () =>
        alternarStatusModalidade(btn.dataset.id)
      );
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
    document.getElementById("modalidade-ativo").value = modalidade.ativo
      ? "true"
      : "false";

    const form = document.getElementById("form-cadastro-modalidade");
    form.dataset.editId = id;

    document.getElementById("modal-title").textContent = "Editar Modalidade";
    document.getElementById("modal-submit-btn").textContent =
      "Salvar Alterações";

    document.getElementById("modal-cadastro").style.display = "block";
  } catch (error) {
    console.error("Erro ao editar modalidade:", error);
    mostrarFeedback(error.message, "error");
  }
}

async function alternarStatusModalidade(id) {
  try {
    const confirmacao = confirm(
      "Tem certeza que deseja alterar o status desta modalidade?"
    );
    if (!confirmacao) return;

    console.log(`Alternando status da modalidade ID: ${id}`);
    const response = await fetch(
      `http://localhost:3000/modalidades/${id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro ao alterar status");
    }

    const { message } = await response.json();
    mostrarFeedback(
      message || "Status da modalidade atualizado com sucesso",
      "success"
    );
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
      message ||
        (isEdit
          ? "Modalidade atualizada com sucesso"
          : "Modalidade cadastrada com sucesso"),
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
  document.getElementById("modal-title").textContent =
    "Cadastrar Nova Modalidade";
  document.getElementById("modal-submit-btn").textContent = "Salvar Modalidade";
}

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

if (document.getElementById("modalidades-list")) {
  document.addEventListener("DOMContentLoaded", initModalidades);
}

function formatarCPF(cpf) {
  if (!cpf) return "";
  const numeros = cpf.replace(/\D/g, "");
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

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

async function carregarInstrutores() {
  try {
    const res = await fetch("http://localhost:3000/instrutores");
    const instrutores = await res.json();

    const instrutoresGrid = document.getElementById("instrutores-list");
    instrutoresGrid.innerHTML = "";

    if (instrutores.length === 0) {
      instrutoresGrid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-info-circle"></i>
          <p>Nenhum instrutor cadastrado</p>
        </div>
      `;
      return;
    }

    instrutores.forEach((instrutor, index) => {
      const card = document.createElement("div");
      card.className = "client-card fade-in";
      card.style.animationDelay = `${0.1 * index}s`;

      card.innerHTML = `
        <div class="client-header">
          <div class="client-avatar">${instrutor.nome
            .charAt(0)
            .toUpperCase()}</div>
          <div class="client-name">${instrutor.nome}</div>
        </div>
        <div class="client-details">
          <div class="detail-item">
            <div class="detail-label">CPF:</div>
            <div class="detail-value">${formatarCPF(instrutor.cpf)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Email:</div>
            <div class="detail-value">${
              instrutor.email || "Não informado"
            }</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Telefone:</div>
            <div class="detail-value">${
              instrutor.telefone || "Não informado"
            }</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Sexo:</div>
            <div class="detail-value">${
              instrutor.sexo === "M" ? "Masculino" : "Feminino"
            }</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Situação:</div>
            <div class="detail-value">
              <span class="status-badge ${
                instrutor.situacao ? "active" : "inactive"
              }">
                ${instrutor.situacao ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>
        <div class="client-actions">
          <button class="btn btn-edit" onclick="editarInstrutor(${
            instrutor.id_instrutor
          })">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-remove" onclick="removerInstrutor(${
            instrutor.id_instrutor
          })">
            <i class="fas fa-trash"></i> Remover
          </button>
        </div>
      `;

      instrutoresGrid.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao carregar instrutores:", error);
    mostrarFeedback("Erro ao carregar lista de instrutores", "error");
  }
}

async function editarInstrutor(id) {
  try {
    const res = await fetch(`http://localhost:3000/instrutores/${id}`);
    if (!res.ok) throw new Error("Instrutor não encontrado");

    const instrutor = await res.json();

    document.getElementById("id_instrutor").value = instrutor.id_instrutor;
    document.getElementById("nome").value = instrutor.nome || "";
    document.getElementById("cpf").value = formatarCPF(instrutor.cpf) || "";
    document.getElementById("telefone").value = instrutor.telefone || "";
    document.getElementById("email").value = instrutor.email || "";
    document.getElementById("sexo").value = instrutor.sexo || "";
    document.getElementById("situacao").value = instrutor.situacao
      ? "true"
      : "false";
    document.getElementById("rua").value = instrutor.rua || "";
    document.getElementById("bairro").value = instrutor.bairro || "";
    document.getElementById("cidade").value = instrutor.cidade || "";
    document.getElementById("cep").value = instrutor.cep || "";

    const modal = document.getElementById("modal-cadastro");
    const modalTitle = document.querySelector("#modal-cadastro h2");
    const submitButton = document.querySelector(
      '#form-cadastro-instrutor button[type="submit"]'
    );

    modalTitle.textContent = "Editar Instrutor";
    submitButton.textContent = "Salvar Alterações";
    modal.style.display = "block";
  } catch (error) {
    console.error("Erro ao editar instrutor:", error);
    mostrarFeedback(error.message, "error");
  }
}

async function salvarInstrutor(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const rawData = Object.fromEntries(formData.entries());
  const isEdit = !!rawData.id_instrutor;

  const data = {
    ...rawData,
    cpf: rawData.cpf.replace(/\D/g, ""),
    telefone: rawData.telefone?.replace(/\D/g, "") || null,
    cep: rawData.cep?.replace(/\D/g, "") || null,
    situacao: rawData.situacao === "true",
  };

  try {
    const res = await fetch("http://localhost:3000/instrutores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isEdit ? { id_instrutor: rawData.id_instrutor, ...data } : data
      ),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erro ao salvar instrutor");

    mostrarFeedback(result.message, "success");
    fecharModal();
    await carregarInstrutores();
  } catch (error) {
    console.error("Erro ao salvar instrutor:", error);
    mostrarFeedback(error.message, "error");
  }
}

async function removerInstrutor(id) {
  if (!confirm("Tem certeza que deseja remover este instrutor?")) return;

  try {
    const res = await fetch(`http://localhost:3000/instrutores/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Erro ao remover instrutor");

    mostrarFeedback("Instrutor removido com sucesso", "success");
    await carregarInstrutores();
  } catch (error) {
    console.error("Erro ao remover instrutor:", error);
    mostrarFeedback(error.message, "error");
  }
}

function abrirModal() {
  const modal = document.getElementById("modal-cadastro");
  const modalTitle = document.querySelector("#modal-cadastro h2");
  const submitButton = document.querySelector(
    '#form-cadastro-instrutor button[type="submit"]'
  );

  modalTitle.textContent = "Cadastrar Novo Instrutor";
  submitButton.textContent = "Cadastrar Instrutor";
  modal.style.display = "block";
}

function fecharModal() {
  const modal = document.getElementById("modal-cadastro");
  const form = document.getElementById("form-cadastro-instrutor");

  modal.style.display = "none";
  form.reset();
  form.removeAttribute("data-edit-id");
}

function filtrarInstrutores() {
  const termo = document
    .getElementById("search-instrutores")
    .value.toLowerCase();
  const cards = document.querySelectorAll(".client-card");

  cards.forEach((card) => {
    const nome = card.querySelector(".client-name").textContent.toLowerCase();
    const cpf = card
      .querySelector(".detail-item:nth-child(1) .detail-value")
      .textContent.toLowerCase();
    const email = card
      .querySelector(".detail-item:nth-child(2) .detail-value")
      .textContent.toLowerCase();

    if (nome.includes(termo) || cpf.includes(termo) || email.includes(termo)) {
      card.style.display = "flex";
    } else {
      card.style.display = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btn-novo-instrutor")
    .addEventListener("click", abrirModal);
  document.querySelector(".close-modal").addEventListener("click", fecharModal);
  document
    .getElementById("form-cadastro-instrutor")
    .addEventListener("submit", salvarInstrutor);
  document
    .getElementById("search-instrutores")
    .addEventListener("input", filtrarInstrutores);

  carregarInstrutores();
});
