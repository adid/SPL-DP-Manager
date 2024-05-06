const express = require("express");
const app = express();
<<<<<<< HEAD
=======

>>>>>>> f2a017ad2f563febaa3f01ff9e37379eef2ec831
const port = 8000;
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
<<<<<<< HEAD
const session = require("express-session");
const flash = require("connect-flash");
=======

>>>>>>> f2a017ad2f563febaa3f01ff9e37379eef2ec831

// Database Pool
const pool = require("./database/db");

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Session middleware
app.use(
  session({
    secret: "SecretStringForSession",
    cookie: { maxAge: 60000 },
    resave: true,
    saveUninitialized: true,
  })
);

// Flash middleware
app.use(flash());

// EJS
app.set("views", __dirname + "/views");
// console.log(__dirname + '/views');
app.set("view engine", "ejs");

// Static Files
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/views"));

<<<<<<< HEAD
// Login Route
app.get("/", (req, res) => {
  res.render("dashboard/login.ejs", {
    title: "Login - SPL/DP Manager",
    error: "",
  });
});

=======

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

>>>>>>> f2a017ad2f563febaa3f01ff9e37379eef2ec831
const loginUser = async (req, res) => {
  try {
    const { user_id, password } = req.body;

<<<<<<< HEAD
    if (!user_id || !password) {
      return res.status(400).render("dashboard/login", {
        title: "Login",
        error: "Please provide user_id and password",
      });
    }

    const userQuery = `SELECT * FROM users WHERE user_id = '${user_id}'`;
    const userResult = await pool.query(userQuery);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).render("dashboard/login", {
        title: "Login",
        error: "User not found",
      });
    }

=======
    const userQuery = SELECT * FROM users WHERE user_id = '${user_id}';
    const userResult = await pool.query(userQuery);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).render("dashboard/login", {
        title: "Login",
        error: "User not found",
      });
    }

>>>>>>> f2a017ad2f563febaa3f01ff9e37379eef2ec831
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
<<<<<<< HEAD
  return res.status(200).redirect("/");
};

app.get("/user-logout", logoutUser);

// Admin Route
app.get("/admin-dashboard", authMiddleware, (req, res) => {
  const { userInfo } = req;

  res.render("Admin_Dashboard.ejs", {
    title: "Admin Dashboard",
    admin: userInfo,
  });
});


// Teams Route
app.get("/teams", authMiddleware, async (req, res) => {
  try {
    const { userInfo } = req;
    const allTeams = await pool.query("select * from team");
    const teams = allTeams.rows;

    res.render("teams.ejs", {
      title: "All Teams",
      allTeams: teams,
      user: userInfo,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error.message);
  }
});

app.post("/create-team", async (req, res) => {
  try {
    const {
      team_name,
      team_leader,
      student_2,
      student_3,
      team_category,
      academic_year,
    } = req.body;

    // console.log(req.body);

    const team_leader_id = Number(team_leader);
    const student_2_id = Number(student_2);
    const student_3_id = Number(student_3);
    const academic_year_int = academic_year;

    if (
      team_leader_id === student_2_id ||
      team_leader_id === student_3_id ||
      student_2_id === student_3_id
    ) {
      throw new Error(
        "team_leader_id, student_2_id, and student_3_id must be distinct."
      );
    }

    const teamCheckQuery = `
    SELECT *
    FROM team
    WHERE team_leader_id = $1 OR student_2_id = $1 OR student_3_id = $1
  `;
    const teamCheckResult = await pool.query(teamCheckQuery, [team_leader_id]);
    if (teamCheckResult.rows.length > 0) {
      throw new Error(
        "The team leader or one of the students is already part of another team."
      );
    }

    const newTeam = await pool.query(
      "insert into team ( team_name, team_leader_id, student_2_id, student_3_id, category, academic_year) values ($1, $2, $3, $4, $5, $6)",
      [
        team_name,
        team_leader_id,
        student_2_id,
        student_3_id,
        team_category,
        academic_year_int,
      ]
    );

    console.log("Team created");
    req.flash("success", "Team created successfully!");
    //res.redirect("/teams");
    res.redirect("/form-team");
  } catch (error) {
    console.error(error.message);
  }
});

app.get("/teams/:team_id/delete", async (req, res) => {
  const { team_id } = req.params;

  try {
    // Delete the team from the database
    const deleteQuery = await pool.query(
      "DELETE FROM TEAM WHERE TEAM_ID = $1",
      [team_id]
    );

    // Check if any rows were affected
    if (deleteQuery.rowCount === 0) {
      return res.status(404).send("Team not found");
    }

    req.flash("success", "Team deleted successfully!");
    res.redirect("/teams");
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).send("Internal Server Error");
  }
});

