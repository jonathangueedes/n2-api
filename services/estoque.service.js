var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('estoque');

var service = {};

service.getAll = getAll;
service.authenticate = authenticate;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;
service.getProdutoId = getProdutoId;

module.exports = service;

function getAll() {
    var deferred = Q.defer();

    db.estoque.find({}).toArray(function (err, produtos) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        deferred.resolve(produtos);
    });

    return deferred.promise;
}

function getProdutoId(codigoItem) {
    var deferred = Q.defer();
    db.estoque.findOne(
        { codigoItem },
        function (err, user) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (user) {
                // username already exists
                deferred.resolve(produtos);
            } 
            
        });
    }

function authenticate(username, password) {
    var deferred = Q.defer();

    db.estoque.findOne({ username: username }, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user && bcrypt.compareSync(password, user.hash)) {
            // authentication successful
            deferred.resolve({token :jwt.sign({ sub: user._id }, config.secret), userId: user._id});
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();

    db.estoque.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user) {
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(produtoParam) {
    var deferred = Q.defer();

    // validation
    db.estoque.findOne(
        { codigoItem: produtoParam.codigoItem },
        function (err, user) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (user) {
                // username already exists
                deferred.reject('Código do produto "' + produtoParam.codigoItem + '" já cadastrado');
            } else {
                createProduto();
            }
        });

    function createProduto() {
        // set user object to produtoParam without the cleartext password
        var user = _.omit(produtoParam, 'password');

        // add hashed password to user object
        //user.hash = bcrypt.hashSync(produtoParam.password, 10);

        db.estoque.insert(
            user,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function update(_id, produtoParam) {
    var deferred = Q.defer();

    // validation
    db.estoque.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        else {
            updateProduto();
        }
    });

    function updateProduto() {
        // fields to update
        var set = {
            codigoItem:  produtoParam.codigoItem,
            dataEntrada:  produtoParam.dataEntrada,
            tipo:  produtoParam.tipo,
            marca:  produtoParam.marca,
            caracteristica:  produtoParam.caracteristica,
            tamanho:  produtoParam.tamanho,
            cor:  produtoParam.cor,
            valorCompra:  produtoParam.valorCompra,
            valorMargem:  produtoParam.valorMargem,
            precoSugerido:  produtoParam.precoSugerido        
        };

    
        db.estoque.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.estoque.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}