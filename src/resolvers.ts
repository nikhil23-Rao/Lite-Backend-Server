// Modules Imported For Use
import { ApolloError } from "apollo-server-express";
import bcrypt from "bcrypt";
import { generateJWT } from "./auth/generateJWT";
import { UserArgsInt } from "./interfaces/UserArgsInt";
const { User } = require("../../database/models/User");

// GraphQL + Apollo Resolvers
export const resolvers = {
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

      // Build The User With Args
      const user = User.build({
        username: args.username,
        email: args.email,
        password,
        id: "",
      });

      // Save User To PSQL Database
      await user.save();

      // Create JSONWebToken
      const token = generateJWT({
        username: user.username,
        email: user.email,
        id: user.id,
      });

      // Returns JSONWebToken To Client
      return token;
    },
    // OAuth Register Mutation
    OAuthRegister: async (_: any, args: UserArgsInt) => {
      await User.sync({ force: true });

      // Check If User Is Already Registered
      if (await User.findOne({ where: { email: args.email } })) {
        throw new ApolloError("Account with the given email already exists.");
      }

      // Build The User With Args
      const user = User.build({
        username: args.username,
        email: args.email,
        id: "",
      });

      // Save User To PSQL Database
      await user.save();

      // Create JSONWebToken
      const token = generateJWT({
        username: user.username,
        email: user.email,
        id: user.id,
      });

      // Returns JSONWebToken To Client
      return token;
    },
    Login: async (_: any, args: UserArgsInt) => {
      // Check If User Email Is Real
      let user = await User.findOne({ where: { email: args.email } });
      if (!user) return new ApolloError("Invalid email or password.");

      // If Email Is Real, Check If Password Is Valid
      const validPassword = await bcrypt.compare(args.password, user.password);
      if (!validPassword) return new ApolloError("Invalid email or password.");

      // If Email And Password Is Valid Return JSONWebToken To Client
      const token = generateJWT({
        email: user.email,
        id: user.id,
        username: user.username,
      });
      return token;
    },
    OAuthLogin: async (_: any, args: UserArgsInt) => {
      // Check If User Email Is Real
      let user = await User.findOne({ where: { email: args.email } });
      if (!user) return new ApolloError("Invalid google login.");

      // If Email And Password Is Valid Return JSONWebToken To Client
      const token = generateJWT({
        email: user.email,
        id: user.id,
        username: user.username,
      });
      return token;
    },
  },
};
