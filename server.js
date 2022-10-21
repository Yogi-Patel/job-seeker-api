const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const knex = require('knex');
const bcrypt = require('bcrypt');
const { json } = require("body-parser");

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


// Helper functions 

const getUserId = (username) => {
    return database('users').where('username', username).select('id').then(data => { return data})
} // Returns an array of Object(s)

const getCurrentDate = () => {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
}


// Endpoints
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


app.post("/add", async (req,res) => {
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
        detail: <detail>,
        job: {
            "title": <title>,
            "company": <company>,
            "notes": <notes>,
            "link": <link>
        }
    }

    If adding the job was unsuccessful, the endpoint returns the following response with a status code of 400 (Bad Request):
    {
        username: <username>,
        success: false,
        detail: <detail>,
        job: {
            "title": <title>,
            "company": <company>,
            "notes": <notes>,
            "link": <link>
        }
    }
    */

    const {username, signedIn, job} = req.body;
    const user_id = await getUserId(username); // returns an array with objects that match the criteria
    if(signedIn === true )
    {
        const stringDate = getCurrentDate()
        if (user_id.length !== 1)
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
                user_id: user_id[0].id
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


app.put("/update", async (req,res) => {
    /* 
    Endpoint to update an already existing job in the database

    Client sends a PUT request with the following body:
    {
        "username": <username>,
        "signedIn": true,
        "job_id": <id>, 
        "updated_information": <job>
    }

    If adding the job was successful, the endpoint returns the following response with a status code of 200 (OK):
    {
        username: <username>,
        success: true,
        detail: <detail>, 
        job: {
            "title": <title>,
            "company": <company>,
            "notes": <notes>,
            "link": <link>
        }
    }

    If adding the job was unsuccessful, the endpoint returns the following response with a status code of 400 (Bad Request):
    {
        username: <username>,
        success: false,
        detail: <detail>,
        job: {
            "title": <title>,
            "company": <company>,
            "notes": <notes>,
            "link": <link>
        }
    }

    */
    const {username, signedIn, job_id, updated_information} = req.body;
    const user_id = await getUserId(username)
    const response = {
        username: username,
        success: false,
        detail: "placeholder string",
        job: updated_information
    }

    if(signedIn)
    {
        database('job').where({id: job_id, user_id: user_id[0].id})
        .then(data => {
            if(data.length !== 1)
            {
                response.detail = "Job does not exist or access is denied"
                res.status(400).json(response)
            }
            else 
            {
                
                updated_information.active = true
                updated_information.last_modified = getCurrentDate()
                
                database('job').where({id: job_id, user_id: user_id[0].id})
                .update(updated_information).then();  // Added .then() to make sure that the promise is fulfilled
                
                response.success = true
                response.job = updated_information
                res.status(200).json(response)
            }

        })
    }
    else
    {
        response.detail = "You are not signed in"
        res.status(400).json(response)
    }
    
})


app.delete("/delete", async (req, res) => {
    /* 
    Endpoint to delete a job in the database

    Client sends a PUT request with the following body:
    {
        "username": <username>,
        "signedIn": true,
        "job_id": <id>, 
    }

    If adding the job was successful, the endpoint returns the following response with a status code of 200 (OK):
    {
        username: <username>,
        success: true,
        detail: <detail> 
        }
    }

    If adding the job was unsuccessful, the endpoint returns the following response with a status code of 400 (Bad Request):
    {
        username: <username>,
        success: false,
        detail: <detail>
    }
    */
   const { username, signedIn, job_id } = req.body;

   const user_id = await getUserId(username)

   const response = {
        username: username,
        sucess: false,
        detail: "placeholder string"
   }
   if(signedIn)
    {
        database('job').where({id: job_id , user_id: user_id[0].id })
        .then(data => {
            if(data.length !== 1)
            {
                
                response.detail = "Job does not exist or access is denied"
                res.status(400).json(response)
            }
            else 
            {
                database('job').where({id: job_id, user_id: user_id[0].id})
                .del().then();  // Added .then() to make sure that the promise is fulfilled
                
                response.success = true
                response.detail = `Job with id: ${job_id} deleted`
                res.status(200).json(response)
            }

        })

    }
    else
    {
        response.detail = "You are not signed in"
        res.status(400).json(response)
    }

   
})
//app.post("/search")

app.listen(3000, () => {
    console.log("App is running! ")
})