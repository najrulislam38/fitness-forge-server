const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// const uri =
//   "mongodb+srv://<username>:<password>@cluster0.va14gvo.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const blogCollection = client.db("fitnessForgeDB").collection("blogs");
    const galleryCollection = client.db("fitnessForgeDB").collection("gallery");
    const usersCollection = client.db("fitnessForgeDB").collection("users");
    const trainerCollection = client
      .db("fitnessForgeDB")
      .collection("trainers");

    // middleware
    const verifyToken = (req, res, next) => {
      if (!req?.headers?.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers?.authorization.split(" ")[1];
      jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: "2h",
      });
      res.send({ token });
    });

    // users collection operation
    app.get("/users", verifyToken, async (req, res) => {
      try {
        const result = await usersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user?.email };
        const isExist = await usersCollection.findOne(query);
        if (isExist) {
          return res.send({
            message: "user already existed",
            insertedId: null,
          });
        }
        const result = await usersCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        console.log(error?.message);
      }
    });

    // trainer collection api.
    app.get("/trainers", async (req, res) => {
      try {
        const result = await trainerCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/trainers/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await trainerCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // gallery collection operations
    app.get("/gallery", async (req, res) => {
      try {
        const page = req.query?.page;
        const result = await galleryCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // blog collection operations
    app.get("/blogs", async (req, res) => {
      try {
        const result = await blogCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Fitness Forge server is running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
