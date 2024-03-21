const express = require("express");
const app = express();

const port = 8000;
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");


// Database Pool
const pool = require("./database/db");

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// EJS
app.set("views", __dirname + "/views");
// console.log(__dirname + '/views');
app.set("view engine", "ejs");

// Static Files
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/views"));


// Root Route
app.get("/", (req, res) => {
  res.send("Goodbye World 🔥");
});

// Login Route
app.get("/login", (req, res) => {
  res.render("dashboard/login.ejs", {
    title: "Login",
    error: "",
  });
});

const loginUser = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    const userQuery = SELECT * FROM users WHERE user_id = '${user_id}';
    const userResult = await pool.query(userQuery);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).render("dashboard/login", {
        title: "Login",
        error: "User not found",
      });
    }

    const passwordMatch = password === user.password;

    if (!passwordMatch) {
      return res.status(400).render("dashboard/login", {
        title: "Login",
        error: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: user.user_id,
        username: user.username,
        role: user.role,
      },
      "randomsecret",
      {
        expiresIn: "2d",
      }
    );

    res.cookie("userToken", token, {
      expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    });

    console.log("Logged in");
    if (user.role === "admin") {
      return res.status(200).redirect("/admin-dashboard");
    } else if (user.role === "student") {
      return res.status(200).redirect("/student-dashboard");
    } else if (user.role === "teacher") {
      return res.status(200).redirect("/teacher-dashboard");
    }
  } catch (error) {
    return res.status(500).render("dashboard/error.ejs", {
      status: 500,
      title: "Error",
      message: "Internal server error",
      error: error,
    });
  }
};

app.post("/user-login", loginUser);

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  const { userToken } = req.cookies;

  if (userToken) {
    try {
      const decodedToken = await jwt.verify(userToken, "randomsecret");
      req.userInfo = decodedToken;
      next();
    } catch (error) {
      return res.status(401).redirect("/login");
    }
  } else {
    return res.status(401).redirect("/login");
  }
};

// Logout Route
const logoutUser = (req, res) => {
  res.clearCookie("userToken");
  return res.status(200).redirect("/login");
};

app.get("/user-logout", logoutUser);
