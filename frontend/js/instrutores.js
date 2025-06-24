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
          <div class="client-avatar">${instrutor.nome.charAt(0).toUpperCase()}</div>
          <div class="client-name">${instrutor.nome}</div>
        </div>
        <div class="client-details">
          <div class="detail-item">
            <div class="detail-label">CPF:</div>
            <div class="detail-value">${formatarCPF(instrutor.cpf)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Email:</div>
            <div class="detail-value">${instrutor.email || "Não informado"}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Telefone:</div>
            <div class="detail-value">${instrutor.telefone || "Não informado"}</div>
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
          <button class="btn btn-edit" onclick="editarInstrutor(${instrutor.id_instrutor})">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-remove" onclick="removerInstrutor(${instrutor.id_instrutor})">
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
    document.getElementById("situacao").value = instrutor.situacao ? "true" : "false";
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
  const termo = document.getElementById("search-instrutores").value.toLowerCase();
  const cards = document.querySelectorAll(".client-card");

  cards.forEach((card) => {
    const nome = card.querySelector(".client-name").textContent.toLowerCase();
    const cpf = card.querySelector(".detail-item:nth-child(1) .detail-value").textContent.toLowerCase();
    const email = card.querySelector(".detail-item:nth-child(2) .detail-value").textContent.toLowerCase();

    if (nome.includes(termo) || cpf.includes(termo) || email.includes(termo)) {
      card.style.display = "flex";
    } else {
      card.style.display = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-novo-instrutor").addEventListener("click", abrirModal);
  document.querySelector(".close-modal").addEventListener("click", fecharModal);
  document
    .getElementById("form-cadastro-instrutor")
    .addEventListener("submit", salvarInstrutor);
  document
    .getElementById("search-instrutores")
    .addEventListener("input", filtrarInstrutores);

  carregarInstrutores();
});