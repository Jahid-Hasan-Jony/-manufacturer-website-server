const express = require('express');
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(express.json());
app.use(cors());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.deudh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "unAuthorized Access" });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })
};

async function run() {
    try {
        await client.connect()
        const assignment12Collection = client.db('assignment12').collection('data');
        const userCollection = client.db('assignment12').collection('users');

        // get all data
        app.get('/data', async (req, res) => {
            const query = {};
            const cursor = assignment12Collection.find(query)
            const allData = await cursor.toArray();
            res.send(allData);
        });

        // get One data
        app.get('/data/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const oneData = await assignment12Collection.findOne(query);
            res.send(oneData);
        });

        //update or insert user data 
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updatedoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            console.log(token)
            res.send({ result, token });
        });

        //make addmin 
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updatedoc = {
                $set: { role: "admin" },
            };
            const result = await userCollection.updateOne(filter, updatedoc);
            console.log('hits')
            res.send({ result });
        });
        //all users api
        app.get('/users', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users)
        })

    }
    finally { }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})