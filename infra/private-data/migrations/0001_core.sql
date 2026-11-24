-- Candidate private D1 schema; structure only. No production binding.
-- IDs are opaque application-generated strings. Dates: ISO calendar dates;
-- timestamps: UTC epoch seconds. Scores use integer hundredths of a point.
CREATE TABLE academic_years (
 id TEXT PRIMARY KEY NOT NULL,
 year INTEGER NOT NULL UNIQUE CHECK(year BETWEEN 2000 AND 2200)
);
CREATE TABLE classes (
 id TEXT PRIMARY KEY NOT NULL,
 academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
 label TEXT NOT NULL CHECK(length(trim(label))>0),
 UNIQUE(academic_year_id,label), UNIQUE(id,academic_year_id)
);
CREATE TABLE staff (
 id TEXT PRIMARY KEY NOT NULL,
 identity_issuer TEXT NOT NULL,
 identity_subject TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 UNIQUE(identity_issuer,identity_subject)
);
CREATE TABLE students (
 id TEXT PRIMARY KEY NOT NULL,
 display_name TEXT NOT NULL CHECK(length(trim(display_name))>0)
);
-- A class may have multiple offers; an offer may combine multiple classes.
CREATE TABLE offers (
 id TEXT PRIMARY KEY NOT NULL,
 academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
 subject_id TEXT NOT NULL CHECK(subject_id IN ('hs-mathematics','entrepreneurship','olympiads')),
 level_id TEXT,
 label TEXT NOT NULL,
 UNIQUE(id,academic_year_id)
);
CREATE TABLE offer_classes (
 offer_id TEXT NOT NULL,
 class_id TEXT NOT NULL,
 academic_year_id TEXT NOT NULL,
 PRIMARY KEY(offer_id,class_id),
 FOREIGN KEY(offer_id,academic_year_id) REFERENCES offers(id,academic_year_id),
 FOREIGN KEY(class_id,academic_year_id) REFERENCES classes(id,academic_year_id)
);
CREATE TABLE offer_staff (
 offer_id TEXT NOT NULL REFERENCES offers(id),
 staff_id TEXT NOT NULL REFERENCES staff(id),
 role TEXT NOT NULL CHECK(role IN ('teacher','viewer')),
 PRIMARY KEY(offer_id,staff_id)
);
CREATE TABLE enrollments (
 offer_id TEXT NOT NULL REFERENCES offers(id),
 student_id TEXT NOT NULL REFERENCES students(id),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','withdrawn')),
 PRIMARY KEY(offer_id,student_id)
);
CREATE TABLE lessons (
 id TEXT PRIMARY KEY NOT NULL,
 offer_id TEXT NOT NULL REFERENCES offers(id),
 unit_id TEXT NOT NULL,
 title TEXT NOT NULL,
 lesson_date TEXT NOT NULL CHECK(length(lesson_date)=10 AND lesson_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
 starts_at_minute INTEGER NOT NULL CHECK(starts_at_minute BETWEEN 0 AND 1439),
 duration_minutes INTEGER NOT NULL CHECK(duration_minutes BETWEEN 1 AND 1440),
 goal TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','ready','taught','cancelled')),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
 CHECK(starts_at_minute+duration_minutes<=1440),
 UNIQUE(id,offer_id), UNIQUE(offer_id,lesson_date,starts_at_minute)
);
CREATE TABLE lesson_steps (
 lesson_id TEXT NOT NULL REFERENCES lessons(id),
 position INTEGER NOT NULL CHECK(position>=1),
 minutes INTEGER NOT NULL CHECK(minutes>=1),
 action TEXT NOT NULL,
 PRIMARY KEY(lesson_id,position)
);
CREATE TABLE lesson_criteria (
 lesson_id TEXT NOT NULL REFERENCES lessons(id),
 position INTEGER NOT NULL CHECK(position>=1),
 criterion TEXT NOT NULL,
 PRIMARY KEY(lesson_id,position)
);
CREATE TABLE lesson_resources (
 lesson_id TEXT NOT NULL REFERENCES lessons(id),
 resource_id TEXT NOT NULL,
 PRIMARY KEY(lesson_id,resource_id)
);
CREATE TABLE attendance (
 lesson_id TEXT NOT NULL,
 offer_id TEXT NOT NULL,
 student_id TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('present','absent','late','excused')),
 PRIMARY KEY(lesson_id,student_id),
 FOREIGN KEY(lesson_id,offer_id) REFERENCES lessons(id,offer_id),
 FOREIGN KEY(offer_id,student_id) REFERENCES enrollments(offer_id,student_id)
);
CREATE TABLE assessments (
 id TEXT PRIMARY KEY NOT NULL,
 offer_id TEXT NOT NULL REFERENCES offers(id),
 title TEXT NOT NULL,
 max_score INTEGER NOT NULL CHECK(max_score>0),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','open','closed')),
 UNIQUE(id,offer_id,max_score)
);
CREATE TABLE results (
 assessment_id TEXT NOT NULL,
 offer_id TEXT NOT NULL,
 student_id TEXT NOT NULL,
 max_score INTEGER NOT NULL,
 score INTEGER,
 status TEXT NOT NULL CHECK(status IN ('pending','graded','absent','exempt')),
 CHECK((status='graded' AND score IS NOT NULL AND score>=0 AND score<=max_score)
    OR (status<>'graded' AND score IS NULL)),
 PRIMARY KEY(assessment_id,student_id),
 FOREIGN KEY(assessment_id,offer_id,max_score) REFERENCES assessments(id,offer_id,max_score),
 FOREIGN KEY(offer_id,student_id) REFERENCES enrollments(offer_id,student_id)
);
-- Individual evidence is distinct from grades. No diagnosis or free-form profiles.
CREATE TABLE evidence (
 id TEXT PRIMARY KEY NOT NULL,
 lesson_id TEXT NOT NULL,
 offer_id TEXT NOT NULL,
 student_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('solution','explanation','transfer','revision','artifact')),
 observation TEXT NOT NULL,
 recorded_at INTEGER NOT NULL CHECK(recorded_at>=0),
 FOREIGN KEY(lesson_id,offer_id) REFERENCES lessons(id,offer_id),
 FOREIGN KEY(offer_id,student_id) REFERENCES enrollments(offer_id,student_id)
);
-- Drive IDs are references, not public URLs, tokens or permissions.
CREATE TABLE document_refs (
 id TEXT PRIMARY KEY NOT NULL,
 offer_id TEXT NOT NULL REFERENCES offers(id),
 student_id TEXT,
 drive_file_id TEXT NOT NULL UNIQUE CHECK(length(trim(drive_file_id))>0),
 kind TEXT NOT NULL CHECK(kind IN ('plan','material','student_work','feedback')),
 CHECK((kind IN ('student_work','feedback') AND student_id IS NOT NULL)
    OR (kind IN ('plan','material') AND student_id IS NULL)),
 FOREIGN KEY(offer_id,student_id) REFERENCES enrollments(offer_id,student_id)
);
CREATE INDEX offer_staff_by_staff ON offer_staff(staff_id,offer_id);
CREATE INDEX enrollments_by_student ON enrollments(student_id,offer_id);
CREATE INDEX lessons_by_offer_date ON lessons(offer_id,lesson_date,starts_at_minute);
CREATE INDEX evidence_by_offer_student ON evidence(offer_id,student_id,recorded_at);
CREATE INDEX documents_by_offer_student ON document_refs(offer_id,student_id);
