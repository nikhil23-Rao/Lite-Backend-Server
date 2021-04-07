const { Sequelize } = require("sequelize");

export const sequelize = new Sequelize(
  "postgres://zxtlytkbegelmt:be69bd36157d80eb39ce6a2e19c1fb524a849bc1f0a211ef35f2e7d79f382118@ec2-34-225-103-117.compute-1.amazonaws.com:5432/d5c8k8n34j8ett",
  {
    dialect: "postgres",
    protocol: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

export const connectToDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected To PSQL DB");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};
