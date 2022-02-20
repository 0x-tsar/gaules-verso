require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { createClient } = require("redis");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

const PORT = process.env.PORT || 5002;
const redisClient = createClient();

app.get("/", async (req, res) => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  let dataCached = await redisClient.get("significados");

  if (!dataCached) {
    await mongoose.connect(
      `mongodb+srv://${process.env.ACCOUNT}:${process.env.PASSWORD}@apicluster.5xlor.mongodb.net/Gaules?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    const client = await mongoose.connection;
    const data = await client.collection("significados").find({}).toArray();

    await redisClient.setEx("significados", 60, JSON.stringify(data));

    return res.json(data);
  } else {
    return res.json(JSON.parse(dataCached));
  }
});

app.listen(PORT, () => console.log(`server connect`));
