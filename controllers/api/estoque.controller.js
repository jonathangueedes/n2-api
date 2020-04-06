var config = require('config.json');
var express = require('express');
var router = express.Router();
var ProdutoService = require('services/estoque.service');

// routes
router.get('/getAll', getProdutos);
router.post('/register', registerProduto);
router.get('/:_id', getCurrentProduto);
router.put('/:_id', updateProduto);
router.delete('/:_id', deleteProduto);

module.exports = router;

function getProdutos(req, res) {
    ProdutoService.getAll()
        .then(function (Produtos) {
            res.send(Produtos);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function registerProduto(req, res) {
    ProdutoService.create(req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getCurrentProduto(req, res) {
    ProdutoService.getById(req.params._id)
        .then(function (user) {
            if (user) {
                res.send(user);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function updateProduto(req, res) {
    ProdutoService.update(req.params._id, req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function deleteProduto(req, res) {
    ProdutoService.delete(req.params._id)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}