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
        username: <username>,
        success: true,
        detail: User: <username_that_was_passed> created
    }

    If user registration fails, the endpoint returns the following response with a status code of 400 (Bad Request):
    {
        username: <username>,
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
                username: req.body.username,
                success: true, 
                detail: `User: ${req.body.username} created`
            }
        )})
        .catch(err => { res.status(400).json(
            {
                username: req.body.username,
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

    If the signin is successful, the endpoint returns the following response with a status code of 200 (OK):
    {
        username: <username>,
        success: true,
        detail: <detail>
    }

    If the signin fails, the endpoint returns the following response with a status code of 400 (Bad Request):
    {
        username: <username>,
        success: false,
        detail: <detail>
    }
    */
    // console.log(req.body);


    database('users').where('username', req.body.username)
    .then(data => {
        if(data.length === 1) {   
            bcrypt.compare(req.body.password, data[0].password).then(function(result) {
                const status = result? 200: 400;
                const detail = result? "signin successful": "signin failed"
                res.status(status).json(
                    {
                        username: req.body.username,
                        success: result,
                        detail: detail
                    }
                )
            });
        }
        else {
            res.status(400).json(
                {
                username: req.body.username,
                success: false,
                detail: "signin failed"
                }
            )
        }
    });

})


app.post("/add", (req,res) => {
    /*
    Endpoint to add a new job into the jobs database

    Client sends a POST request with the following body:
    {
        "username": <username>,
        "signedIn": true,
        "job": {
            "title": <title>,
            "company": <company>,
            "notes": <notes>,
            "link": <link>
        }
    }

    If adding the job was successful, the endpoint returns the following response with a status code of 201 (Created):
    {
        username: <username>,
        success: true,
        detail: <detail>
    }

    If adding the job was unsuccessful, the endpoint returns the following response with a status code of 400 (Bad Request):
    {
        username: <username>,
        success: false,
        detail: <detail>
    }
    */

    const {username, signedIn, job} = req.body;
    console.log(req.body)
    if(signedIn === true)
    {
        database('users').where('username', username)
        .then(data => {
            /* database('job').insert */
            const date = new Date();
            const stringDate = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
            if (data.length !== 1)
            {
                res.status(400).json({
                    username: username,
                    success: false,
                    detail: `User: ${username} does not exist`
                })
            }
            else
            {
                database('job').insert({
                    title: job.title,
                    company: job.company,
                    notes: job.notes,
                    link: job.link,
                    date_created: stringDate,
                    last_modified: stringDate,
                    active: true,
                    user_id: data[0].id
                }).then(response => {
                    res.status(201).json({
                        username: username, 
                        success: true,
                        detail: "Job created",
                        job: job
                    })
                })
                .catch(err => {
                    res.status(400).json({
                        username: username, 
                        success: false, 
                        detail: err.detail, 
                        job: job
                    })
                });
            }

        })
    }
    else
    {
        res.status(400).json({
            username: username, 
            success: false, 
            detail: "You are not signed in", 
            job: job
        });
    }
    
    
})





app.listen(3000, () => {
    console.log("App is running! ")
})