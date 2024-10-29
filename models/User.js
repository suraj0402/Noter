const { Sequelize, DataTypes } = require("sequelize");

const conn = new Sequelize("noter", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: console.log,
});

const userSchema = conn.define(
  "User",
  {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      required: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Synchronize the model with the database (create the table if it doesn't exist)
conn
  .sync()
  .then(() => {
    console.log("User model synced with database");
  })
  .catch((err) => {
    console.error("Error syncing User model with database:", err);
  });
module.exports = userSchema;
