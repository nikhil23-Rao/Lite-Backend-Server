import { DataTypes } from "sequelize";
import { sequelize } from "../src/connection";

export const User = sequelize.define("User", {
  // Model attributes are defined here
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue:
      "http://static1.squarespace.com/static/54b7b93ce4b0a3e130d5d232/54e20ebce4b014cdbc3fd71b/5a992947e2c48320418ae5e0/1519987239570/icon.png?format=1500w",
  },
  bio: {
    type: DataTypes.TEXT,
    defaultValue: "",
  },
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
});
