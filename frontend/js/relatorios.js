// Funções auxiliares
function formatarCPF(cpf) {
  if (!cpf) return "";
  const numeros = cpf.replace(/\D/g, "");
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function mostrarFeedback(mensagem, tipo = "success") {
  const feedback = document.createElement("div");
  feedback.className = `feedback ${tipo}`;
  feedback.innerHTML = `<span>${mensagem}</span>`;
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.classList.add("show");
    setTimeout(() => {
      feedback.classList.remove("show");
      setTimeout(() => feedback.remove(), 300);
    }, 3000);
  }, 10);
}

// Carregar Contratos para o Filtro
async function carregarContratos() {
  try {
    const response = await fetch(`${API_BASE_URL}/contratos`);
    
    if (!response.ok) {
      throw new Error('Erro ao carregar contratos');
    }
    
    const contratos = await response.json();
    selectContrato.innerHTML = '<option value="">Selecione um contrato</option>';
    
    contratos.forEach(contrato => {
      const option = document.createElement('option');
      option.value = contrato.id_contrato;
      option.textContent = contrato.nome;
      selectContrato.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar contratos:', error);
    mostrarFeedback('Erro ao carregar lista de contratos', 'error');
    selectContrato.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

// Carregar Instrutores para o Filtro
async function carregarInstrutores() {
  try {
    const response = await fetch(`${API_BASE_URL}/instrutores`);
    
    if (!response.ok) {
      throw new Error('Erro ao carregar instrutores');
    }
    
    const instrutores = await response.json();
    selectInstrutor.innerHTML = '<option value="">Selecione um instrutor</option>';
    
    // Filtrar apenas instrutores ativos no frontend
    const instrutoresAtivos = instrutores.filter(instrutor => instrutor.situacao);
    
    instrutoresAtivos.forEach(instrutor => {
      const option = document.createElement('option');
      option.value = instrutor.id_instrutor;
      option.textContent = instrutor.nome;
      selectInstrutor.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar instrutores:', error);
    mostrarFeedback('Erro ao carregar lista de instrutores', 'error');
    selectInstrutor.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

// Filtrar Clientes
async function filtrarClientes() {
  try {
    loading.style.display = 'block';
    noResults.style.display = 'none';
    tableBody.innerHTML = '';
    
    const contratoId = selectContrato.value;
    const instrutorId = selectInstrutor.value;
    
    if (!contratoId && !instrutorId) {
      mostrarFeedback('Selecione pelo menos um filtro', 'error');
      loading.style.display = 'none';
      return;
    }
    
    let url = `${API_BASE_URL}/relatorios/clientes-por-modalidade?`;
    if (contratoId) url += `modalidade=${encodeURIComponent(contratoId)}`;
    if (instrutorId) url += `&instrutor=${encodeURIComponent(instrutorId)}`;
    
    console.log('URL:', url);
    
    const response = await fetch(url);
    
    // Verificação robusta de erro
    if (!response.ok) {
      let errorMsg = `Erro ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
        if (errorData.error) errorMsg += ` - ${errorData.error}`;
      } catch (e) {
        const text = await response.text();
        errorMsg += ` - Resposta: ${text.slice(0, 100)}`;
      }
      throw new Error(errorMsg);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro na resposta do servidor');
    }
    
    exibirClientes(result.data);
  } catch (error) {
    console.error('Erro ao filtrar:', error);
    mostrarFeedback(`Falha: ${error.message}`, 'error');
    loading.style.display = 'none';
  }
}

// Exibir Clientes na Tabela
function exibirClientes(clientes) {
  tableBody.innerHTML = '';
  
  if (!clientes || clientes.length === 0) {
    noResults.style.display = 'block';
    noResults.innerHTML = `
      <i class="fas fa-info-circle"></i>
      <p>Nenhum cliente encontrado para o filtro selecionado</p>
    `;
    loading.style.display = 'none';
    return;
  }
  
  clientes.forEach(cliente => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cliente.id_cliente}</td>
      <td>${cliente.nome}</td>
      <td>${formatarCPF(cliente.cpf)}</td>
      <td>${cliente.email || '-'}</td>
      <td>${cliente.telefone || '-'}</td>
      <td>${cliente.contrato_nome || '-'}</td>
      <td>${cliente.instrutor_nome || '-'}</td>
    `;
    tableBody.appendChild(row);
  });
  
  loading.style.display = 'none';
}

// Exportar para Excel
function exportarParaExcel() {
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  if (rows.length === 0) {
    mostrarFeedback('Nenhum dado para exportar', 'error');
    return;
  }
  
  let csv = 'ID,Nome,CPF,Email,Telefone,Contrato,Instrutor\n';
  
  rows.forEach(row => {
    const cols = row.querySelectorAll('td');
    const rowData = Array.from(cols).map(col => {
      let text = col.textContent || '';
      return text.includes(',') ? `"${text}"` : text;
    });
    csv += rowData.join(',') + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_clientes_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Constantes e variáveis globais
const API_BASE_URL = 'http://localhost:3000';

// Elementos DOM
const selectContrato = document.getElementById('selectContrato');
const selectInstrutor = document.getElementById('selectInstrutor');
const btnFiltrar = document.getElementById('btnFiltrar');
const btnExportar = document.getElementById('btnExportar');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const tableBody = document.getElementById('tableBody');

// Inicialização da página
document.addEventListener('DOMContentLoaded', () => {
  // Carregar dados iniciais
  carregarContratos();
  carregarInstrutores();
  
  // Configurar eventos
  btnFiltrar.addEventListener('click', filtrarClientes);
  btnExportar.addEventListener('click', exportarParaExcel);
});