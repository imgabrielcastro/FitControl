const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const clienteRoutes = require('./routes/clientes');  
app.use('/clientes', clienteRoutes);  

const contratosRouter = require('./routes/contratos');
app.use('/contratos', contratosRouter);

const modalidadesRouter = require('./routes/modalidades');
app.use('/modalidades', modalidadesRouter);

const instrutoresRouter = require('./routes/instrutores');
app.use('/instrutores', instrutoresRouter);

const agendaRouter = require('./routes/agenda');
app.use('/agendas', agendaRouter); 

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

