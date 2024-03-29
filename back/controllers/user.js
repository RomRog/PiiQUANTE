// importe le module de hashage et salage des mdp 
const bcrypt = require("bcrypt");

// importe le module de création de token
const jwt = require("jsonwebtoken");
const PasswordValidator = require('password-validator');

// importation du modèle de donnée d'un user
const User = require("../models/User");

const schema = new PasswordValidator

// Appel de .env pour utiliser les variables d'environnement (npm install dotenv --save)
require("dotenv").config();

// Expression régulière
const RegExpEmail =
    /^(([^<()[\]\\.,;:\s@\]+(\.[^<()[\]\\.,;:\s@\]+)*)|(.+))@(([[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}])|(([a-zA-Z-0-9]+.)+[a-zA-Z]{2,}))$/;

// controlleur d'inscription d'un utilisateur
schema
    .is().min(10)
    .is().max(50)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().not().spaces()
    .has().symbols(1)
    .is().not().oneOf(['Passw0rd', 'Password123', '12345678910']);

exports.signup = (req, res, next) => {
    if (!schema.validate(req.body.password)) {
        console.log("inscription invalidé");
        return res.status(401).json({ message: "Inscription invalidé !" }); // return error 400
    } else {
        // utilise bcrypt pour créer un hash du mot de passe tranmis

        bcrypt
            .hash(req.body.password, 10)
            .then((hash) => {
                // crée un objet user
                const user = new User({
                    email: req.body.email,
                    password: hash,
                });
                // enregistre le nouveau utilisateur
                user
                    .save()
                    .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
                    .catch((error) => {
                        console.log(error);
                        res.status(400).json({ error });
                    });
            })
            .catch((error) => {
                console.log(error);
                res.status(500).json({ error });
            });
    }
}; 

// controlleur de connexion d'un utilisateur

exports.login = (req, res, next) => {
    // recherche l'adresse mail dans la BDD
    User.findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                return res.status(401).json({ message: "Utilisateur inexistant !" });
            }
            // génère un hash du mdp et le compare à celui associé à l'adresse mail dans la BDD
            bcrypt
                .compare(req.body.password, user.password)
                .then((valid) => {
                    if (!valid) {
                        return res
                            .status(401)
                            .json({ error: "Mot de passe incorrect !" });
                    }

                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            process.env.SECRET_CRYPT_TOKEN,
                            { expiresIn: "24h" }
                        ),
                    });
                })
                .catch((error) => {
                    console.log(error);
                    res.status(500).json({ error });

                });
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({ error });

        });
};