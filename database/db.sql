-- Create Database
DROP DATABASE SPL;
CREATE DATABASE SPL;

-- Tables
CREATE TABLE USERS (
    USER_ID INT PRIMARY KEY,
    PASSWORD VARCHAR(50) NOT NULL,
    USERNAME VARCHAR(50) NOT NULL,
    ROLE VARCHAR(20) NOT NULL
);

CREATE TABLE STUDENT (
    STUDENT_ID INT,
    FIRST_NAME VARCHAR(50) NOT NULL,
    LAST_NAME VARCHAR(50) NOT NULL,
    EMAIL VARCHAR(100) UNIQUE,
    PHONE_NUMBER VARCHAR(20),
    CATEGORY VARCHAR(10),
    ACADEMIC_YEAR VARCHAR(10),
    PRIMARY KEY (STUDENT_ID, CATEGORY)
);

-- ALTER TABLE STUDENT
-- DROP COLUMN ACADEMIC_YEAR;
-- ADD COLUMN ACADEMIC_YEAR VARCHAR(10);

-- UPDATE STUDENT
-- SET ACADEMIC_YEAR = '2023-2024'

-- UPDATE STUDENT
-- SET category = 'SPL-I'
-- WHERE semester = 3;

-- UPDATE STUDENT
-- SET category = 'DP-I'
-- WHERE semester = 5;

-- ALTER TABLE STUDENT
-- DROP COLUMN semester;




CREATE TABLE TEACHER (
    TEACHER_ID INT PRIMARY KEY,
    FIRST_NAME VARCHAR(50),
    LAST_NAME VARCHAR(50),
    EMAIL VARCHAR(100),
    PHONE_NUMBER VARCHAR(20)
);

