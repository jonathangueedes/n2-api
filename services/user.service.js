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

//import { setLocale } from 'yup';

// yup.setLocale({
//     mixed: {
//         default: 'Não é válido',
//     },
//     number: {
//         min: '${path} deve ser maior que ${min}',
//         max: '${path} deve ser maior que ${max}',
//         positive: '${path} deve ser positivo',
//         integer: '${path} deve ser um número inteiro',
//         required: '${path} é um campo obrigatório'
//     },

//     string: {
//         required: '${path} é um campo obrigatório'
//     }
// });

let schema = yup.object().shape({
    Name: yup.string().required(),
    Username: yup.string().required(),
    Idade: yup
        .number()
        .required("O Campo idade é obigatório")
        .positive("O Valor deve ser positivo entre 12 a 100 anos de idade")
        .integer("O campo deve ser um numero inteiro")
        .min(12, "A idade minima aceitável é de 12 anos")
        .max(100, "A idade maxima aceita é de 100 anos"),
    Altura: yup
        .number()
        .required("O Campo altura é obigatório")
        .positive("O Valor deve ser positivo entre 80 a 240 centimetros")
        .min(80, "A altura minima aceitável é de 80 centimetros")
        .max(240, "A altura maxima aceitavel é de 240 centimetros"),
    Sexo: yup.string().required("Necessário definir um sexo"),
    Peso: yup
        .number()
        .required("O campo peso é obrigatório")
        .positive("O valor deve ser positivo entre 40 a 300 kilos")
        .min(40, "O peso minimo aceitável é de 40 kilos")
        .max(300, "O peso maximo aceitável é de 300 kilos"),
    Endereco: yup.string()
        .required("Campo endereço é de preenchimento obrigatório"),
    Cep: yup.string()
        .required('Campo obrigatório: Forneça um cep válido no formato 00000-000')
        .matches(/^[0-9]{5}[-][0-9]{3}$/, 'Forneça um cep válido no formato 00000-000'),
    Cidade: yup.string().required("Cidade tem que ser digitada"),
    estado: yup.string().matches(/^(ac|AC|al|AL|am|AM|ap|AP|ba|BA|ce|CE|df|DF|es|ES|go|GO|ma|MA|mg|MG|ms|MS|mt|MT|pa|PA|pb|PB|pe|PE|pi|PI|pr|PR|rj|RJ|rn|RN|ro|RO|rr|RR|rs|RS|sc|SC|se|SE|sp|SP|to|TO)$/, "Digite uma UF válida"),
    //objetivo: yup.string().required(),   
    //dia_semana: yup.string().required(),
    //periodo: yup.string().required(),
    //info_complement: yup.string().required(),

}).typeError("Erro geral");


function update(_id, userParam) {
    var deferred = Q.defer();



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
                            .validate({
                                Name: userParam.name,
                                Username: userParam.username,
                                Idade: userParam.idade,
                                Altura: userParam.altura,
                                Sexo: userParam.sexo,
                                Peso: userParam.peso,
                                Endereco: userParam.endereco,
                                Cep: userParam.cep,
                                Cidade: userParam.cidade,
                                estado: userParam.estado,
                            })
                            .then(function(valid, err) {
                                updateUser();
                            })
                            .catch(function(err) {
                                deferred.reject(err.message)
                            });
                    }
                });
        } else {
            schema
                .validate({
                    Name: userParam.name,
                    Username: userParam.username,
                    Idade: userParam.idade,
                    Altura: userParam.altura,
                    Sexo: userParam.sexo,
                    Peso: userParam.peso,
                    Endereco: userParam.endereco,
                    Cep: userParam.cep,
                    Cidade: userParam.cidade,
                    estado: userParam.estado,

                })

            .then(function(valid, err) {
                updateUser();

            }).catch(function(err) {
                deferred.reject(err.message);
            });;
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
            dataCadastro: ultimaAtualizacao.toLocaleDateString("pt-BR"),
            latidude: userParam.latitude,
            longitude: userParam.longitude



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