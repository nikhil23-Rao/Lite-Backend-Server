import { DataTypes } from "sequelize";
import { sequelize } from "../src/connection";

export const StoryDraft = sequelize.define("StoryDraft", {
  // Model attributes are defined here
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  date_created: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
  category: {
    type: DataTypes.STRING,
  },
  authorid: {
    type: DataTypes.STRING,
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});
