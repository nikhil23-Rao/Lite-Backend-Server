// Modules Imported For Use
import express from "express";
import { ApolloServer, ApolloError } from "apollo-server-express";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { pick } from "lodash";

// User Created Modules
const { connectToDB } = require("../../database/src/connection");
const { User } = require("../../database/models/User");
// Middleware
import cors from "cors";
import compression from "compression";

// Defining Express And Adding Additional Middleware
const app = express();
app.use("*", cors());
app.use(compression());

// Connect To Postgres Database
connectToDB();

// Interfaces For Arguments
interface UserArgsInt {
  email: string;
  username: string;
  password: string;
}

// GraphQL + Apollo Resolvers
const resolvers = {
  Query: {
    hello: async () => {
      await User.drop();
    },
  },
  Mutation: {
    // Register Mutation
    Register: async (_: any, args: UserArgsInt) => {
      // await User.sync({ force: true });

      // Generate Bcrypt Salt
      const salt = await bcrypt.genSalt(10);
      // Hash Password
      const password = await bcrypt.hash(args.password, salt);

      // Check If User Is Already Registered
      if (await User.findOne({ where: { email: args.email } })) {
        throw new ApolloError("Account with the given email already exists.");
      }

      // Build The User
      const user = User.build({
        username: args.username,
        email: args.email,
        password,
        id: "",
      });

      // Save User To PSQL Database
      await user.save();
      // Only Return The Username, Email, & Id Fields
      return pick(user, ["username", "email", "id"]);
    },
  },
};

// Create Instance Of Apollo Server So We Get The UI Of Apollo Server In Express Server
const server: ApolloServer = new ApolloServer({
  typeDefs: fs.readFileSync(
    path.join(__dirname, "graphql/schema.graphql"),
    "utf-8"
  ),
  resolvers,
  // formatError:(err) => {
  // if err.message
  // }
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
