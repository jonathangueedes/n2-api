var config = require('config.json');
var express = require('express');
var router = express.Router();
var perguntaService = require('services/pergunta.service');

// routes
router.get('/getAll', getPerguntas);
router.post('/register', registerPergunta);
router.get('/:_id', getCurrentPergunta);
router.put('/:_id', updatePergunta);
router.delete('/:_id', deletePergunta);

module.exports = router;

function getPerguntas(req, res) {
    perguntaService.getAll()
        .then(function (perguntas) {
            res.send(perguntas);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function registerPergunta(req, res) {
    perguntaService.create(req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getCurrentPergunta(req, res) {
    perguntaService.getById(req.params._id)
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

function updatePergunta(req, res) {
    perguntaService.update(req.params._id, req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function deletePergunta(req, res) {
    perguntaService.delete(req.params._id)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}