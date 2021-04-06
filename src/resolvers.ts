// Modules Imported For Use
import { ApolloError } from "apollo-server-express";
import bcrypt from "bcrypt";
import { generateJWT } from "./auth/generateJWT";
import { UserArgsInt } from "./interfaces/UserArgsInt";
import { StoryArgsInt } from "./interfaces/StoryArgsInt";
import { ReadStoryArgsInt } from "./interfaces/ReadStoryArgsInt";
import { LikeStoryArgsInt } from "./interfaces/LikeStoryArgsInt";
import { StoryIDArgsInt } from "./interfaces/StoryIdArgsInt";
import { SearchArgsInt } from "./interfaces/SearchArgsInt";
import { ProfileArgsInt } from "./interfaces/ProfileArgsInt";
const { GetDate } = require("../../../frontend/src/utils/GetDate");
const { SearchQuery } = require("../../database/sql/SearchQuery");
const { PublishStory } = require("../../database/models/PublishedStory");
const { User } = require("../../database/models/User");
const { OAuthUser } = require("../../database/models/OAuthUser");
const { StoryDraft } = require("../../database/models/StoryDraft");

// GraphQL + Apollo Resolvers
export const resolvers = {
  Query: {
    GetAllStories: async (_: any, args: StoryArgsInt) => {
      // Create Empty Array To Put Stories In
      const stories = [];
      // Find All Published Stories For Given Author
      const publishedStories = await PublishStory.findAll({
        where: {
          // Find By AuthorID
          authorid: args.authorid,
        },
      });

      // Push Each Published Story In Story Array
      for (let story in publishedStories) {
        stories.push(publishedStories[story].dataValues);
      }

      // Find All Drafts For Given Author
      const storyDrafts = await StoryDraft.findAll({
        where: {
          // Find By AuthorID
          authorid: args.authorid,
        },
      });

      // Push Drafts Into Array
      for (let storydraft in storyDrafts) {
        stories.push(storyDrafts[storydraft].dataValues);
      }

      // At This Point All Stories Are In Array So Return That To Client
      return stories;
    },

    ReadStory: async (_: any, args: ReadStoryArgsInt) => {
      // Find ONLY From Published Stories And Return The Story CLient Can Read Based On The Story ID Provided
      const story = await PublishStory.findOne({ where: { id: args.storyid } });

      // If There Is No Story The ID's Do NOT Line Up So Throw Error
      if (!story) {
        return new ApolloError("This Article Does Not Exist...");
      }
      // At The End Return Story Client Can Read
      return story;
    },

    GetTodaysStories: async () => {
      // Get Todays Date
      const todaysDate = GetDate();

      // Find All Published Stories For Todays Date
      const stories = await PublishStory.findAll({
        where: { date_created: todaysDate },
      });
      //Return Them
      return stories;
    },

    GetEditDraft: async (_: any, args: StoryIDArgsInt) => {
      // Find A Story With Given ID
      const draft = await StoryDraft.findOne({ where: { id: args.storyid } });
      // Return The Story
      return draft;
    },

    Search: async (_: any, args: SearchArgsInt) => {
      // Find Stories That Match The Search Query
      const results = await SearchQuery(args.query);
      return results;
    },

    GetSearchableStories: async () => {
      const stories = await PublishStory.findAll();
      return stories;
    },

    SortByDraft: async (_: any, args: StoryArgsInt) => {
      // Find All Drafts For Current User
      const drafts = await StoryDraft.findAll({
        where: { authorid: args.authorid },
      });
      // Return Them
      return drafts;
    },
    SortByPublished: async (_: any, args: StoryArgsInt) => {
      // Find All Published Stories For Current User
      const published = await PublishStory.findAll({
        where: { authorid: args.authorid },
      });
      // Return Them
      return published;
    },
    GetStoriesHome: async (_: any, __: any) => {
      const stories = await PublishStory.findAll({
        order: [["likes", "DESC"]],
      });
      return stories;
    },
    GetProfile: async (_: any, args: ProfileArgsInt) => {
      const user = await User.findOne({ where: { id: args.authorid } });
      const oAuthUser = await OAuthUser.findOne({
        where: { id: args.authorid },
      });
      if (user) return user;
      else return oAuthUser;
    },
    GetProfileInfo: async (_: any, args: ProfileArgsInt) => {
      let userStories = await PublishStory.findAll({
        where: { authorid: args.authorid },
      });
      let stories = await PublishStory.findAll();
      const likes = userStories.reduce((prev: any, cur: any) => {
        return prev + cur.likes;
      }, 0);
      let storiesLiked = 0;
      for (let story in stories) {
        if (stories[story].likedBy.includes(args.authorid)) {
          storiesLiked = storiesLiked + 1;
        }
      }
      console.log(likes, userStories, storiesLiked);
      return [`${userStories.length}`, `${likes}`, `${storiesLiked}`];
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
        id: args.id,
      });

      // Save User To PSQL Database
      await user.save();

      // Create JSONWebToken
      const token = generateJWT({
        username: user.username,
        email: user.email,
        id: user.id,
        bio: user.bio,
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
        image_url: args.image_url,
        id: args.id,
      });

      // Save User To PSQL Database
      await user.save();

      // Create JSONWebToken
      const token = generateJWT({
        username: user.username,
        email: user.email,
        id: user.id,
        bio: user.bio,
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
        bio: user.bio,
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
        bio: user.bio,
        image_url: user.image_url,
      });
      // Return JWT Token To Client
      return token;
    },
    SaveDraft: async (_: any, args: StoryArgsInt) => {
      await StoryDraft.sync({ force: true });

      // Build A New Draft With Given Properties By Client
      const draft = StoryDraft.build({
        content: args.content,
        title: args.title,
        authorid: args.authorid,
        image_url: args.image_url,
        date_created: args.date_created,
        category: args.category,
        id: args.id,
      });

      // Save The Draft To PSQL DB
      await draft.save();

      // If All Worked Above Return True
      return true;
    },

    PublishStory: async (_: any, args: StoryArgsInt) => {
      // await PublishStory.sync({ force: true });

      const author = await User.findOne({ where: { id: args.authorid } });
      const OAuthAuthor = await OAuthUser.findOne({
        where: { id: args.authorid },
      });

      console.log(author);
      console.log(OAuthAuthor);

      // Build Published Story With Given Properties From Client
      const story = PublishStory.build({
        content: args.content,
        title: args.title,
        authorid: args.authorid,
        image_url: args.image_url,
        date_created: args.date_created,
        category: args.category,
        id: args.id,
        authorName: author ? author.username : OAuthAuthor.username,
        authorImage: author ? author.image_url : OAuthAuthor.image_url,
      });

      // Save To Story PSQL DB
      await story.save();

      // If All Above Worked Return True
      return true;
    },

    LikeStory: async (_: any, args: LikeStoryArgsInt) => {
      // Store Users Who Liked Story In Array
      const likedBy: Array<string> = [];
      // Find Story With Given ID
      const story = await PublishStory.findOne({ where: { id: args.storyid } });
      // If User Has Alread Liked Post When They Click On Button Again Decrease Likes And Remove From LikedBy Array
      if (story.likedBy.includes(args.authorid)) {
        (story.likes = story.likes - 1),
          (story.likedBy = story.likedBy.filter(
            (authorid: any) => authorid !== args.authorid
          )),
          await story.save();
        return true;
      }
      // Else Increase Like And Add To LikedBy Array
      else {
        story.likes = story.likes + 1;
        likedBy.push(...story.likedBy, args.authorid);
        console.log(likedBy);
        story.likedBy = likedBy;
        await story.save();
        return true;
      }
    },

    EditDraft: async (_: any, args: StoryArgsInt) => {
      // Find Story Draft
      const story = await StoryDraft.findOne({ where: { id: args.storyid } });
      // Edit Following Properties
      story.title = args.title;
      story.category = args.category;
      story.image_url = args.image_url;
      story.content = args.content;
      args.date_created = args.date_created;
      // Save Draft
      await story.save();
      return true;
    },

    DeleteDraftOncePublished: async (_: any, args: StoryIDArgsInt) => {
      // Find Story To Delete
      const story = await StoryDraft.findOne({ where: { id: args.storyid } });
      // DELETE
      await story.destroy();
      return true;
    },
    UpdateProfile: async (_: any, args: ProfileArgsInt) => {
      const user = await User.findOne({ where: { id: args.authorid } });
      const oAuthUser = await OAuthUser.findOne({
        where: { id: args.authorid },
      });
      const stories = await PublishStory.findAll({
        where: { authorid: args.authorid },
      });

      if (user) {
        for (let story in stories) {
          stories[story].authorImage = args.image_url;
          await stories[story].save();
        }

        user.bio = args.bio;
        user.image_url = args.image_url;
        await user.save();
        return true;
      } else {
        for (let story in stories) {
          stories[story].authorImage = args.image_url;
          await stories[story].save();
        }

        oAuthUser.bio = args.bio;
        oAuthUser.image_url = args.image_url;
        await oAuthUser.save();
        return true;
      }
    },
  },
};
