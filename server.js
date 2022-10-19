const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const knex = require('knex');
const bcrypt = require('bcrypt');

const database = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : '',
      database : 'job_seeker'
    }
  });
  

/* Above are the import statements for the application/server */

const saltRounds = 10;


const app = express() // Initialize the application

app.use(cors()); // This is the express middleware
app.use(bodyParser.json()); // Parse the request for application/json



app.post("/register", (req,res) => {
    /*
    Endpoint to register a new user to the service

    Client sends a POST request with a body: 
    {
        "username": <username>,
        "password": <password>
    }

    If user registration is successful, the endpoint returns the following response with a status code of 201 (Created):
    {
        success: true,
        detail: User: <username_that_was_passed> created
    }

    If user registration fails, the endpoint returns the following response with a status code of 400 (Bad Request):
    {
        success: false,
        detail: <detail of the error that occured>
    }
    */
    
    
    // console.log(req.body);

    bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
        database('users').insert({
            username: req.body.username,
            password: hash
        }).then(response => { res.status(201).json(
            {
                success: true, 
                detail: `User: ${req.body.username} created`
            }
        )})
        .catch(err => { res.status(400).json(
            {
                success: false, 
                detail: err.detail
            }
        )});
    });
    
})


app.post("/signin", (req,res) => {
    /*
    Endpoint to sign into the service

    Client sends a POST request with a body: 
    {
        "username": <username>,
        "password": <password>
    }

    If the signin is successful, the endpoint returns a response with status 200 and body:
    {
        username: <username>,
        signinSuccess: true
    }

    If the signin fails, the endpoint returns a response with status 400 and body:
    {
        username: <username>,
        signinSuccess: false
    }
    */
    // console.log(req.body);


    database('users').where('username', req.body.username)
    .then(data => {
        if(data.length === 1) {   
            bcrypt.compare(req.body.password, data[0].password).then(function(result) {
                const status = result? 200: 400;
                res.status(status).json(
                    {
                        username: req.body.username,
                        signinSuccess: result
                    }
                )
            });
        }
        else {
            res.status(400).json(
                {
                username: req.body.username,
                signinSuccess: false
                }
            )
        }
    });

})

app.listen(3000, () => {
    console.log("App is running! ")
})