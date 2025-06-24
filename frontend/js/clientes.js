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

  if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
    return dataString;
  }

  if (typeof dataString === "string" && dataString.includes("/")) {
    const [day, month, year] = dataString.split("/");
    if (day && month && year) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  return null;
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
    console.log("Resposta da API:", res);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.log("Erro detalhado:", errorData);
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

      let statusContrato = "";
      if (cliente.dias_restantes !== null) {
        if (cliente.dias_restantes > 0) {
          statusContrato = `<div class="contract-days remaining">${cliente.dias_restantes} dias restantes</div>`;
        } else if (cliente.dias_restantes === 0) {
          statusContrato = `<div class="contract-days expiring">Último dia</div>`;
        } else {
          statusContrato = `<div class="contract-days expired">Expirado há ${Math.abs(
            cliente.dias_restantes
          )} dias</div>`;
        }
      } else {
        statusContrato = `<div class="contract-days unknown">Duração não definida</div>`;
      }

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
          ${statusContrato}
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

async function editarCliente(id) {
  try {
    console.log(`Tentando editar cliente com ID: ${id}`);

    const res = await fetch(`http://localhost:3000/clientes/${id}`);

    console.log("Status da resposta:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resposta não OK:", errorText);
      throw new Error("Cliente não encontrado");
    }

    const response = await res.json();
    console.log("Dados recebidos:", response);

    const cliente = response.data || response;

    if (!cliente || !cliente.id_cliente) {
      throw new Error("Dados do cliente inválidos");
    }

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

    if (cliente.data_inicio_contrato) {
      setValueIfExists(
        "data_inicio_contrato",
        cliente.data_inicio_contrato.split("T")[0]
      );
    }

    setValueIfExists("sexo", cliente.sexo);
    setValueIfExists("rua", cliente.rua);
    setValueIfExists("bairro", cliente.bairro);
    setValueIfExists("cidade", cliente.cidade);
    setValueIfExists("cep", cliente.cep);

    await carregarInstrutores();
    await carregarContratos();

    setTimeout(() => {
      if (cliente.id_instrutor) {
        setValueIfExists("id_instrutor", cliente.id_instrutor);
      }

      if (cliente.id_contrato) {
        setValueIfExists("id_contrato", cliente.id_contrato);
      }
    }, 100);

    abrirModal(true);
  } catch (error) {
    console.error("Erro ao editar cliente:", error);
    mostrarFeedback(error.message, "error");
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
    id_contrato: rawData.id_contrato ? parseInt(rawData.id_contrato) : null, // Adicionado verificação
    data_nascimento: formatarDataParaBackend(rawData.data_nascimento),
    data_inicio_contrato: formatarDataParaBackend(rawData.data_inicio_contrato),
  };

  if (!data.id_contrato) {
    mostrarFeedback("Selecione um contrato válido", "error");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isEdit ? { id_cliente: parseInt(isEdit), ...data } : data
      ),
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
