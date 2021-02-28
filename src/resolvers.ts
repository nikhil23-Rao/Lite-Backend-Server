// Modules Imported For Use
import { ApolloError } from "apollo-server-express";
import bcrypt from "bcrypt";
import { generateJWT } from "./auth/generateJWT";
import { UserArgsInt } from "./interfaces/UserArgsInt";
import { QuizArgsInt } from "./interfaces/QuizArgsInt";
import { QuestionArgsInt } from "./interfaces/QuestionArgsInt";
const {
  findQuestionByQuizId,
} = require("../../database/queries/FindQuestionByQuizId");
const { sequelize } = require("../../database/src/db");
const { Question } = require("../../database/models/Question");
const { User } = require("../../database/models/User");
const { Quiz } = require("../../database/models/Quiz");
const { OAuthUser } = require("../../database/models/OAuthUser");

// GraphQL + Apollo Resolvers
export const resolvers = {
  Query: {
    // Get Quiz By ID
    getQuizByID: async (_: any, args: QuizArgsInt) => {
      // Find All Quizzes
      const quiz = await Quiz.findAll({ where: { id: args.id } });
      // If No Quiz Throw Error
      if (typeof quiz[0] === "undefined") {
        return new ApolloError("Invalid id.");
      }
      // Return Quiz
      return quiz[0].dataValues;
    },
    // Get Questions For Specific Quiz
    getQuestionsForQuiz: async (_: any, args: QuestionArgsInt) => {
      // SQL Query
      const FIND_QUESTION_BY_QUIZ_ID = findQuestionByQuizId(args);
      const [res] = await sequelize.query(FIND_QUESTION_BY_QUIZ_ID);
      // Return Response From DB
      return res;
    },
  },
  Mutation: {
    // Register Mutation
    Register: async (_: any, args: UserArgsInt) => {
      await User.sync({ force: true });

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
      await OAuthUser.sync({ force: true });

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

      return token;
    },
    CreateQuiz: async (_: any, args: QuizArgsInt) => {
      await Quiz.sync({ force: true });

      // Build The Quiz With Args
      const quiz: any = Quiz.build({
        name: args.name,
        id: "",
        usercreatedById: args.userCreatedBy,
        OAuthUserCreatedById: args.OAuthUserCreatedById,
      });

      // Save Quiz
      await quiz.save();

      // Return Quiz
      return quiz;
    },

    CreateQuestion: async (_: any, args: QuestionArgsInt) => {
      // await Question.sync({ force: true });

      // Build The Question With Args
      const question = Question.build({
        title: args.title,
        options: args.options,
        freeresponse: args.freeresponse,
        multiplechoice: args.multiplechoice,
        quizid: args.quizid,
      });

      // Save Question
      await question.save();

      // Return Question
      return question;
    },
  },
};
