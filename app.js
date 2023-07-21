const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error");
const dotenv = require("dotenv");
const app = express();

{/**
https://evelyne-api.adaptable.app/api/
*/}

const path = "./config/config.env";
// const path = "./config/local.env";

dotenv.config({ path });

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
  })
);

app.get("/", (req, res, next) => res.json({ message: "Server is running" }));

const { userRoute } = require('./src');

app.use("/api/user", userRoute);

app.all("*", async (req, res) => {
  res
    .status(404)
    .json({
      error: {
        message: "Not Found. Kindly Check the API path as well as request type",
      },
    });
});

app.use(errorMiddleware);

module.exports = app;