CREATE TABLE SUPERVISOR (
    TEACHER_ID INT,
    CATEGORY VARCHAR(50),
    ASSIGNED_TEAMS INT,
    SELECTED_TEAMS INT,
    ACADEMIC_YEAR INT,
    PRIMARY KEY (TEACHER_ID, CATEGORY),
    FOREIGN KEY (TEACHER_ID) REFERENCES TEACHER(TEACHER_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE TEAM (
    TEAM_ID SERIAL PRIMARY KEY,
    TEAM_NAME VARCHAR(50),
    TEAM_LEADER_ID INT UNIQUE,
    STUDENT_2_ID INT UNIQUE,
    STUDENT_3_ID INT UNIQUE,
    SUPERVISOR_ID INT,
    HAS_SUPERVISOR BOOLEAN DEFAULT FALSE,
    CATEGORY VARCHAR(50),
    ACADEMIC_YEAR INT,
    FOREIGN KEY (TEAM_LEADER_ID) REFERENCES STUDENT(STUDENT_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (STUDENT_2_ID) REFERENCES STUDENT(STUDENT_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (STUDENT_3_ID) REFERENCES STUDENT(STUDENT_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (SUPERVISOR_ID) REFERENCES TEACHER(TEACHER_ID)
);

CREATE TABLE REQUESTS (
    DATE TIMESTAMP,
    TEAM_ID SERIAL,
    TEAM_NAME VARCHAR(50),
    CATEGORY VARCHAR(50),
    IDEAS VARCHAR(1000),
    SUPERVISOR_ID INT,
    PRIMARY KEY (DATE, TEAM_ID, SUPERVISOR_ID),
    FOREIGN KEY (SUPERVISOR_ID) REFERENCES TEACHER(TEACHER_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (TEAM_ID) REFERENCES TEAM(TEAM_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO USERS (
    USER_ID,
    PASSWORD,
    USERNAME,
    ROLE
) VALUES (
    1001,
    '1001',
    'Faisal',
    'admin'
),
(
    1002,
    '1002',
    'Farzana',
    'admin'
),
(
    1003,
    '1003',
    'Zannatul',
    'admin'
),
(
    210042101,
    '210042101',
    'Khalid',
    'student'
),
(
    210042102,
    '210042102',
    'Nahiyan',
    'student'
),
(
    210042103,
    '210042103',
    'Hasibul',
    'student'
),
(
    210042104,
    '210042104',
    'Mehedi',
    'student'
),
(
    210042105,
    '210042105',
    'Faiyaz',
    'student'
),
(
    210042106,
    '210042106',
    'Mashrur',
    'student'
),
(
    210042107,
    '210042107',
    'Tahir',
    'student'
),
(
    210042108,
    '210042108',
    'Hasin',
    'student'
),
(
    210042109,
    '210042109',
    'Tauhid',
    'student'
),
(
    200042101,
    '200042101',
    'Mainul',
    'student'
),
(
    200042102,
    '200042102',
    'Dipto',
    'student'
),
(
    200042103,
    '200042103',
    'Adid',
    'student'
),
(
    200042104,
    '200042104',
    'Sadman',
    'student'
),
(
    200042105,
    '200042105',
    'Jamil',
    'student'
),
(
    200042106,
    '200042106',
    'Nafiz',
    'student'
),
(
    200042107,
    '200042107',
    'Tasin',
    'student'
),
(
    200042108,
    '200042108',
    'Sadik',
    'student'
),
(
    200042109,
    '200042109',
    'Istiaq',
    'student'
),
(
    2001,
    '2001',
    'Azam',
    'teacher'
),
(
    2003,
    '2003',
    'Raihan',
    'teacher'
),
(
    2006,
    '2006',
    'Hasan',
    'teacher'
),
(
    2017,
    '2017',
    'Rafid',
    'teacher'
),
(
    2016,
    '2016',
    'Srishty',
    'teacher'
),
(
    2021,
    '2021',
    'Herok',
    'teacher'
),
(
    2018,
    '2018',
    'Imtiaj',
    'teacher'
),
(
    2015,
    '2015',
    'Nazmuul',
    'teacher'
);

INSERT INTO STUDENT (
    STUDENT_ID,
    FIRST_NAME,
    LAST_NAME,
    EMAIL,
    PHONE_NUMBER,
    category,
    ACADEMIC_YEAR
) VALUES (
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

INSERT INTO TEACHER (
    TEACHER_ID,
    FIRST_NAME,
    LAST_NAME,
    EMAIL,
    PHONE_NUMBER
) VALUES (
    2001,
    'Azam',
    'Khan',
    'john@example.com',
    '1234567890'
),
(
    2003,
    'Raihan',
    'Chowdhury',
    'jane@example.com',
    '9876543210'
),
(
    2006,
    'Hasan',
    'Mahmud',
    'michael@example.com',
    '5555555555'
),
(
    2017,
    'Rafid',
    'Haque',
    'emily@example.com',
    '1112223333'
),
(
    2016,
    'Srishty',
    'Khan',
    'william@example.com',
    '9998887777'
),
(
    2021,
    'Herok',
    'Raja',
    'emma@example.com',
    '3333333333'
),
(
    2018,
    'Imtiaj',
    'Prodhan',
    'ethan@example.com',
    '4444444444'
),
(
    2015,
    'Nazmuul',
    'Mollick',
    'olivia@example.com',
    '6666666666'
);

-- Team ID generation

-- Create sequences for each category
CREATE SEQUENCE SPL_TEAM_ID_SEQ;

CREATE SEQUENCE DP_TEAM_ID_SEQ;

-- Create trigger function to set team IDs
CREATE OR REPLACE FUNCTION SET_TEAM_ID(
) RETURNS TRIGGER AS
    $$     BEGIN IF NEW.CATEGORY = 'SPL' THEN
        NEW.TEAM_ID := NEW.CATEGORY
                       || '-'
                       || NEXTVAL('SPL_TEAM_ID_SEQ');
    ELSIF NEW.CATEGORY = 'DP' THEN
        NEW.TEAM_ID := NEW.CATEGORY
                       || '-'
                       || NEXTVAL('DP_TEAM_ID_SEQ');
    END IF;

    RETURN NEW;
END;
$$     LANGUAGE PLPGSQL;
BEFORE INSERT ON TEAM FOR EACH ROW EXECUTE FUNCTION SET_TEAM_ID(
);
SELECT * FROM STUDENT WHERE STUDENT_ID NOT IN (
    SELECT
        TEAM_LEADER_ID
    FROM
        TEAM
    UNION
    SELECT
        STUDENT_2_ID
    FROM
        TEAM
    UNION
    SELECT
        STUDENT_3_ID
    FROM
        TEAM
);

<<<<<<< HEAD
=======
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
>>>>>>> f2a017ad2f563febaa3f01ff9e37379eef2ec831
