create database spl;

CREATE TABLE
    student (
        student_id INT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone_number VARCHAR(20),
        semester INT,
        academic_year INT
    );

CREATE TABLE
    team (
        team_id VARCHAR(20) PRIMARY KEY,
        team_leader_id INT UNIQUE NOT NULL,
        student_2_id INT UNIQUE NOT NULL,
        student_3_id INT UNIQUE NOT NULL,
        supervisor_id INT NOT NULL,
        category VARCHAR(50) NOT NULL,
        academic_year INT NOT NULL,
        FOREIGN KEY (team_leader_id) REFERENCES Student (student_id),
        FOREIGN KEY (student_2_id) REFERENCES Student (student_id),
        FOREIGN KEY (student_3_id) REFERENCES Student (student_id),
        FOREIGN KEY (supervisor_id) REFERENCES Supervisor (teacher_id)
    );

CREATE TABLE
    admin (
        admin_id INT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL
    );

INSERT INTO
    admin (admin_id, username, password, email)
VALUES
    (
        1001,
        'foysal',
        'password1',
        'foysal@iut-dhaka.edu'
    ),
    (
        1002,
        'farzana',
        'password2',
        'farzana@iut-dhaka.edu'
    ),
    (
        1003,
        'zannatul',
        'password3',
        'zannatul@iut-dhaka.edu'
    );

INSERT INTO
    student (
        student_id,
        first_name,
        last_name,
        email,
        phone_number,
        semester,
        academic_year
    )
VALUES
    (
        210042101,
        'Khalid',
        'Hasan',
        'john.doe@example.com',
        '1234567890',
        3,
        2024
    ),
    (
        210042102,
        'Nahiyan',
        'Kabir',
        'jane.smith@example.com',
        '9876543210',
        3,
        2024
    ),
    (
        210042103,
        'Hasibul',
        'Islam',
        'alice.johnson@example.com',
        '5551112222',
        3,
        2024
    ),
    (
        210042104,
        'Mehedi',
        'Mahmud',
        'bob.williams@example.com',
        '9998887777',
        3,
        2024
    ),
    (
        210042105,
        'Faiyaz',
        'Awsaf',
        'michael.brown@example.com',
        '2223334444',
        3,
        2024
    ),
    (
        210042106,
        'Mashrur',
        'Faiyaz',
        'emily.jones@example.com',
        '7778889999',
        3,
        2024
    ),
    (
        210042107,
        'Tahir',
        'Zaman',
        'david.martinez@example.com',
        '4445556666',
        3,
        2024
    ),
    (
        210042108,
        'Hasin',
        'Mahtab',
        'sophia.garcia@example.com',
        '6667778888',
        3,
        2024
    ),
    (
        210042109,
        'Tauhid',
        'Taaha',
        'james.rodriguez@example.com',
        '3334445555',
        3,
        2024
    ),
    (
        200042101,
        'Mainul',
        'Hasan',
        'ajohn.doe@example.com',
        '1234567890',
        5,
        2024
    ),
    (
        200042102,
        'Dipto',
        'Kabir',
        'ajane.smith@example.com',
        '9876543210',
        5,
        2024
    ),
    (
        200042103,
        'Adid',
        'Islam',
        'aalice.johnson@example.com',
        '5551112222',
        5,
        2024
    ),
    (
        200042104,
        'Sadman',
        'Mahmud',
        'abob.williams@example.com',
        '9998887777',
        5,
        2024
    ),
    (
        200042105,
        'Jamil',
        'Awsaf',
        'amichael.brown@example.com',
        '2223334444',
        5,
        2024
    ),
    (
        200042106,
        'Nafiz',
        'Faiyaz',
        'aemily.jones@example.com',
        '7778889999',
        5,
        2024
    ),
    (
        200042107,
        'Tasin',
        'Zaman',
        'adavid.martinez@example.com',
        '4445556666',
        5,
        2024
    ),
    (
        200042108,
        'Sadik',
        'Mahtab',
        'asophia.garcia@example.com',
        '6667778888',
        5,
        2024
    ),
    (
        200042109,
        'Istiaq',
        'Taaha',
        'ajames.rodriguez@example.com',
        '3334445555',
        5,
        2024
    );

const c_academic_year = "SELECT academic_year FROM Student WHERE student_id = ID";

SELECT
    *
FROM
    Student
WHERE
    student_id NOT IN (
        SELECT
            team_leader_id
        FROM
            Team
        UNION
        SELECT
            student_2_id
        FROM
            Team
        UNION
        SELECT
            student_3_id
        FROM
            Team
    )
    AND category IN c_category;


SELECT first_name || ' ' || last_name FROM Teacher WHERE teacher_id= ?

SELECT first_name || ' ' || last_name as name, T.teacher_id, category, assigned_teams, selected_teams, academic year FROM Teacher T JOIN Supervisor S
ON T.teacher_id = S.teacher_id;

SELECT * FROM Requests where supervisor_id = {id};

DELETE FROM Requests where team_id = {team_id};