const { Sequelize, DataTypes } = require("sequelize");

const conn = new Sequelize("noter", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: console.log,
});

const noteSchema = conn.define(
  "Note",
  {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true,
    },
    desc: {
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
    console.log("Note model synced with database");
  })
  .catch((err) => {
    console.error("Error syncing Note model with database:", err);
  });
module.exports = noteSchema;
