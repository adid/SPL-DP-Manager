const Pool = require("pg").Pool;

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "pgadmin",
  port: 5432,
  database: "spl",
});

if (pool) {
  console.log("Database connected successfully");
} else {
  console.log("Database connection failed");
}

module.exports = pool;