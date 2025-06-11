const apiURL = 'http://localhost:3000/clientes';

const form = document.getElementById('clienteForm');
const lista = document.getElementById('clientesList');


const hamburgerMenu = document.getElementById('hamburger-menu');
const nav = document.getElementById('nav');

// Adiciona evento de clique no hambúrguer
hamburgerMenu.addEventListener('click', () => {
  // Alterna a classe 'open' no menu lateral
  nav.classList.toggle('open');
});

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const cliente = {
    nome: form.nome.value,
    cpf: form.cpf.value,
    telefone: form.telefone.value,
    email: form.email.value,
    sexo: form.sexo.value,
    data_nascimento: form.data_nascimento.value,
    rua: form.rua.value,
    bairro: form.bairro.value,
    cidade: form.cidade.value,
    cep: form.cep.value
  };

  await fetch(apiURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cliente)
  });

  form.reset();
  carregarClientes();
});

async function carregarClientes() {
  const res = await fetch(apiURL);
  const clientes = await res.json();

  lista.innerHTML = '';
  clientes.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'cliente-card';
    card.innerHTML = `
      <strong>${c.nome}</strong><br>
      CPF: ${c.cpf}<br>
      Email: ${c.email}<br>
      <button onclick="removerCliente(${c.id_cliente})">Remover</button>
    `;
    lista.appendChild(card);
  });
}

async function removerCliente(id) {
  await fetch(`${apiURL}/${id}`, { method: 'DELETE' });
  carregarClientes();
}

// Pega os elementos do hambúrguer e da navegação






carregarClientes();
