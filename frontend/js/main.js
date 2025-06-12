// Variáveis globais
let instrutores = [];
let contratos = [];

// Função para carregar os dados dos clientes e exibi-los como cards
async function carregarClientes() {
  try {
    const res = await fetch('http://localhost:3000/clientes');
    const clientes = await res.json();

    const clientsGrid = document.getElementById('clientes-list');
    clientsGrid.innerHTML = ''; // Limpa a lista antes de adicionar novos itens

    clientes.forEach((cliente, index) => {
      const card = document.createElement('div');
      card.className = 'client-card fade-in';
      card.style.animationDelay = `${0.1 * index}s`;
      
      card.innerHTML = `
        <div class="client-header">
          <div class="client-avatar">${cliente.cliente_nome.charAt(0).toUpperCase()}</div>
          <div class="client-name">${cliente.cliente_nome}</div>
        </div>
        
        <div class="client-details">
          <div class="detail-item">
            <div class="detail-label">CPF:</div>
            <div class="detail-value">${formatarCPF(cliente.cpf)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Email:</div>
            <div class="detail-value">${cliente.email || 'Não informado'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Instrutor:</div>
            <div class="detail-value">${cliente.instrutor_nome || 'Não atribuído'}</div>
          </div>
        </div>
        
        <div class="contract-info">
          <div class="contract-name">${cliente.contrato_nome}</div>
          <div class="contract-value">R$ ${formatarValor(cliente.contrato_valor)}</div>
        </div>
        
        <div class="client-actions">
          <button class="btn btn-remove" onclick="removerCliente(${cliente.id_cliente})">
            <i class="fas fa-trash"></i> Remover
          </button>
        </div>
      `;
      
      clientsGrid.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
  }
}

// Função para carregar instrutores para o select
async function carregarInstrutores() {
  try {
    const res = await fetch('http://localhost:3000/instrutores');
    instrutores = await res.json();
    
    const select = document.getElementById('id_instrutor');
    select.innerHTML = '<option value="">Não atribuído</option>';
    
    instrutores.forEach(instrutor => {
      const option = document.createElement('option');
      option.value = instrutor.id_instrutor;
      option.textContent = instrutor.nome;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar instrutores:', error);
  }
}

// Função para carregar contratos para o select
async function carregarContratos() {
  try {
    const select = document.getElementById('id_contrato');
    select.innerHTML = '<option value="" selected disabled>Selecione um contrato</option>';
    
    // Mostra um estado de carregamento
    const loadingOption = document.createElement('option');
    loadingOption.textContent = 'Carregando contratos...';
    loadingOption.disabled = true;
    select.appendChild(loadingOption);

    const res = await fetch('http://localhost:3000/contratos');
    
    if (!res.ok) {
      throw new Error(`Erro HTTP: ${res.status}`);
    }

    const contratos = await res.json();
    
    // Limpa as opções de carregamento
    select.innerHTML = '<option value="" selected disabled>Selecione um contrato</option>';
    
    if (contratos.length === 0) {
      const noDataOption = document.createElement('option');
      noDataOption.textContent = 'Nenhum contrato cadastrado';
      noDataOption.disabled = true;
      select.appendChild(noDataOption);
      return;
    }
    
    contratos.forEach(contrato => {
      const option = document.createElement('option');
      option.value = contrato.id_contrato;
      option.textContent = `${contrato.nome} (R$ ${formatarValor(contrato.valor)})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar contratos:', error);
    const select = document.getElementById('id_contrato');
    select.innerHTML = '<option value="" selected disabled>Erro ao carregar contratos</option>';
    
    const errorOption = document.createElement('option');
    errorOption.textContent = 'Clique para tentar novamente';
    errorOption.value = "retry";
    select.appendChild(errorOption);
    
    select.addEventListener('change', function(e) {
      if (e.target.value === "retry") {
        carregarContratos();
      }
    });
  }
}

// Função para abrir o modal
function abrirModal() {
  const modal = document.getElementById('modal-cadastro');
  modal.style.display = 'block';
  carregarInstrutores();
  carregarContratos();
}

// Função para fechar o modal
function fecharModal() {
  const modal = document.getElementById('modal-cadastro');
  modal.style.display = 'none';
}

// Função para cadastrar novo cliente
async function cadastrarCliente(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const rawData = Object.fromEntries(formData.entries());
  
  // Formata os dados antes de enviar
  const data = {
    ...rawData,
    cpf: rawData.cpf.replace(/\D/g, ''), // Remove formatação do CPF
    telefone: rawData.telefone?.replace(/\D/g, '') || null,
    cep: rawData.cep?.replace(/\D/g, '') || null,
    id_instrutor: rawData.id_instrutor ? parseInt(rawData.id_instrutor) : null,
    id_contrato: parseInt(rawData.id_contrato),
    // Converte data para formato YYYY-MM-DD
    data_nascimento: rawData.data_nascimento ? formatarDataParaBackend(rawData.data_nascimento) : null
  };
  
  try {
    const res = await fetch('http://localhost:3000/clientes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      alert('Cliente cadastrado com sucesso!');
      fecharModal();
      form.reset();
      carregarClientes();
    } else {
      const error = await res.json();
      throw new Error(error.message || 'Erro ao cadastrar cliente');
    }
  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    alert(`Erro ao cadastrar cliente: ${error.message}`);
  }
}

// Adicione esta função auxiliar para formatar a data
function formatarDataParaBackend(dataString) {
  if (!dataString) return null;
  
  // Converte de DD/MM/YYYY para YYYY-MM-DD
  const parts = dataString.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dataString; // Retorna original se não puder converter
}

// Função auxiliar para formatar CPF
function formatarCPF(cpf) {
  const numeros = cpf.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para formatar valor monetário
function formatarValor(valor) {
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  return num.toFixed(2).replace('.', ',');
}

async function removerCliente(id) {
  if (!confirm('Tem certeza que deseja remover este cliente?')) {
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/clientes/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      const card = document.querySelector(`button[onclick="removerCliente(${id})"]`).closest('.client-card');
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.remove();
      }, 300);
    } else {
      throw new Error('Erro na resposta do servidor');
    }
  } catch (error) {
    console.error('Erro ao remover cliente:', error);
    alert('Erro ao remover cliente');
  }
}

// Adiciona máscaras aos campos
function aplicarMascaras() {
  // Máscara para CPF
  const cpfInput = document.getElementById('cpf');
  if (cpfInput) {
    cpfInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = value;
    });
  }
  
  // Máscara para telefone
  const telInput = document.getElementById('telefone');
  if (telInput) {
    telInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      value = value.replace(/(\d)(\d{4})$/, '$1-$2');
      e.target.value = value;
    });
  }
  
  // Máscara para CEP
  const cepInput = document.getElementById('cep');
  if (cepInput) {
    cepInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      value = value.replace(/^(\d{5})(\d)/, '$1-$2');
      e.target.value = value;
    });
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Modal
  const btnNovoCliente = document.getElementById('btn-novo-cliente');
  const modal = document.getElementById('modal-cadastro');
  const closeModal = document.querySelector('.close-modal');
  const formCadastro = document.getElementById('form-cadastro-cliente');
  
  if (btnNovoCliente) btnNovoCliente.addEventListener('click', abrirModal);
  if (closeModal) closeModal.addEventListener('click', fecharModal);
  if (formCadastro) formCadastro.addEventListener('submit', cadastrarCliente);
  
  // Fechar modal ao clicar fora
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      fecharModal();
    }
  });
  
  // Aplica máscaras
  aplicarMascaras();
  
  // Carrega clientes ao iniciar
  carregarClientes();
});