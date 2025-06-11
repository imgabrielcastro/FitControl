// Função para carregar os dados dos clientes e exibi-los como cards
async function carregarClientes() {
  try {
    const res = await fetch('http://localhost:3000/clientes');
    const clientes = await res.json();

    const clientsGrid = document.getElementById('clientes-list');
    clientsGrid.innerHTML = ''; // Limpa a lista antes de adicionar novos itens

    clientes.forEach((cliente, index) => {
      // Criar o card de cada cliente com as classes corretas
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
            <div class="detail-value">${cliente.email}</div>
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

// Função auxiliar para formatar CPF
function formatarCPF(cpf) {
  // Remove caracteres não numéricos
  const numeros = cpf.replace(/\D/g, '');
  
  // Aplica a formatação
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para formatar valor monetário
function formatarValor(valor) {
  // Converte para número se for string
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
      // Animação de remoção
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

window.onload = carregarClientes;