// Modules Imported For Use
import express from "express";
import { ApolloServer } from "apollo-server-express";
import fs from "fs";
import path from "path";

// User Created Modules
const { connectToDB } = require("../../database/src/connection");
import { resolvers } from "./resolvers";

// Middleware
import cors from "cors";
import compression from "compression";
import config from "config";

// Defining Express And Adding Additional Middleware
const app = express();
app.use("*", cors());
app.use(compression());

// Check If JWT Key Is Defined
if (!config.get("jwtPrivateKey")) {
  console.error("FATAL ERROR: jwtKey Not Defined!");
  process.exit(1);
}

// Connect To Postgres Database
connectToDB();

// Create Instance Of Apollo Server So We Get The UI Of Apollo Server In Express Server
const server: ApolloServer = new ApolloServer({
  typeDefs: fs.readFileSync(
    path.join(__dirname, "graphql/schema.graphql"),
    "utf-8"
  ),
  resolvers,
});

// Applying All Middleware To The Server And Defining The Path To Be Located At /graphql
server.applyMiddleware({ app, path: "/graphql" });

// Port
const port = process.env.PORT || 4000;

// Creating A New Express Server For The Web
app.listen(port, () => {
  console.log(
    `GraphQL Server Is Now Running On http://localhost:${port}/graphql`
  );
});
