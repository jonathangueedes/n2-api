var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var yup = require('yup');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('users');

var service = {};

service.authenticate = authenticate;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;

module.exports = service;

function authenticate(username, password) {
    var deferred = Q.defer();

    db.users.findOne({ username: username }, function(err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user && bcrypt.compareSync(password, user.hash)) {
            // authentication successful
            deferred.resolve({ token: jwt.sign({ sub: user._id }, config.secret), userId: user._id });
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();

    db.users.findById(_id, function(err, user) {
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

function create(userParam) {
    var deferred = Q.defer();

    // validation
    db.users.findOne({ username: userParam.username },
        function(err, user) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (user) {
                // username already exists
                deferred.reject('Username "' + userParam.username + '" is already taken');
            } else {
                createUser();
            }
        });

    function createUser() {
        // set user object to userParam without the cleartext password
        var user = _.omit(userParam, 'password');

        // add hashed password to user object
        user.hash = bcrypt.hashSync(userParam.password, 10);

        db.users.insert(
            user,
            function(err) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function update(_id, userParam) {
    var deferred = Q.defer();

    let schema = yup.object().shape({
        name: yup.string().required(),
        username: yup.string().required(),
        idade: yup
            .number()
            .required()
            .positive()
            .integer(),
        altura: yup
            .number()
            .required()
            .positive(),
        sexo: yup.string().required(),
        peso: yup
            .number()
            .required()
            .positive(),
        endereco: yup.string().required(),
        cep: yup.string().required(),
        cidade: yup.string().required(),
        estado: yup.string().required(),
        //objetivo: yup.string().required(),
        //dia_semana: yup.string().required(),
        //periodo: yup.string().required(),
        //info_complement: yup.string().required(),

    });

    // validation
    db.users.findById(_id, function(err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user.username !== userParam.username) {
            // username has changed so check if the new username is already taken
            db.users.findOne({ username: userParam.username },
                function(err, user) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    if (user) {
                        // username already exists
                        deferred.reject('Username "' + req.body.username + '" is already taken')
                    } else {
                        schema
                            .isValid({
                                name: userParam.name,
                                username: userParam.username,
                                idade: userParam.idade,
                                altura: userParam.altura,
                                sexo: userParam.sexo,
                                peso: userParam.peso,
                                endereco: userParam.endereco,
                                cep: userParam.cep,
                                cidade: userParam.cidade,
                                estado: userParam.estado,

                            })
                            .then(function(valid) {
                                valid; // => true
                                dadosValidados = valid
                                if (dadosValidados) {
                                    updateUser();
                                } else {
                                    //return err
                                    deferred.reject('Dados invalidos')
                                }

                            });
                    }
                });
        } else {
            schema
                .isValid({
                    name: userParam.name,
                    username: userParam.username,
                    idade: userParam.idade,
                    altura: userParam.altura,
                    sexo: userParam.sexo,
                    peso: userParam.peso,
                    endereco: userParam.endereco,
                    cep: userParam.cep,
                    cidade: userParam.cidade,
                    estado: userParam.estado,

                })
                .then(function(valid) {
                    valid; // => true
                    dadosValidados = valid
                    if (dadosValidados) {
                        updateUser();
                    } else {
                        deferred.reject('Dados invalidos')
                    }
                });
        }
    });

    function updateUser() {

        var ultimaAtualizacao = new Date();



        // fields to update
        var set = {
            name: userParam.name,
            username: userParam.username,
            idade: userParam.idade,
            altura: userParam.altura,
            sexo: userParam.sexo,
            peso: userParam.peso,
            endereco: userParam.endereco,
            cep: userParam.cep,
            cidade: userParam.cidade,
            estado: userParam.estado,
            objetivo: {
                hipertrofia: userParam.objetivo.hipertrofia,
                condicionamneto: userParam.objetivo.condicionamneto,
                saude: userParam.objetivo.saude
            },
            dia_semana: {
                domingo: userParam.dia_semana.domingo,
                segunda: userParam.dia_semana.segunda,
                terca: userParam.dia_semana.terca,
                quarta: userParam.dia_semana.quarta,
                quinta: userParam.dia_semana.quinta,
                sexta: userParam.dia_semana.sexta,
                sabado: userParam.dia_semana.sabado
            },
            periodo: {
                manha: userParam.periodo.manha,
                tarde: userParam.periodo.tarde,
                noite: userParam.periodo.noite

            },
            info_complement: userParam.info_complement,
            dataCadastro: ultimaAtualizacao.toLocaleDateString("pt-BR")



        };

        // update password if it was entered
        if (userParam.password) {
            set.hash = bcrypt.hashSync(userParam.password, 10);
        }

        db.users.update({ _id: mongo.helper.toObjectID(_id) }, { $set: set },
            function(err) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.users.remove({ _id: mongo.helper.toObjectID(_id) },
        function(err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}