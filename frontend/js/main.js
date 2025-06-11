// Função para carregar os dados dos clientes e exibi-los como cards
async function carregarClientes() {
  const res = await fetch('http://localhost:3000/clientes'); // Chama a API de clientes
  const clientes = await res.json();

  const clientesList = document.getElementById('clientes-list');
  clientesList.innerHTML = ''; // Limpa a lista antes de adicionar novos itens

  clientes.forEach(cliente => {
    // Criar o card de cada cliente
    const card = document.createElement('div');
    card.classList.add('cliente-card');
    card.innerHTML = `
      <h2>${cliente.cliente_nome}</h2>
      <p>CPF: ${cliente.cpf}</p>
      <p>Email: ${cliente.email}</p>
      <p>Instrutor: ${cliente.instrutor_nome}</p>
      <p>Contrato: ${cliente.contrato_nome} - R$ ${cliente.contrato_valor}</p>
      <button onclick="removerCliente(${cliente.id_cliente})">Remover</button>
    `;
    clientesList.appendChild(card);
  });
}

// Função para remover um cliente
async function removerCliente(id) {
  const res = await fetch(`http://localhost:3000/clientes/${id}`, {
    method: 'DELETE'
  });

  if (res.ok) {
    // Atualiza a lista de clientes após a remoção
    carregarClientes();
  } else {
    alert('Erro ao remover o cliente');
  }
}

// Carregar clientes ao carregar a página
window.onload = carregarClientes;