const getAllSuperVisors = async () => {
  try {
    const allSupervisors = await pool.query(
      "SELECT first_name || ' ' || last_name as name, T.teacher_id, category, assigned_teams, selected_teams, academic_year FROM Teacher T JOIN Supervisor S ON T.teacher_id = S.teacher_id"
    );
    return allSupervisors.rows;
  } catch (error) {
    console.error(error.message);
  }
};

app.get("/select-supervisor", authMiddleware, async (req, res) => {
  const supervisors = await getAllSuperVisors();
  console.log(supervisors);
  const { userInfo } = req;
  const userStudent = await pool.query(
    "SELECT * FROM student WHERE student_id = $1",
    [userInfo.id]
  );
  const userStudentData = userStudent.rows[0];

  res.render("Select_Supervisor.ejs", {
    title: "Select Supervisor",
    supervisors: supervisors,
    userCat: userStudentData,
  });
});

app.post("/request-supervision", authMiddleware, async (req, res) => {
  const { userInfo } = req;

  try {
    const { idea_1, idea_2, idea_3, choice_1, choice_2, choice_3 } = req.body;
    const ideas = `${idea_1}, ${idea_2}, ${idea_3}`;
    const supervisor_id_1 = Number(choice_1);
    const supervisor_id_2 = Number(choice_2);
    const supervisor_id_3 = Number(choice_3);

    const team_query = await pool.query(
      "SELECT * FROM team WHERE team_leader_id = $1 OR student_2_id = $1 OR student_3_id = $1;",
      [userInfo.id]
    );
    const team = team_query.rows[0];
    const team_id = team.team_id;
    const team_name = team.team_name;
    const category = team.category;
    console.log("Team Category:", category);

    const supervisor_query_1 = await pool.query(
      "SELECT * FROM supervisor WHERE teacher_id = $1 AND category = $2;",
      [supervisor_id_1, category]
    );
    console.log("Supervisor Query 1:", supervisor_query_1.rows);

    const supervisor_query_2 = await pool.query(
      "SELECT * FROM supervisor WHERE teacher_id = $1 AND category = $2;",
      [supervisor_id_2, category]
    );
    console.log("Supervisor Query 2:", supervisor_query_2.rows);

    const supervisor_query_3 = await pool.query(
      "SELECT * FROM supervisor WHERE teacher_id = $1 AND category = $2;",
      [supervisor_id_3, category]
    );
    console.log("Supervisor Query 3:", supervisor_query_3.rows);

    // Check if selected supervisors are unique
    const selectedSupervisors = [
      supervisor_id_1,
      supervisor_id_2,
      supervisor_id_3,
    ];
    const uniqueSupervisors = new Set(selectedSupervisors);
    if (uniqueSupervisors.size !== selectedSupervisors.length) {
      throw new Error("Same teacher cannot be selected twice");
    }

    if (
      supervisor_query_1.rows.length === 0 ||
      supervisor_query_2.rows.length === 0 ||
      supervisor_query_3.rows.length === 0
    ) {
      throw new Error("Supervisor category does not match with team category");
    }
    const requestSupervision1 = await pool.query(
      "insert into requests (date, team_id, team_name, category, ideas, supervisor_id) values (CURRENT_TIMESTAMP, $1, $2, $3, $4, $5)",
      [team_id, team_name, category, ideas, supervisor_id_1]
    );

    const requestSupervision2 = await pool.query(
      "insert into requests (date, team_id, team_name, category, ideas, supervisor_id) values (CURRENT_TIMESTAMP, $1, $2, $3, $4, $5)",
      [team_id, team_name, category, ideas, supervisor_id_2]
    );

    const requestSupervision3 = await pool.query(
      "insert into requests (date, team_id, team_name, category, ideas, supervisor_id) values (CURRENT_TIMESTAMP, $1, $2, $3, $4, $5)",
      [team_id, team_name, category, ideas, supervisor_id_3]
    );

    console.log("Request sent");
    req.flash("success", "Request sent successfully");
    res.redirect("/student-dashboard");
  } catch (error) {
    console.error(error.message);
  }
});

