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
    // await client.connect();

    const blogCollection = client.db("fitnessForgeDB").collection("blogs");
    const galleryCollection = client.db("fitnessForgeDB").collection("gallery");
    const usersCollection = client.db("fitnessForgeDB").collection("users");
    const classCollection = client.db("fitnessForgeDB").collection("classes");
    const subscribersCollection = client
      .db("fitnessForgeDB")
      .collection("subscribers");
    const trainerCollection = client
      .db("fitnessForgeDB")
      .collection("trainers");
    const trainerRequestCollection = client
      .db("fitnessForgeDB")
      .collection("trainerRequest");
    const forumCollection = client.db("fitnessForgeDB").collection("forums");

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

    // verify admin
    const verifyAdminAndTrainer = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAuthor = user?.role === "admin" || user?.role === "trainer";
      if (!isAuthor) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: "2h",
      });
      res.send({ token });
    });

    // service api
    // users collection operation
    app.get("/users", verifyToken, verifyAdminAndTrainer, async (req, res) => {
      try {
        const result = await usersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/users/trainer/:email", verifyToken, async (req, res) => {
      try {
        const email = req.params.email;

        if (email !== req.decoded.email) {
          return res.status(403).send({ message: "forbidden access" });
        }

        const query = { email: email };
        const user = await usersCollection.findOne(query);
        let trainer = false;
        if (user) {
          trainer = user?.role === "trainer";
        }
        res.send({ trainer });
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      try {
        const email = req.params.email;

        if (email !== req.decoded.email) {
          return res.status(403).send({ message: "forbidden access" });
        }

        const query = { email: email };
        const user = await usersCollection.findOne(query);
        let admin = false;
        if (user) {
          admin = user?.role === "admin";
        }
        res.send({ admin });
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

    // class collection operation api
    app.get("/classes", async (req, res) => {
      try {
        const result = await classCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/classes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classCollection.findOne(query);
      res.send(result);
    });

    app.post(
      "/classes",
      verifyToken,
      verifyAdminAndTrainer,
      async (req, res) => {
        try {
          const classInfo = req.body;
          const result = await classCollection.insertOne(classInfo);
          res.send(result);
        } catch (error) {
          console.log(error);
        }
      }
    );

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

    // trainer request collection api
    app.get("/trainerRequest", verifyToken, async (req, res) => {
      const result = await trainerRequestCollection.find().toArray();
      res.send(result);
    });

    app.post("/trainerRequest", verifyToken, async (req, res) => {
      try {
        const reqTrainer = req.body;
        const result = await trainerRequestCollection.insertOne(reqTrainer);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //subscribers collection api
    app.get("/subscribers", verifyToken, async (req, res) => {
      const result = await subscribersCollection.find().toArray();
      res.send(result);
    });

    app.post("/subscribers", async (req, res) => {
      try {
        const subscriber = req.body;
        const result = await subscribersCollection.insertOne(subscriber);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // forum collection operations
    app.get("/forums", async (req, res) => {
      try {
        const result = await forumCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/forums/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await forumCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.post("/forums", verifyToken, async (req, res) => {
      try {
        const forum = req?.body;
        const result = await forumCollection.insertOne(forum);
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
