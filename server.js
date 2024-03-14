const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const bodyParser = require("body-parser");

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

app.get("/", (req, res) => {
    res.send("Goodbye World 🔥");
  });

  const getAllStudents = async () => {
     try {
      const allStudents = await pool.query("select first_name, student_id from student");
      const students = (allStudents.rows);
    
      return students;
    } catch (error) {
      console.error(error.message);
    }
  }
  
app.get("/students", async (req, res) => {
    const allStudents = await getAllStudents();
    console.log(allStudents);

    return res.render("students.ejs", {
        title: 'All Students',
        allStudents,
    });
  });
  
  app.listen(port, () => {
    console.log(`Server running at PORT ${port}`);
  });