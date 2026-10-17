const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const pratoDao = require('./rotas/pratoDao');
app.use('/', pratoDao);

app.use((req, res) => res.status(404).json({ mensagem: 'Rota não encontrada.' }));
app.use((erro, req, res, next) => {
    if (erro.type === 'entity.parse.failed') {
        return res.status(400).json({ mensagem: 'JSON inválido.' });
    }
    console.error(erro.message);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
});

module.exports = app;