// Teacher Dashboard
app.get("/teacher-dashboard", authMiddleware, (req, res) => {
  const { userInfo } = req;
  //console.log(userInfo);

  res.render("Teacher_dashboard.ejs", {
    title: "Teacher Dashboard",
    teacher: userInfo,
  });
});

// Students Route
const getAvailableStudents = async () => {
  try {
    const availableStudents = await pool.query(
      "SELECT * FROM Student WHERE student_id NOT IN ( SELECT team_leader_id FROM Team UNION SELECT student_2_id FROM Team UNION SELECT student_3_id FROM Team )"
    );
    return availableStudents.rows;
  } catch (error) {
    console.error(error.message);
  }
};

app.get("/students", async (req, res) => {
  try {
    const allStudents = await pool.query("select * from student");
    const students = allStudents.rows;

    res.render("students.ejs", {
      title: "All Students",
      allStudents: students,
    });
  } catch (error) {
    console.error(error.message);
  }
});

// Delete Student

app.post("/students/:id/delete", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteStudent = await pool.query(
      "delete from student where student_id = $1",
      [id]
    );

    const deleteUser = await pool.query(
      "delete from users where user_id = $1",
      [id]
    );

    res.redirect("/students");
  } catch (error) {
    console.error(error.message);
  }
});

// Teachers Route
app.get("/teachers", async (req, res) => {
  try {
    const allTeachers = await pool.query("select * from teacher");
    const teachers = allTeachers.rows;

    res.render("teachers.ejs", {
      title: "All Teachers",
      allTeachers: teachers,
    });
  } catch (error) {
    console.error(error.message);
  }
});

app.post("/teachers/:id/delete", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteTeacher = await pool.query(
      "delete from teacher where teacher_id = $1",
      [id]
    );
    const deleteUser = await pool.query(
      "delete from users where user_id = $1",
      [id]
    );

    res.redirect("/teachers");
  } catch (error) {
    console.error(error.message);
  }
});

// Supervisor Route

const getAllTeachers = async () => {
  try {
    const allTeachers = await pool.query("select * from teacher");
    return allTeachers.rows;
  } catch (error) {
    console.error(error.message);
  }
};

app.get("/supervisors", async (req, res) => {
  try {
    const teachers = await getAllTeachers();
    const allSupervisors = await pool.query("select * from supervisor");
    const supervisors = allSupervisors.rows;

    res.render("supervisors.ejs", {
      title: "All Supervisors",
      allSupervisors: supervisors,
      allTeachers: teachers,
    });
  } catch (error) {
    console.error(error.message);
  }
});

app.get("/supervisors/:id/:category/delete", async (req, res) => {
  try {
    const { id, category } = req.params;
    const deleteSupervisor = await pool.query(
      "delete from supervisor where teacher_id = $1 AND category = $2",
      [id, category]
    );

    res.redirect("/supervisors");
  } catch (error) {
    console.error(error.message);
  }
});

