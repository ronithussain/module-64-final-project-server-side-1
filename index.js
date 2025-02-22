const express = require('express');
const app = express();
const cors = require('cors');

// jwt start here
const jwt = require('jsonwebtoken');
// jwt end here

require('dotenv').config();
const port = process.env.PORT || 5000;

// MiddleWare
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s5ifh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection

        // crud operation is starts here

        const usersCollection = client.db("bistroDB").collection("users");
        const menuCollection = client.db("bistroDB").collection("menu");
        const reviewsCollection = client.db("bistroDB").collection("reviews");
        const cartsCollection = client.db("bistroDB").collection("carts");

 // jwt token related api and functionality start here:----------------------------------------
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })

        //jwt middleware
        const verifyToken = (req, res, next) => {
            console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
        }

        // use verify admin after verifyToken
        const verifyAdmin = async(req, res, next) => {
            const email = req.decoded.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if(!isAdmin){
                return res.status(403).send({message: 'forbidden access'})
            }
            next();
        }
 // jwt token related api and functionality end here!-----------------------------


        // userCollection-------------------user---admin------------------------get
        // kono ekta user admin ki na? seta checked kora hocche ai api diye
        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if(email !== req.decoded.email){
                return RegExp.status(403).send({message: 'unauthorized access'})
            }
            const query = {email: email};
            const user = await usersCollection.findOne(query);

            let admin = false;
            if(user) {
                admin = user?.role === 'admin';
            }
            res.send({admin});
        })

        // userCollection----------------------patch for admin
        app.patch('/users/admin/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin',
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.send(result);
        })
        // userCollection----------------------deleted
        app.delete('/users/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })
        // userCollection----------------------get
        app.get('/users',verifyToken, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })
        // userCollection----------------------post // save user to the database
        app.post('/users', async (req, res) => {
            const user = req.body;

            // insert email if user dose'nt exist start here
            // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exist', insertedId: null })

            }
            // insert email if user dose'nt exist end here

            const result = await usersCollection.insertOne(user);
            res.send(result);
        })
        // cartCollection----------------------deleted
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartsCollection.deleteOne(query);
            console.log(query, result);
            res.send(result);
        })
        // cartsCollection---------------------get
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await cartsCollection.find(query).toArray();
            res.send(result);
        })
        // cartsCollection---------------------post
        app.post('/carts', async (req, res) => {
            const cartItem = req.body;
            const result = await cartsCollection.insertOne(cartItem);
            res.send(result);
        })
        // menuCollection-----------------------
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result);
        })
        // reviewsCollection--------------------
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray();
            res.send(result);
        })






        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('boss is sitting')
})

app.listen(port, () => {
    console.log(`Bistro boss is sitting on port`);
})

/**
 * --------------------------------------------
 *             NAMING CONVENTION
 * --------------------------------------------
 * app.get('users')
 * app.get('users/:id')
 * app.post('users')
 * app.put('users/:id')
 * app.patch('users/:id')
 * app.delete('users/:id')
 */