// Modules Imported For Use
import { ApolloError } from "apollo-server-express";
import bcrypt from "bcrypt";
import { pick } from "lodash";
const { User } = require("../../database/models/User");

// Interfaces For Arguments
interface UserArgsInt {
  email: string;
  username: string;
  password: string;
}

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