app.post("/supervisors", async (req, res) => {
  try {
    const { teacher_id, supervisor_category, supervisor_teams, academic_year } =
      req.body;
    const newSupervisor = await pool.query(
      "insert into supervisor (teacher_id, category, assigned_teams, selected_teams, academic_year) values ($1, $2, $3, 0, $4)",
      [teacher_id, supervisor_category, supervisor_teams, academic_year]
    );

    res.redirect("/supervisors");
  } catch (error) {
    console.error(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running at PORT ${port}`);
});

// Team selection by supervisor

app.get("/requests", authMiddleware, async (req, res) => {
  const { userInfo } = req;

  try {
    const allRequests = await pool.query(
      "select * from requests where supervisor_id = $1",
      [userInfo.id]
    );
    const requests = allRequests.rows;

    res.render("requests.ejs", {
      title: "Team Requests",
      allRequests: requests,
    });
  } catch (error) {
    console.error(error.message);
  }
});

app.get("/requests/:teamId/:supervisorId/accept", async (req, res) => {
  const { teamId, supervisorId } = req.params;
  try {
    const accepted = await pool.query(
      "UPDATE team SET has_supervisor = $1, supervisor_id = $2 WHERE team_id = $3",
      [true, supervisorId, teamId]
    );

    const removed = await pool.query(
      "DELETE FROM requests WHERE team_id = $1",
      [teamId]
    );

    if (accepted.rowCount > 0 && removed.rowCount > 0) {
      res.redirect("/requests");
    } else {
      res.status(404).send("No matching record found to update or delete.");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/requests/:teamId/:supervisorId/reject", async (req, res) => {
  const { teamId, supervisorId } = req.params;
  try {
    const removed = await pool.query(
      "DELETE FROM requests WHERE team_id = $1 AND supervisor_id = $2",
      [teamId, supervisorId]
    );

    if (removed.rowCount > 0) {
      res.redirect("/requests");
    } else {
      res.status(404).send("No matching record found to update or delete.");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Add Student

app.get("/add_student", (req, res) => {
  const successFlash = req.flash("success");
  const errorFlash = req.flash("error");
  res.render("add_student.ejs", { successFlash, errorFlash });
});

app.post("/students/add", async (req, res) => {
  try {
    const {
      student_id,
      first_name,
      last_name,
      email,
      phone_number,
      category,
      academic_year,
    } = req.body;

    // Insert new student record into the database
    const result = await pool.query(
      "INSERT INTO student (student_id, first_name, last_name, email, phone_number, category, academic_year) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        student_id,
        first_name,
        last_name,
        email,
        phone_number,
        category,
        academic_year,
      ]
    );

    // Insert user record for the student
    const userResult = await pool.query(
      "INSERT INTO users (user_id, password, username, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [student_id, student_id, first_name, "student"]
    );

    req.flash("success", "Student", student_id, "added successfully!");
    res.redirect("/add_student");
  } catch (error) {
    console.error("Error adding student:", error.message);
    req.flash("error", "An error occurred. Please try again.");
    res.render("add_student.ejs");
  }
});

// Add Teacher
app.get("/add_teacher", (req, res) => {
  const successFlash = req.flash("success");
  const errorFlash = req.flash("error");
  res.render("add_teacher", { successFlash, errorFlash });
});

app.post("/teachers/add", async (req, res) => {
  try {
    const { teacher_id, firstName, lastName, email, phoneNumber } = req.body;

    const insertQuery = `
      INSERT INTO teacher (teacher_id, first_name, last_name, email, phone_number)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await pool.query(insertQuery, [
      teacher_id,
      firstName,
      lastName,
      email,
      phoneNumber,
    ]);

    const userResult = await pool.query(
      "INSERT INTO users (user_id, password, username, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [teacher_id, teacher_id, firstName, "teacher"]
    );

    req.flash("success", "Teacher", teacher_id, "added successfully!");
    res.redirect("/add_teacher");
  } catch (error) {
    console.error("Error adding teacher:", error.message);
    req.flash("error", "An error occurred. Please try again.");
    res.render("add_teacher.ejs");
  }
});

app.get("/schedule_meeting", authMiddleware, async (req, res) => {
  const { userInfo } = req;

  try {
    // Query the database to retrieve all teams where supervisor_id matches user.id
    const allTeams = await pool.query(
      "SELECT * FROM team WHERE supervisor_id = $1",
      [userInfo.id]
    );

    // Extract the rows of teams from the query result
    const teams = allTeams.rows;

    // Render the schedule_meeting.ejs template with the teams data
    res.render("schedule_meeting.ejs", {
      title: "Schedule Meeting",
      user: userInfo,
      teams: teams,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/schedule_meeting", authMiddleware, async (req, res) => {
  const { userInfo } = req;
  const { team, meetingDate, meetingTime, meetingDetails } = req.body;

  try {
    // Insert meeting data into the meetings table
    const newMeeting = await pool.query(
      "INSERT INTO meetings (team_id, supervisor_id, meeting_date, meeting_time, meeting_details) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [team, userInfo.id, meetingDate, meetingTime, meetingDetails]
    );
    // Get the team leader and student IDs from the team table
    const teamQuery = await pool.query(
      "SELECT team_leader_id, student_2_id, student_3_id FROM team WHERE team_id = $1",
      [team]
    );
    const { team_leader_id, student_2_id, student_3_id } = teamQuery.rows[0];

    // Create notifications for each student
    const notificationPromises = [
      team_leader_id,
      student_2_id,
      student_3_id,
    ].map(async (studentId) => {
      const message = `A meeting has been scheduled for your team. Meeting Date: ${meetingDate}, Meeting Time: ${meetingTime}, Meeting Details: ${meetingDetails}`;
      await pool.query(
        "INSERT INTO notifications (student_id, message) VALUES ($1, $2)",
        [studentId, message]
      );
    });

    await Promise.all(notificationPromises);

    res.redirect("/schedule_meeting");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/view-meetings', authMiddleware, async (req, res) => {
  try {
    const { userInfo } = req;
      const meetings = await pool.query(
          'SELECT * FROM meetings WHERE supervisor_id = $1',
          [userInfo.id]
      );

      res.render('view_meetings.ejs', {
          title: 'View Meetings',
          meetings: meetings.rows
      });
  } catch (error) {
      console.error('Error fetching meetings:', error);
      res.status(500).send('Internal Server Error');
  }
});


app.get("/student-dashboard", authMiddleware, async(req, res) => {
  const { userInfo } = req;
  const teamQuery = await pool.query(
    "SELECT * FROM team WHERE team_leader_id = $1 OR student_2_id = $1 OR student_3_id = $1",
    [userInfo.id]
  );
  
  const team = teamQuery.rows[0];

   // Query unread notifications for the logged-in student
   const unreadNotificationsQuery = await pool.query(
    "SELECT * FROM notifications WHERE student_id = $1 AND is_read = false",
    [userInfo.id]
  );
  const unreadNotifications = unreadNotificationsQuery.rows;
  
  // Check if there are unread notifications
  const hasUnreadNotifications = unreadNotifications.length > 0;
  res.render("Student_dashboard.ejs", {
    title: "Student Dashboard",
    student: userInfo,
    team: team,
    messages: req.flash(),
    hasUnreadNotifications: hasUnreadNotifications,
    unreadNotifications: unreadNotifications
  });
});



app.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const { userInfo } = req;

    const notification = await pool.query(
      'SELECT * FROM notifications WHERE student_id = $1',
      [userInfo.id]
    );
    
    const notifications = notification.rows;
      // Update all notifications for the user to mark them as read
      await pool.query(
        'UPDATE notifications SET is_read = true WHERE student_id = $1',
        [userInfo.id]
      );
    // Render notifications.ejs with notifications data
    res.render("notifications.ejs", {
      notifications: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).send('Internal Server Error');
  }
});



// Team Formation

app.get("/form-team", authMiddleware, async (req, res) => {
  const { userInfo } = req;
  console.log(userInfo);
 
  const availableStudents = await getAvailableStudents();
  const userStudent = await pool.query(
    "SELECT * FROM student WHERE student_id = $1",
    [userInfo.id]
  );
  const userStudentData = userStudent.rows[0];
  console.log("User Student Data:", userStudentData);

  res.render("Form_Team.ejs", {
    title: "Form Team",
    students: availableStudents,
    user: userInfo,
    userStudent: userStudentData,
    messages: req.flash(),
  });
});
=======
  return res.status(200).redirect("/login");
};

app.get("/user-logout", logoutUser);
>>>>>>> f2a017ad2f563febaa3f01ff9e37379eef2ec831
