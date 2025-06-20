const express = require("express");
const app = express();
const port = 8000;
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");

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

// Login Route
app.get("/", (req, res) => {
  res.render("dashboard/login.ejs", {
    title: "Login - SPL/DP Manager",
    error: "",
  });
});

const loginUser = async (req, res) => {
  try {
    const { user_id, password } = req.body;

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
  return res.status(200).redirect("/");
};

app.get("/user-logout", logoutUser);


// Admin Route
// Route to fetch notifications and render admin dashboard with notification status
app.get('/admin-dashboard', authMiddleware, async (req, res) => {
  const { userInfo } = req;
  const successFlash = req.flash("success");
  const errorFlash = req.flash("error");

  try {
    // Fetch unread notifications count
    const unreadCountQuery = `
      SELECT COUNT(*) FROM admin_notices
      WHERE user_id = $1 AND is_read = FALSE
    `;
    const unreadCountResult = await pool.query(unreadCountQuery, [userInfo.id]);
    const hasUnreadNotifications = unreadCountResult.rows[0].count > 0;

    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      admin: userInfo,
      hasUnreadNotifications,
      successFlash, errorFlash,
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to fetch and display all notifications for the admin
// Route to fetch and display all notifications for the admin
app.get('/admin-notifications', authMiddleware, async (req, res) => {
  const { userInfo } = req;

  try {
    const notificationsQuery = `
      SELECT a.*, u.username AS sender_username
      FROM admin_notices a
      INNER JOIN users u ON a.sender_id = u.user_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `;
    const notificationsResult = await pool.query(notificationsQuery, [userInfo.id]);
    const notifications = notificationsResult.rows;

    // Mark all notifications as read
    const markAsReadQuery = `
      UPDATE admin_notices
      SET is_read = TRUE
      WHERE user_id = $1
    `;
    await pool.query(markAsReadQuery, [userInfo.id]);

    res.render('admin_notifications', {
      title: 'Notifications',
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).send('Internal Server Error');
  }
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
      req.flash("error", "Team members must be distinct.");
      res.redirect("/form-team");
    }

    const teamCheckQuery = `
    SELECT *
    FROM team
    WHERE team_leader_id = $1 OR student_2_id = $1 OR student_3_id = $1
  `;
    const teamCheckResult = await pool.query(teamCheckQuery, [team_leader_id]);
    if (teamCheckResult.rows.length > 0) {
      req.flash("error", "The team leader or one of the students is already part of another team.");
      res.redirect("/form-team");
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
  const successFlash = req.flash("success");
  const errorFlash = req.flash("error");
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
    successFlash, errorFlash,
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
      req.flash("error", "Same teacher cannot be selected twice");
      res.redirect("/select-supervisor");
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
// Teacher Dashboard
app.get("/teacher-dashboard", authMiddleware, async (req, res) => {
  const { userInfo } = req;
  const successFlash = req.flash("success");
  const errorFlash = req.flash("error");

  try {
      // Query unread notifications for the logged-in teacher
      const unreadNotificationsQuery = await pool.query(
          "SELECT * FROM admin_notices WHERE user_id = $1 AND is_read = false",
          [userInfo.id]
      );
      const unreadNotifications = unreadNotificationsQuery.rows;

      // Check if there are unread notifications
      const hasUnreadNotifications = unreadNotifications.length > 0;

      res.render("Teacher_dashboard.ejs", {
          title: "Teacher Dashboard",
          teacher: userInfo,
          hasUnreadNotifications: hasUnreadNotifications,
          unreadNotifications: unreadNotifications,
          successFlash, errorFlash,
      });
  } catch (error) {
      console.error("Error fetching teacher notifications:", error);
      res.status(500).send("Internal Server Error");
  }
});
// Teacher Notifications
app.get("/teacher-notifications", authMiddleware, async (req, res) => {
  const { userInfo } = req;

  try {
      // Query notifications for the logged-in teacher
      const notificationsQuery = await pool.query(
          "SELECT * FROM admin_notices WHERE user_id = $1",
          [userInfo.id]
      );
      const notifications = notificationsQuery.rows;
      // Update is_read status of notifications
      await pool.query(
        "UPDATE admin_notices SET is_read = true WHERE user_id = $1",
        [userInfo.id]
        );
      res.render("teacher_notifications.ejs", {
          title: "Teacher Notifications",
          notifications: notifications
      });
  } catch (error) {
      console.error("Error fetching teacher notifications:", error);
      res.status(500).send("Internal Server Error");
  }
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
  try {
    // Get the count of teams assigned to each supervisor for each category
    const teamCounts = await pool.query(
      "SELECT supervisor_id, category, COUNT(*) AS count FROM team GROUP BY supervisor_id, category"
    );

    // Update the selected_teams column in the supervisor table for each supervisor and category
    for (const { supervisor_id, category, count } of teamCounts.rows) {
      await pool.query(
        "UPDATE supervisor SET selected_teams = $1 WHERE teacher_id = $2 AND category = $3",
        [count, supervisor_id, category]
      );
    }

    const { userInfo } = req;
    const allRequests = await pool.query(
      "SELECT * FROM requests WHERE supervisor_id = $1",
      [userInfo.id]
    );
    const requests = allRequests.rows;

    res.render("requests.ejs", {
      title: "Team Requests",
      allRequests: requests,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});


  app.get("/requests/:teamId/:supervisorId/accept", async (req, res) => {
  const { teamId, supervisorId } = req.params;
  try {
    
    const teamCategoryQuery = await pool.query(
      "SELECT category FROM team WHERE team_id = $1",
      [teamId]
    );
    const { category } = teamCategoryQuery.rows[0];
    console.log(teamId, supervisorId, category);
    const selectedTeamsCount = await pool.query(
      "SELECT selected_teams FROM supervisor WHERE teacher_id = $1 AND category = $2",
      [supervisorId, category]
    );

    const {selected_teams} = selectedTeamsCount.rows[0];
    console.log(selected_teams);
    // Get the current count of assigned_teams for the supervisor and category
    const assignedTeamsCount = await pool.query(
      "SELECT assigned_teams AS count FROM supervisor WHERE teacher_id = $1 AND category = $2",
      [supervisorId, category]
    );

    const { count } = assignedTeamsCount.rows[0];
    console.log(count);
    // Check if the supervisor can accept another team
    if (selected_teams >= count) {
      return res.status(403).send("Supervisor has reached the limit for assigned teams in this category.");
    }
    const accepted = await pool.query(
      "UPDATE team SET has_supervisor = $1, supervisor_id = $2 WHERE team_id = $3",
      [true, supervisorId, teamId]
    );

    const removed = await pool.query(
      "DELETE FROM requests WHERE team_id = $1",
      [teamId]
    );

    const slotsAvailable= await pool.query(
      "DELETE FROM requests WHERE team_id = $1 AND category = $2",
      [supervisorId, category]
    );

    /*const increase = await pool.query(
      " update supervisor set selected_teams = selected_teams+1 where teacher_id = $1 AND category = $2",
      [supervisorId, category]
    );*/

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


// Schedule Meeting
app.get("/schedule_meeting", authMiddleware, async (req, res) => {
  const { userInfo } = req;
  const successFlash = req.flash("success");
  const errorFlash = req.flash("error");

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
      successFlash, errorFlash,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/schedule_meeting", authMiddleware, async (req, res) => {
  const { userInfo } = req;
  const { team, meetingDate, meetingTime, meetingDetails } = req.body;

  // Get the current date
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Set time to midnight for comparison

  // Convert meeting date to Date object for comparison
  const selectedDate = new Date(meetingDate);

  try {
    // Check if the selected date is in the past
    if (selectedDate < currentDate) {
      req.flash("error", "Meeting cannot be scheduled for a past date.");
      res.redirect("/schedule_meeting");
      return;
    }
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
    req.flash("success", "Meeting scheduled successfully.");
    res.redirect("/schedule_meeting");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// View Meetings
app.get('/view-meetings', authMiddleware, async (req, res) => {
  try {
    const { userInfo } = req;
    const { team_id } = req.query;

    // Fetch all teams supervised by the teacher
    const allTeams = await pool.query(
      'SELECT * FROM team WHERE supervisor_id = $1',
      [userInfo.id]
    );
    const teams = allTeams.rows;

    // Fetch meetings for the selected team
    let meetings = [];
    if (team_id) {
      const allMeetings = await pool.query(
        'SELECT * FROM meetings WHERE team_id = $1',
        [team_id]
      );
      meetings = allMeetings.rows;
    }

    res.render('view_meetings.ejs', {
      title: 'View Meetings',
      teams: teams,
      meetings: meetings,
      selectedTeam: team_id
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to render the edit notes page
app.get('/edit-meeting-notes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await pool.query('SELECT * FROM meetings WHERE id = $1', [id]);
    if (meeting.rows.length === 0) {
      return res.status(404).send('Meeting not found');
    }
    res.render('edit_meeting_notes.ejs', { meeting: meeting.rows[0] });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle updating meeting notes
app.post('/update-meeting-notes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { meeting_notes } = req.body;
    await pool.query(
      'UPDATE meetings SET meeting_notes = $1 WHERE id = $2',
      [meeting_notes, id]
    );
    res.redirect(`/view-meetings?team_id=${req.body.team_id}`);
  } catch (error) {
    console.error('Error updating meeting notes:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/student-view-meetings', authMiddleware, async (req, res) => {
  try {
    const { userInfo } = req;

    // Fetch the team where the user is a team leader or a team member
    const team = await pool.query(
      'SELECT * FROM team WHERE team_leader_id = $1 OR student_2_id = $1 OR student_3_id = $1',
      [userInfo.id]
    );

    if (team.rows.length === 0) {
      return res.status(404).send('You are not part of any team.');
    }

    const team_id = team.rows[0].team_id;

    // Fetch meetings for the selected team
    const allMeetings = await pool.query(
      'SELECT * FROM meetings WHERE team_id = $1',
      [team_id]
    );
    const meetings = allMeetings.rows;

    res.render('view_meetings_student.ejs', {
      title: 'View Meetings',
      team: team.rows[0],
      meetings: meetings
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to render the edit notes page
app.get('/student-edit-meeting-notes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await pool.query('SELECT * FROM meetings WHERE id = $1', [id]);
    if (meeting.rows.length === 0) {
      return res.status(404).send('Meeting not found');
    }
    res.render('student_edit_meeting_notes.ejs', { meeting: meeting.rows[0] });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle updating meeting notes
app.post('/student-update-meeting-notes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { meeting_notes } = req.body;
    await pool.query(
      'UPDATE meetings SET meeting_notes = $1 WHERE id = $2',
      [meeting_notes, id]
    );
    res.redirect(`/student-view-meetings`);
  } catch (error) {
    console.error('Error updating meeting notes:', error);
    res.status(500).send('Internal Server Error');
  }
});





// Student Dashboard
app.get("/student-dashboard", authMiddleware, async(req, res) => {
  const { userInfo } = req;

  // Query team information for the logged-in student
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

  // Query unread announcements for the logged-in student
  const unreadAnnouncementsQuery = await pool.query(
      "SELECT * FROM admin_notices WHERE user_id = $1 AND is_read = false",
      [userInfo.id]
  );
  const unreadAnnouncements = unreadAnnouncementsQuery.rows;

  // Check if there are unread announcements
  const hasUnreadAnnouncements = unreadAnnouncements.length > 0;

  res.render("Student_dashboard.ejs", {
      title: "Student Dashboard",
      student: userInfo,
      team: team,
      messages: req.flash(),
      hasUnreadNotifications: hasUnreadNotifications,
      unreadNotifications: unreadNotifications,
      hasUnreadAnnouncements: hasUnreadAnnouncements,
      unreadAnnouncements: unreadAnnouncements
  });
});

// Student Notifications Route
app.get("/student-notifications", authMiddleware, async (req, res) => {
  const { userInfo } = req;

  try {
      // Query unread notifications for the logged-in student
      const unreadNotificationsQuery = await pool.query(
          "SELECT * FROM admin_notices WHERE user_id = $1",
          [userInfo.id]
      );

      const unreadNotifications = unreadNotificationsQuery.rows;

      // Mark unread notifications as read
      await pool.query(
          "UPDATE notifications SET is_read = true WHERE student_id = $1 AND is_read = false",
          [userInfo.id]
      );
         // Update all notifications for the user to mark them as read
         await pool.query(
          'UPDATE admin_notices SET is_read = true WHERE user_id = $1',
          [userInfo.id]
        );

      res.render("student_notifications.ejs", {
          title: "Student Notifications",
          notifications: unreadNotifications
      });
  } catch (error) {
      console.error("Error fetching student notifications:", error);
      res.status(500).send("Internal Server Error");
  }
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
  const successFlash = req.flash("success");
  const errorFlash = req.flash("error");
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
    successFlash, errorFlash,
  });

});
    
app.get("/select-team", authMiddleware, async (req, res) => {
  const { userInfo } = req;

  try {
      // Query all teams where the teacher is the supervisor
      const teamsQuery = await pool.query(
          "SELECT * FROM team WHERE supervisor_id = $1",
          [userInfo.id]
      );

      const teams = teamsQuery.rows;

      res.render("select_team.ejs", {
          title: "Select Team",
          teams,
      });
  } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).send("Internal Server Error");
  }
});


// Route to get meetings for a specific team
app.get('/take-attendance/:team_id', authMiddleware, async (req, res) => {
  try {
    const { team_id } = req.params; // Extract team_id from URL parameters

    // Query the database to get meetings for the specified team
    const meetingsQuery = await pool.query(
      'SELECT * FROM meetings WHERE team_id = $1',
      [team_id]
    );
    const meetings = meetingsQuery.rows;

    // Fetch the team details to get student IDs
    const teamQuery = await pool.query('SELECT * FROM team WHERE team_id = $1', [team_id]);
    const team = teamQuery.rows[0];

    const attendanceQuery = await pool.query(
      'SELECT * FROM attendance WHERE meeting_id = ANY(SELECT id FROM meetings WHERE team_id = $1)',
      [team_id]
  );
  const attendanceRecords = attendanceQuery.rows;

    

    // Check if there are any meetings found
    if (meetings.length === 0) {
      return res.status(404).send('No meetings found for this team.');
    }

    // Render a page to take attendance, passing the list of meetings
    res.render('take_attendance.ejs', {
      title: 'Take Attendance',
      team,
      attendanceRecords,
      meetings: meetings, // Pass meetings data to the EJS template
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/take-attendance/:meeting_id', authMiddleware, async (req, res) => {
  const { meeting_id } = req.params;
  const { attendance_leader, attendance_member2, attendance_member3 } = req.body;

  try {
    // Get the meeting to find the associated team_id
    const meetingQuery = await pool.query('SELECT * FROM meetings WHERE id = $1', [meeting_id]);
    const meeting = meetingQuery.rows[0];

    if (!meeting) {
      return res.status(404).send('Meeting not found.');
    }

    // Get the team information to fetch student IDs
    const teamQuery = await pool.query('SELECT * FROM team WHERE team_id = $1', [meeting.team_id]);
    const team = teamQuery.rows[0];

    if (!team) {
      return res.status(404).send('Team not found.');
    }

    // Create a list of attendance records to update or insert
    const attendanceRecords = [];

    if (team.team_leader_id) {
      attendanceRecords.push({
        student_id: team.team_leader_id,
        is_present: !!attendance_leader, // Convert to boolean
      });
    }

    if (team.student_2_id) {
      attendanceRecords.push({
        student_id: team.student_2_id,
        is_present: !!attendance_member2, // Convert to boolean
      });
    }

    if (team.student_3_id) {
      attendanceRecords.push({
        student_id: team.student_3_id,
        is_present: !!attendance_member3, // Convert to boolean
      });
    }

    // Use ON CONFLICT to update existing records or insert new ones
    const insertOrUpdateQuery = `
      INSERT INTO attendance (meeting_id, student_id, is_present)
      VALUES ($1, $2, $3)
      ON CONFLICT (meeting_id, student_id)
      DO UPDATE SET is_present = EXCLUDED.is_present
    `;

    // Insert or update attendance records
    for (const record of attendanceRecords) {
      await pool.query(insertOrUpdateQuery, [meeting_id, record.student_id, record.is_present]);
    }

    //res.send('Attendance recorded successfully.');
    res.redirect('/take-attendance/' + team.team_id);
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/view-attendance', authMiddleware, async (req, res) => {
  try {
    const { userInfo } = req; // Logged-in teacher information
    const teamsQuery = await pool.query('SELECT * FROM team WHERE supervisor_id = $1', [userInfo.id]);
    const teams = teamsQuery.rows;

    // Render the page with the dropdown of all teams
    res.render('view_attendance', {
      title: 'View Attendance',
      teams,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/view-attendance/:team_id', authMiddleware, async (req, res) => {
  const { team_id } = req.params;

  try {
    // Get all meetings for the team
    const meetingsQuery = await pool.query('SELECT * FROM meetings WHERE team_id = $1', [team_id]);
    const meetings = meetingsQuery.rows;

    // Get all attendance records for the team
    const attendanceQuery = await pool.query(
      'SELECT * FROM attendance WHERE meeting_id IN (SELECT id FROM meetings WHERE team_id = $1)',
      [team_id]
    );
    const attendanceRecords = attendanceQuery.rows;

    // Get the team information
    const teamQuery = await pool.query('SELECT * FROM team WHERE team_id = $1', [team_id]);
    const team = teamQuery.rows[0];

    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Calculate attendance summary for each team member
    const calculateAttendanceSummary = (student_id, attendanceRecords, totalMeetings) => {
      const attended = attendanceRecords.filter(
        (record) => record.student_id === student_id && record.is_present
      ).length;
      const attendancePercentage = ((attended / totalMeetings) * 100).toFixed(2);

      return {
        totalMeetings,
        attended,
        attendancePercentage,
      };
    };

    const attendanceSummary = {
      leader: calculateAttendanceSummary(team.team_leader_id, attendanceRecords, meetings.length),
      member2: calculateAttendanceSummary(team.student_2_id, attendanceRecords, meetings.length),
      member3: calculateAttendanceSummary(team.student_3_id, attendanceRecords, meetings.length),
    };

    // Return attendance summary
    res.json({
      team,
      attendanceSummary,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Route to render the input marks page
app.get('/input-marks', authMiddleware, async (req, res) => {
  try {
    const { userInfo } = req;
    const teamsQuery = await pool.query('SELECT * FROM team WHERE supervisor_id = $1', [userInfo.id]);
    const teams = teamsQuery.rows;

    res.render('select_team_marks', {
      title: 'Select Team',
      user: userInfo, // Pass user information to the view
      teams,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Backend Route to render the mark input page for a specific team
app.get('/input-marks/:team_id', authMiddleware, async (req, res) => {
  const { team_id } = req.params;

  try {
    // Fetch team information
    const teamQuery = await pool.query('SELECT * FROM team WHERE team_id = $1', [team_id]);
    const team = teamQuery.rows[0];

    if (!team) {
      return res.status(404).send('Team not found.');
    }

    // Fetch information of all members of the team
    const membersQuery = await pool.query(
      'SELECT * FROM student WHERE student_id IN ($1, $2, $3)',
      [team.team_leader_id, team.student_2_id, team.student_3_id]
    );
    const members = membersQuery.rows;

    res.render('input_marks', {
      title: 'Input Marks',
      team,
      members,
      successFlash: req.flash('success'), // Include flash messages
      errorFlash: req.flash('error'),
    });
  } catch (error) {
    console.error('Error fetching team and members:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Backend Route to handle submission of marks
app.post('/submit-marks', authMiddleware, async (req, res) => {
  const marks = req.body.marks;
  const { userInfo } = req;
  console.log(marks);

  try {
    // Find the team_id using one of the student IDs
    const teamQuery = await pool.query(
      'SELECT team_id FROM team WHERE team_leader_id = $1 OR student_2_id = $1 OR student_3_id = $1',
      [Object.keys(marks)[0]]
    );
    const { team_id } = teamQuery.rows[0];

    // Check if marks already exist for this team
    const existingMarksQuery = await pool.query('SELECT * FROM marks WHERE team_id = $1', [team_id]);
    if (existingMarksQuery.rows.length > 0) {
      req.flash('error', 'Marks already exist for this team.');
      return res.redirect('/teacher-dashboard'); // Return after redirect
    }

    // Iterate over the marks object and insert marks for each student
    for (const student_id in marks) {
      const mark = marks[student_id];
      // Insert marks into the database for the current student
      await pool.query('INSERT INTO marks (team_id, supervisor_id, student_id, mark) VALUES ($1, $2, $3, $4)', [
        team_id,
        userInfo.id,
        student_id,
        mark,
      ]);
    }

    req.flash('success', 'Marks updated successfully.');
    res.redirect('/teacher-dashboard');
  } catch (error) {
    console.error('Error submitting marks:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Backend Route to handle view marks based on team category
app.get('/view-marks', authMiddleware, async (req, res) => {
  const { userInfo } = req;
  const { category } = req.query;

  try {
      console.log('Supervisor ID:', userInfo.id); // Debugging statement
      console.log('Category:', category); // Debugging statement

      // Fetch teams based on the supervisor's ID and the selected category
      const teamsQuery = await pool.query('SELECT * FROM team WHERE supervisor_id = $1 AND category = $2', [userInfo.id, category]);
      const teams = teamsQuery.rows;

      console.log('Teams:', teams); // Debugging statement

      // Initialize an array to store marks data for each team
      const marksData = [];

      // Iterate over each team to fetch marks data for its members
      for (const team of teams) {
          const marksQuery = await pool.query('SELECT * FROM marks WHERE team_id = $1', [team.team_id]);
          const marks = marksQuery.rows;

          // Add marks data to the marksData array
          marksData.push({
              teamName: team.team_name,
              marks: marks
          });
      }

      console.log('Marks Data:', marksData); // Debugging statement

      // Render the view-marks EJS template with the marks data
      res.render('view_marks', { marksData });
  } catch (error) {
      console.error('Error fetching marks:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Send Notice
app.get('/send-notice', authMiddleware, (req, res) => {
  try {
    const { userInfo } = req;
    const successFlash = req.flash("success");
    const errorFlash = req.flash("error");

    // Check if the user is an admin
    if (userInfo.role !== 'admin') {
      return res.status(403).send('Forbidden'); // Return a 403 Forbidden status if not an admin
    }

    // Render the send_notice page
    res.render('send_notice.ejs', {
      title: 'Send Notice',
      successFlash, errorFlash,
    });
  } catch (error) {
    console.error('Error rendering send_notice page:', error);
    res.status(500).send('Internal Server Error'); // Send a 500 Internal Server Error status if an error occurs
  }
});

app.post('/send-notice', authMiddleware, async (req, res) => {
  const { noticeContent, category } = req.body;
  const { userInfo } = req;

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // Fetch all admin user IDs
    const adminQuery = `
      SELECT user_id FROM users WHERE role = 'admin'
    `;
    const adminResults = await pool.query(adminQuery);
    const adminIds = adminResults.rows.map(row => row.user_id);
    console.log(`Fetched admin IDs: ${adminIds}`);

    // Insert notices for all admins
    const insertAdminNoticeQuery = `
      INSERT INTO admin_notices (user_id, message, category, sender_id)
      VALUES ($1, $2, $3, $4)
    `;
    for (const adminId of adminIds) {
      await pool.query(insertAdminNoticeQuery, [adminId, noticeContent, category, userInfo.id]);
      console.log(`Admin notice inserted for admin ${adminId}`);
    }

    // Fetch student_ids for the specified category
    const studentsQuery = `
      SELECT student_id FROM student WHERE category = $1
    `;
    const studentResults = await pool.query(studentsQuery, [category]);
    const studentIds = studentResults.rows.map(row => row.student_id);
    console.log(`Fetched student IDs: ${studentIds}`);

    // Fetch teacher_ids for the specified category
    const supervisorsQuery = `
      SELECT teacher_id FROM supervisor WHERE category = $1
    `;
    const supervisorResults = await pool.query(supervisorsQuery, [category]);
    const supervisorIds = supervisorResults.rows.map(row => row.teacher_id);
    console.log(`Fetched supervisor IDs: ${supervisorIds}`);

    // Insert notices for students
    for (const studentId of studentIds) {
      await pool.query(insertAdminNoticeQuery, [studentId, noticeContent, category, userInfo.id]);
      console.log(`Student notice inserted for student ${studentId}`);
    }

    // Insert notices for supervisors
    for (const supervisorId of supervisorIds) {
      await pool.query(insertAdminNoticeQuery, [supervisorId, noticeContent, category, userInfo.id]);
      console.log(`Supervisor notice inserted for supervisor ${supervisorId}`);
    }

    // Commit the transaction
    await pool.query('COMMIT');
    console.log('Transaction committed successfully');
    req.flash("success", "Announcement Sent Successfully!");
    res.redirect("/send-notice");
  } catch (error) {
    // Rollback the transaction in case of an error
    await pool.query('ROLLBACK');
    console.error('Error sending notice:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/admin-notifications', authMiddleware, async (req, res) => {
  const { userInfo } = req;

  try {
    const notificationsQuery = `
      SELECT a.*, u.username AS sender_username
      FROM admin_notices a
      INNER JOIN users u ON a.sender_id = u.user_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `;
    const notificationsResult = await pool.query(notificationsQuery, [userInfo.id]);
    const notifications = notificationsResult.rows;

    // Mark all notifications as read
    const markAsReadQuery = `
      UPDATE admin_notices
      SET is_read = TRUE
      WHERE user_id = $1
    `;
    await pool.query(markAsReadQuery, [userInfo.id]);

    res.render('admin_notifications', {
      title: 'Notifications',
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Route to render the select category and year page
app.get('/admin/input-marks', authMiddleware, async (req, res) => {
  try {
    const categoriesQuery = 'SELECT DISTINCT category FROM team';
    const yearsQuery = 'SELECT DISTINCT academic_year FROM team';

    const categoriesResult = await pool.query(categoriesQuery);
    const yearsResult = await pool.query(yearsQuery);

    const categories = categoriesResult.rows.map(row => row.category);
    const years = yearsResult.rows.map(row => row.academic_year);

    res.render('select_category_year', {
      title: "Select Category and Year",
      categories,
      years
    });
  } catch (error) {
    console.error('Error fetching categories and years:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/select-category-year', authMiddleware, async (req, res) => {
  const { category, year } = req.body;

  try {
    const teamsQuery = `
      SELECT t.team_id, t.team_name, 
             s.student_id, s.first_name, s.last_name,
             am.proposal_mark, am.progress_mark, am.final_mark
      FROM team t
      JOIN student s ON t.team_leader_id = s.student_id OR t.student_2_id = s.student_id OR t.student_3_id = s.student_id
      LEFT JOIN admin_marks am ON am.team_id = t.team_id AND am.student_id = s.student_id
      WHERE t.category = $1 AND t.academic_year = $2
    `;
    const teamsResult = await pool.query(teamsQuery, [category, year]);
    const teams = [];

    teamsResult.rows.forEach(row => {
      let team = teams.find(t => t.team_id === row.team_id);
      if (!team) {
        team = {
          team_id: row.team_id,
          team_name: row.team_name,
          students: []
        };
        teams.push(team);
      }

      const student = {
        student_id: row.student_id,
        first_name: row.first_name,
        last_name: row.last_name,
        proposal_mark: row.proposal_mark,
        progress_mark: row.progress_mark,
        final_mark: row.final_mark
      };

      // Check if the student is already added to the team
      const existingStudentIndex = team.students.findIndex(s => s.student_id === student.student_id);
      if (existingStudentIndex === -1) {
        team.students.push(student);
      } else {
        // Update the marks if the student already exists in the team
        team.students[existingStudentIndex] = student;
      }
    });

    res.render('insert_marks', {
      title: "Input Marks",
      category,
      year,
      teams
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).send('Internal Server Error');
  }
});



/// Route to handle input marks submission
// Route to handle input marks submission
app.post('/insert-marks', authMiddleware, async (req, res) => {
  const { category, year, student_ids, proposal_marks, progress_marks, final_marks } = req.body;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Iterate over each student to find their team_id and insert/update marks
      for (let student_id of student_ids) {
        // Query to find the team_id for the student
        const teamQuery = `
          SELECT team_id FROM team
          WHERE team_leader_id = $1 OR student_2_id = $1 OR student_3_id = $1
          LIMIT 1;
        `;
        const teamResult = await client.query(teamQuery, [student_id]);
        const team_id = teamResult.rows[0]?.team_id;

        if (!team_id) {
          console.error('Team not found for student:', student_id);
          continue; // Skip this student if team_id is not found
        }

        // Extract marks for the student
        const proposal_mark = proposal_marks[student_id] === '' ? null : parseInt(proposal_marks[student_id]);
        const progress_mark = progress_marks[student_id] === '' ? null : parseInt(progress_marks[student_id]);
        const final_mark = final_marks[student_id] === '' ? null : parseInt(final_marks[student_id]);

        // Check if marks already exist for this student
        const existingMarksQuery = `
          SELECT * FROM admin_marks
          WHERE team_id = $1 AND student_id = $2;
        `;
        const existingMarksResult = await client.query(existingMarksQuery, [team_id, student_id]);

        if (existingMarksResult.rows.length > 0) {
          // Update existing marks
          const updateMarksQuery = `
            UPDATE admin_marks
            SET proposal_mark = $3, progress_mark = $4, final_mark = $5
            WHERE team_id = $1 AND student_id = $2;
          `;
          await client.query(updateMarksQuery, [team_id, student_id, proposal_mark, progress_mark, final_mark]);
        } else {
          // Insert new marks
          const insertMarksQuery = `
            INSERT INTO admin_marks (team_id, student_id, proposal_mark, progress_mark, final_mark)
            VALUES ($1, $2, $3, $4, $5);
          `;
          await client.query(insertMarksQuery, [team_id, student_id, proposal_mark, progress_mark, final_mark]);
        }
      }

      await client.query('COMMIT');
      res.status(200).redirect('/admin-dashboard');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error inserting/updating marks:', error);
      res.status(500).send('Internal Server Error');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Route to render the view marks page

app.get('/admin-view-marks', authMiddleware, async (req, res) => {
  try {
    const { category, year } = req.query;

    // Query to fetch marks data along with team name
    const marksQuery = `
      SELECT t.team_name, s.first_name, s.last_name, am.proposal_mark, am.progress_mark, am.final_mark
      FROM admin_marks am
      JOIN team t ON am.team_id = t.team_id
      JOIN student s ON am.student_id = s.student_id
      WHERE t.category = $1 AND t.academic_year = $2
    `;
    const marksResult = await pool.query(marksQuery, [category, year]);
    const marksData = marksResult.rows;

    // Fetch distinct categories and academic years from the database
    const [categories, years] = await Promise.all([
      pool.query('SELECT DISTINCT category FROM team'),
      pool.query('SELECT DISTINCT academic_year FROM team')
    ]);

    // Extract categories and years from the query results
    const categoryOptions = categories.rows.map(row => row.category);
    const yearOptions = years.rows.map(row => row.academic_year);

    // Render the view marks page and pass category and year options to the template
    res.render('admin_view_marks', {
      title: "View Marks",
      categories: categoryOptions,
      years: yearOptions,
      marksData: marksData
    });
  } catch (error) {
    console.error('Error fetching marks data:', error);
    res.status(500).send('Internal Server Error');
  }
});
