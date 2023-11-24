// My dependencies
const express = require("express");
const app = express();
const mysql = require("mysql");
const cors = require("cors");
const colors = require("colors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
//const { v4: uuidv4 } = require('uuid');
const salt = 10;



// Use this to submit users data on form to the database
app.use(cookieParser());
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ["POST", "GET"],
    credentials: true,
}
));

// Run the server
app.listen(3002, () => {
    console.log(`Server in running on port 3002`.random.bgBlack);
});

// Database connection (mysql)
const db = mysql.createConnection({
    user: 'root',
    host: 'localhost',
    password: '',
    database: 'mern-auth',
});

// Middleware pour vérifier le token JWT
const verifyJWT = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        res.send("We need a token, please give it to us next time!");
    } else {
        jwt.verify(token, "jwtSecret", (err, decoded) => {
            if (err) {
                res.json({ auth: false, message: "Failed to authenticate" });
            } else {
                req.userId = decoded.id;
                next();
            }
        });
    }
};

// Route to register user
app.post('/register', (req, res) => {
    const sentEmail = req.body.Email;
    const sentUsername = req.body.Username;
    const sentPassword = req.body.Password;
    

    // Crypted password before to registed users
    bcrypt.hash(sentPassword, salt, (err, hash) => {
        if (err) {
            return res.status(500).send({ error: err });
        } else {
            // SQL statement to insert the user to the db table users
            const SQL = 'INSERT INTO users (email, username, password) VALUES(?,?,?)';
            const Values = [sentEmail, sentUsername, hash];
             //Query to execute the sql statement stated above
            db.query(SQL, Values, (err, results) => {
                if (err) {
                    res.send(err);
                } else {
                    console.log('User inserted successfully !');
                    res.send({ message: 'User added !' });
                }
            });
        }
    });
});

// Route to login user
app.post('/login', (req, res) => {
    // Get variables sent from the form
    const sentloginUsername = req.body.LoginUsername;
    const sentloginPassword = req.body.LoginPassword;

    // SQL statement to get the user into the db table users
    const SQL = 'SELECT * FROM users WHERE username = ?';
    db.query(SQL, [sentloginUsername], (err, results) => {
        if (err) {
            res.send({ error: err });
        } 
        if (results.length > 0) {
            // Use bcrypt to compare the datas send with the datas in DB.
            bcrypt.compare(sentloginPassword, results[0].password, (error, response) => {
                if (response) {
                    const id = results[0].id;
                    // Générer un token JWT
                    // const tokenData = {
                    //     id: id,
                    //     timestamp: new Date().getTime(), // Ajout d'un horodatage pour rendre le token unique
                    //     session_id: uuidv4()
                    // };

                    const token = jwt.sign({id}, "jwtSecret", {
                        expiresIn: 1850,
                    });

                    console.log("Token before setting in cookie:", token);
                    // Stockez le token dans un cookie HttpOnly
                    res.cookie('token', token, {
                        httpOnly: true,
                        maxAge: 3600000, // 1 heure en millisecondes
                        
                        secure: true, // à décommenter en production pour envoyer le cookie uniquement sur HTTPS
                    });
                    console.log("Token set in cookie:", token);
                    res.json({ auth: true, result: results });
                } else {
                    res.json({ auth: false, message: "Wrong username/password combination!" });
                }
            });
        } else {
            res.send({ message: `Credentials Don't match !` });
        }
    });
});

//Déconnection
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.send('Logged out successfully');
});

// Vérifier l'authentification
app.get('/isUserAuth', verifyJWT, (req, res) => {
    res.send("You are authenticated");
});


// Ajoutez d'autres routes qui nécessitent une authentification ici, en utilisant le middleware verifyJWT.
