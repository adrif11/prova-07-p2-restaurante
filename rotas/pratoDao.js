const express = require('express');
const router = express.Router();
const mysql = require('./mysql');

function idValido(id) {
    return /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) <= 2147483647;
}

function dadosValidos(dados) {
    return dados && ['nome', 'categoria'].every(campo =>
        typeof dados[campo] === 'string' && dados[campo].trim().length > 0 &&
        dados[campo].length <= 255) &&
        typeof dados.preco === 'number' && Number.isFinite(dados.preco) &&
        dados.preco >= 0 && dados.preco <= 99999999.99 &&
        Math.abs(dados.preco * 100 - Math.round(dados.preco * 100)) < 0.00001;
}

// Padrão da aula: obter conexão, executar SQL com binding e liberar conexão.
function executar(sql, parametros, res, sucesso) {
    mysql.getConnection((erro, conexao) => {
        if (erro) {
            console.error('Erro de conexão:', erro.code);
            return res.status(500).json({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }
        conexao.query(sql, parametros, (erro, resultado) => {
            conexao.release();
            if (erro) {
                console.error('Erro ao executar SQL:', erro.code);
                return res.status(500).json({ mensagem: 'Erro ao executar operação no banco de dados.' });
            }
            sucesso(resultado);
        });
    });
}

router.get('/prato', (req, res) => {
    executar('SELECT id, nome, categoria, preco FROM prato ORDER BY id', [], res,
        pratos => res.status(200).json(pratos));
});

router.get('/prato/:id', (req, res) => {
    if (!idValido(req.params.id)) return res.status(400).json({ mensagem: 'ID inválido.' });
    executar('SELECT id, nome, categoria, preco FROM prato WHERE id = ?',
        [Number(req.params.id)], res, pratos => {
            if (!pratos.length) return res.status(404).json({ mensagem: 'Prato não encontrado.' });
            res.status(200).json(pratos[0]);
        });
});

router.post('/prato', (req, res) => {
    if (!dadosValidos(req.body)) return res.status(400).json({ mensagem: 'Informe nome, categoria e preco numérico não negativo com até duas casas decimais.' });
    const { nome, categoria, preco } = req.body;
    executar('INSERT INTO prato (nome, categoria, preco) VALUES (?, ?, ?)',
        [nome, categoria, preco], res, resultado =>
            res.status(201).json({ id: resultado.insertId, nome, categoria, preco }));
});

router.put('/prato/:id', (req, res) => {
    if (!idValido(req.params.id) || !dadosValidos(req.body)) return res.status(400).json({ mensagem: 'Informe ID válido, nome, categoria e preco numérico não negativo com até duas casas decimais.' });
    const id = Number(req.params.id);
    const { nome, categoria, preco } = req.body;
    executar('UPDATE prato SET nome = ?, categoria = ?, preco = ? WHERE id = ?',
        [nome, categoria, preco, id], res, resultado => {
            if (!resultado.affectedRows) return res.status(404).json({ mensagem: 'Prato não encontrado.' });
            res.status(200).json({ id, nome, categoria, preco });
        });
});

router.delete('/prato/:id', (req, res) => {
    if (!idValido(req.params.id)) return res.status(400).json({ mensagem: 'ID inválido.' });
    const id = Number(req.params.id);
    executar('DELETE FROM prato WHERE id = ?', [id], res, resultado => {
        if (!resultado.affectedRows) return res.status(404).json({ mensagem: 'Prato não encontrado.' });
        res.status(200).json({ mensagem: 'Prato excluído.', id });
    });
});

module.exports = router;
