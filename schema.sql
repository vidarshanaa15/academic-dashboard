-- 1. Clean up existing tables
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS semesters;
DROP TABLE IF EXISTS goals;

-- 2. Create Semesters Table
CREATE TABLE semesters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  term TEXT CHECK (term IN ('Odd', 'Even')),
  gpa NUMERIC(4,2),
  cgpa NUMERIC(4,2)
);

-- 3. Create Subjects Table 
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  credits NUMERIC(3,1) NOT NULL,
  grade TEXT NOT NULL,
  grade_point INTEGER NOT NULL, 
  tag TEXT NOT NULL
);

-- 4. Create Goals Table
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  target_semester TEXT NOT NULL, 
  priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')),
  completed BOOLEAN DEFAULT FALSE
);

-- 1. Drop the old trigger so we can replace it
DROP TRIGGER IF EXISTS on_subject_change ON subjects;

-- 2. Create the "Spreadsheet-Perfect" Function
CREATE OR REPLACE FUNCTION update_semester_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- This single UPDATE statement recalculates the entire semesters table
    -- to ensure historical accuracy whenever any subject changes.
    UPDATE semesters target
    SET 
        gpa = (
            SELECT ROUND(CAST(SUM(s.credits * CASE 
                    WHEN s.grade = 'O' THEN 10
                    WHEN s.grade = 'A+' THEN 9
                    WHEN s.grade = 'A' THEN 8
                    WHEN s.grade = 'B+' THEN 7
                    WHEN s.grade = 'B' THEN 6
                    WHEN s.grade = 'C' THEN 5
                    ELSE 0 
                END) AS NUMERIC) / SUM(s.credits), 2)
            FROM subjects s
            WHERE s.semester_id = target.id
        ),
        cgpa = (
            -- We use the CTE logic here to calculate point-in-time CGPA
            WITH semester_blocks AS (
                SELECT 
                    sem.id AS sem_id,
                    sem.year,
                    sem.term,
                    SUM(sub.credits) as s_creds,
                    ROUND(CAST(SUM(sub.credits * CASE 
                        WHEN sub.grade = 'O' THEN 10
                        WHEN sub.grade = 'A+' THEN 9
                        WHEN sub.grade = 'A' THEN 8
                        WHEN sub.grade = 'B+' THEN 7
                        WHEN sub.grade = 'B' THEN 6
                        WHEN sub.grade = 'C' THEN 5
                        ELSE 0 
                    END) AS NUMERIC) / SUM(sub.credits), 2) as s_gpa
                FROM subjects sub
                JOIN semesters sem ON sub.semester_id = sem.id
                GROUP BY sem.id, sem.year, sem.term
            ),
            calculated_values AS (
                SELECT 
                    sem_id,
                    s_creds,
                    (s_gpa * s_creds) as s_mul,
                    (year + CASE WHEN term = 'Odd' THEN 0.1 ELSE 0.0 END) as sort_key
                FROM semester_blocks
            )
            SELECT 
                ROUND(CAST(SUM(prev.s_mul) AS NUMERIC) / SUM(prev.s_creds), 3)
            FROM calculated_values prev
            WHERE prev.sort_key <= (
                SELECT (year + CASE WHEN term = 'Odd' THEN 0.1 ELSE 0.0 END) 
                FROM semesters WHERE id = target.id
            )
        );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Re-create the Trigger
CREATE TRIGGER on_subject_change
AFTER INSERT OR UPDATE OR DELETE ON subjects
FOR EACH ROW EXECUTE FUNCTION update_semester_stats();