const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const { encrypt, decrypt } = require("./models/cryptoUtils");
const Note = require("./models/Note");
const User = require("./models/User");
const app = express();
const path = require("path");
const imagesDirectory = path.join(__dirname, "logo");
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
const port = 3000;

const conn = new Sequelize("noter", "root", "", {
  host: "localhost",
  dialect: "mysql",
});
conn
  .sync()
  .then(() => {
    console.log("Database connected successfully !!!");
  })
  .catch((err) => {
    console.error("Error connecting with database:", err);
  });

//endpoint to serve html

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

app.get("/login", (req, res) => {
  res.sendFile("pages/login.html", { root: __dirname });
});

app.get("/signup", (req, res) => {
  const { userToken } = req.body;
  res.sendFile("pages/signup.html", { root: __dirname });
});

app.get("/about", (req, res) => {
  const { userToken } = req.body;
  res.sendFile("pages/about.html", { root: __dirname });
});

//endpoint to serve api

app.post("/getnotes", async (req, res) => {
  const { email } = req.body;

  try {
    const notes = await Note.findAll({ where: { email: email } });

    // Decrypt the title and description before sending them
    const decryptedNotes = notes.map((note) => {
      return {
        id: note.id,
        title: decrypt(note.title), // Decrypt the title
        desc: decrypt(note.desc), // Decrypt the description
      };
    });

    res.json({ success: true, notes: decryptedNotes });
  } catch (error) {
    console.error("Error retrieving notes:", error);
    res.json({ success: false, message: "Failed to retrieve notes" });
  }
});
// app.post("/getnotes", async (req, res) => {
//   const { email } = req.body;

//   try {
//     // Ensure that email is provided
//     if (!email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email is required" });
//     }

//     // Find notes for the given email
//     const notes = await Note.findAll({ where: { email } });

//     // Log the notes for debugging
//     console.log("Notes:", notes);

//     // Send the notes as a JSON response
//     res.status(200).json({ success: true, notes });
//   } catch (error) {
//     // Log any errors
//     console.error("Error fetching notes:", error);
//     // Send an error response with status code 500
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// });

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find a user with the provided email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // User not found
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Incorrect password
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Successful login
    res.status(200).json({ success: true, user: user });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the hashed password
    const newUser = await User.create({ email, password: hashedPassword });

    // Return success response
    res.status(200).json({
      success: true,
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.post("/addnote", async (req, res) => {
  const { title, desc, email } = req.body;

  // Encrypt the title and description
  const encryptedTitle = encrypt(title);
  const encryptedDesc = encrypt(desc);

  try {
    // Save to the database
    await Note.create({
      title: encryptedTitle,
      desc: encryptedDesc,
      email: email,
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding note:", error);
    res.json({ success: false, message: "Failed to add note" });
  }
});

// app.post("/addnote", async (req, res) => {
//   const { userToken } = req.body;
//   let note = await Note.create(req.body);
//   res.status(200).json({ success: true, note });
// });

app.post("/deleteNote", async (req, res) => {
  const { id } = req.body;
  try {
    const note = await Note.findByPk(id); // Find the note by its primary key
    if (!note) {
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    }
    await note.destroy(); // Delete the note
    res.json({ success: true, message: "Note deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/updateNote", async (req, res) => {
  const { id, title, desc } = req.body;

  // Encrypt the new title and description
  const encryptedTitle = encrypt(title);
  const encryptedDesc = encrypt(desc);

  try {
    // Update the note in the database
    const updatedNote = await Note.update(
      {
        title: encryptedTitle,
        desc: encryptedDesc,
      },
      {
        where: { id: id }, // Specify the note to update by its ID
      }
    );

    if (updatedNote[0] === 0) {
      // No rows updated, which means the ID might not exist
      return res.json({ success: false, message: "Note not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating note:", error);
    res.json({ success: false, message: "Failed to update note" });
  }
});

// app.post("/updateNote", async (req, res) => {
//   const { id, title, desc, email } = req.body;
//   try {
//     // Find the note by its primary key
//     const note = await Note.findByPk(id);
//     if (!note) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Note not found" });
//     }
//     // Update the title and description
//     note.title = title;
//     note.desc = desc;
//     await note.save();
//     res.json({ success: true, message: "Note updated successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });

app.post("/logout", async (req, res) => {
  try {
    // Respond with a success message
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
});

app.post("/checkemail", async (req, res) => {
  const { email } = req.body;

  try {
    // Check if a user with the provided email exists
    const existingUser = await User.findOne({ where: { email } });

    // Send response indicating whether the user exists
    res.status(200).json({ exists: existingUser !== null });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

//favicon
app.use("/logo", express.static(imagesDirectory));

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
