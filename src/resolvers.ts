// Modules Imported For Use
import { ApolloError } from "apollo-server-express";
import bcrypt from "bcrypt";
import { generateJWT } from "./auth/generateJWT";
import { UserArgsInt } from "./interfaces/UserArgsInt";
import { StoryArgsInt } from "./interfaces/StoryArgsInt";
const { PublishStory } = require("../../database/models/PublishedStory");
const { sequelize } = require("../../database/src/db");
const { User } = require("../../database/models/User");
const { OAuthUser } = require("../../database/models/OAuthUser");
const { StoryDraft } = require("../../database/models/StoryDraft");

// GraphQL + Apollo Resolvers
export const resolvers = {
  Query: {
    // Know Which Story To Update Title And Image URL
    GetStoryDraftID: async () => {
      const [res] = await sequelize.query(
        `SELECT * FROM "StoryDrafts" WHERE title IS NULL`
      );
      return res[0].id;
    },
    // Get All Stories For Specific User
    GetAllStories: async (_: any, args: StoryArgsInt) => {
      const stories = [];
      const storyDrafts = await StoryDraft.findAll({
        where: {
          // Find By AuthorID`
          authorid: args.authorid,
        },
      });

      const publishedStories = await PublishStory.findAll({
        where: {
          // Find By AuthorID`
          authorid: args.authorid,
        },
      });

      // Push Both Stories In One Array
      stories.push(...storyDrafts, ...publishedStories);
      // Return All Stories When Done
      return stories;
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
        image_url: user.image_url,
      });

      // Returns JSONWebToken To Client
      return token;
    },
    // OAuth Register Mutation
    OAuthRegister: async (_: any, args: UserArgsInt) => {
      // await OAuthUser.sync({ force: true });

      // Check If User Is Already Registered
      if (
        (await OAuthUser.findOne({ where: { email: args.email } })) ||
        (await User.findOne({ where: { email: args.email } }))
      ) {
        throw new ApolloError("Account with the given email already exists.");
      }

      // Build The User With Args
      const user = OAuthUser.build({
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
        image_url: user.image_url,
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
        image_url: user.image_url,
      });
      // Return JWT Token To Client
      return token;
    },
    OAuthLogin: async (_: any, args: UserArgsInt) => {
      // Check If User Email Is Real
      let user = await OAuthUser.findOne({ where: { email: args.email } });
      if (!user) return new ApolloError("Invalid Microsoft login.");

      // If Email And Password Is Valid Return JSONWebToken To Client
      const token = generateJWT({
        email: user.email,
        id: user.id,
        username: user.username,
        image_url: user.image_url,
      });
      // Return JWT Token To Client
      return token;
    },
    SaveDraftContent: async (_: any, args: StoryArgsInt) => {
      // await StoryDraft.sync({ force: true });
      // Build Story Draft
      const draft = StoryDraft.build({
        content: args.content,
        authorid: args.authorid,
        date_created: args.date_created,
      });
      // Save The Draft
      await draft.save();
      // Return Bool On Whether It Worked
      return true;
    },
    SaveDraftTitleAndImageUrl: async (_: any, args: StoryArgsInt) => {
      // Update Draft With Title
      await StoryDraft.update(
        {
          title: args.title,
          image_url: args.image_url,
          category: args.category,
        },
        { where: { id: args.id } }
      );
      // Return Bool On Whether It Worked
      return true;
    },
    SaveDraft: async (_: any, args: StoryArgsInt) => {
      // await StoryDraft.sync({ force: true });
      const draft = StoryDraft.build({
        content: args.content,
        title: args.title,
        authorid: args.authorid,
        image_url: args.image_url,
        date_created: args.date_created,
        category: args.category,
      });
      await draft.save();
      return true;
    },

    PublishStory: async (_: any, args: StoryArgsInt) => {
      await PublishStory.sync({ force: true });
      const story = PublishStory.build({
        content: args.content,
        title: args.title,
        authorid: args.authorid,
        image_url: args.image_url,
        date_created: args.date_created,
        category: args.category,
      });
      await story.save();
      return true;
    },
  },
};
