const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const knex = require('knex');
const bcrypt = require('bcrypt');
const { json } = require("body-parser");

//database connection for heroku
const database = knex({
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: true
    }
});

/* const database = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : '',
      database : 'job_seeker'
    }
  });
   */

/* Above are the import statements for the application/server */

const saltRounds = 10;


const app = express() // Initialize the application


app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
    });

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
app.get("/", (req,res) =>{
    
    if(req.query.hasOwnProperty('number'))
    {
        let response = {}
        for(let i = 0; i < req.query.number; i++)
        {
            response[i] = {
                "id": i+1,
                "title": "test",
                "company": "test",
                "notes": "test",
                "link": "test",
                "date_created": "2022-10-24T07:00:00.000Z",
                "last_modified": "2022-10-24T07:00:00.000Z",
                "active": false,
                "user_id": 0,
                "category": "test"
            }
        }
        res.status(200).json(response)
    }
    else
    {
        res.status(200).json("The API is working!")
    }
    
})


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
                user_id: user_id[0].id,
                category: job.category.toLowerCase()
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
    if ('category' in updated_information)
    {
        updated_information.category = updated_information.category.toLowerCase()
    }
    const user_id = await getUserId(username)
    const response = {
        username: username,
        success: false,
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

    Client sends a delete request with the following body:
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


app.post("/jobs", async (req, res) => {
    /*
    Endpoint that provides all the jobs that are under a given category

    The client sends the following request: 
    {
        "username": <username>,
        "signedIn": <signedIn>, 
        "filter": <one of the following terms: "all", "applied", "wishlist", "interview", "offer", "rejected", "inactive" > 
    }

    The endpoint sends the following response with a 200 status code for a successful request:
    {
        username: <username>,
        "success": true,
        result: <array with all the jobs that match the filter>
    }

    The endpoint sends the followign response with a 400 status code for a bad request:
    {
        username: <username>,
        "success": false, 
        detail: <details>
    }
    */

    const { username, signedIn, filter }  = req.body;
    
    const user_id = await getUserId(username)
    
    const response = {
        username: username,
        success: false,
    }

    if (user_id.length === 0 )
    {
        response.detail = `User: ${username} does not exist`
        res.status(400).json(response)
    }

    if(signedIn)
    {
        let whereQuery = {}
        if(filter.toLowerCase() === "all")
        {
            whereQuery = {active: true, user_id: user_id[0].id }
        }
        else if (filter.toLowerCase() === "inactive")
        {
            whereQuery = {active: false, user_id: user_id[0].id }
        }
        else
        {
            whereQuery = {active: true, user_id: user_id[0].id, category: filter.toLowerCase() }
        }


        database('job').orderBy('last_modified', 'desc').where(whereQuery)
            .then(data => {
                response.success = true 
                response.result = data

                res.status(200).json(response)
            })
        

    }
    else 
    {
        response.detail = "You are not signed in"
        res.status(400).json(response)
    }

})

app.post("/refresh", async (req, res) => {
    /* 
    Endpoint that refreshes (checks for activity of jobs) i.e., it checks the jobs for activity and if they have not been active for the last 2 months,
    they are moved to the inactive state

    the client sends the following along with the request: 
    {
        "username": <username>,
        "signedIn": true
    }

    The endpoint sends the following with a status code of 200 if the request was successful:
    {
        username: "username",
        success: true
    }

    The endpoint sends the following with a status code of 400 if the request failed: 
    {
        username: "username",
        success: false,
        detail: <details>
    }
    */

    
    const { username, signedIn } = req.body

    const user_id = await getUserId(username)

    /* const date1 = new Date('7/13/2010');
    const date2 = new Date('12/15/2010');
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    console.log(diffTime + " milliseconds");
    console.log(diffDays + " days"); */


    
    const response = {
        username: username,
        suceess: false
    }
    if (user_id.length !== 1)
    {
        response.detail = `User: ${username} does not exist`
        res.status(400).json(response)

    }
    
    if(signedIn)
    {
        const today = new Date();
        database('job').where('user_id', user_id[0].id)
        .then(data => {
            for(let i = 0; i<data.length; i++)
            {
                const lastModified = new Date(data[i].last_modified);
                const diffTime = Math.abs(today - lastModified);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if(diffDays > 90)
                {
                    data[i].active = false
                    
                    database('job').where({id: data[i].id, user_id: user_id[0].id})
                    .update(data[i]).then();
                }
            }
            response.suceess = true
            res.status(200).json(response)
        })

    }
    else
    {
        response.detail = 'You are not signed in'
        res.status(400).json(response)
    }

})


app.post("/stats", async (req, res) => {
    /*
        This endpoint sends the number of jobs in each catergory for a user
        
        The client sends a POST request with the following body: 
        {
            username: <username>,
            signedIn: true
        }

        The server sends the following response if it was successful with a status code of 200 (OK):
        {
            username: <username>,
            success: true, 
            counts: {
                'all': <number of all categories except inactive>,
                'applied': <number>,
                'wishlist': <number>,
                'interview': <number>,
                'offer': <number>,
                'rejected': <number>,
                'inactive': <number>

            }
        }

        If the request fails, the following is sent alongwith a status code of 400 (Bad Request):
        {
            username: <username>,
            success: false,
            detail: <detail>
        }
    */

    const { username, signedIn } = req.body
    const user_id = await getUserId(username)
    
    const response = {
        username: username,
        success: false,
    }

    if (user_id.length === 0 )
    {
        response.detail = `User: ${username} does not exist`
        res.status(400).json(response)
    }

    if(signedIn)
    {
        response.counts = {}
        await database('job').count("*").where({'user_id': user_id[0].id, active: true}).then(data => {response.counts.all = data[0].count })
        await database('job').count("*").where({'user_id': user_id[0].id, active: true, category: "applied"}).then(data => {response.counts.applied = data[0].count })
        await database('job').count("*").where({'user_id': user_id[0].id, active: true, category: "wishlist"}).then(data => {response.counts.wishlist = data[0].count })
        await database('job').count("*").where({'user_id': user_id[0].id, active: true, category: "interview"}).then(data => {response.counts.interview = data[0].count })
        await database('job').count("*").where({'user_id': user_id[0].id, active: true, category: "offer"}).then(data => {response.counts.offer = data[0].count })
        await database('job').count("*").where({'user_id': user_id[0].id, active: true, category: "rejected"}).then(data => {response.counts.rejected = data[0].count })
        await database('job').count("*").where({'user_id': user_id[0].id, active: false}).then(data => {response.counts.inactive = data[0].count })

        response.success = true
        res.status(200).json(response)

        
    }
    else
    {
        response.detail = 'You are not signed in'
        res.status(400).json(response)
    }
})
app.listen(process.env.PORT || 3000, () => {
    console.log("App is running! ")
})