-- Collective diary and one homework check per encounter.
ALTER TABLE lessons ADD COLUMN collective_record TEXT NOT NULL DEFAULT '';
ALTER TABLE lessons ADD COLUMN material_feedback TEXT NOT NULL DEFAULT '';
ALTER TABLE lessons ADD COLUMN replanning TEXT NOT NULL DEFAULT '';
ALTER TABLE lessons ADD COLUMN homework_checked TEXT NOT NULL DEFAULT '';
ALTER TABLE lessons ADD COLUMN diary_updated_by TEXT REFERENCES staff(id);
CREATE TABLE lesson_diary_audit (
 id INTEGER PRIMARY KEY,
 lesson_id TEXT NOT NULL,
 offer_id TEXT NOT NULL,
 actor_id TEXT NOT NULL REFERENCES staff(id),
 revision INTEGER NOT NULL,
 occurred_at INTEGER NOT NULL DEFAULT (unixepoch()),
 UNIQUE(lesson_id,revision)
);
CREATE TRIGGER lesson_diary_update AFTER UPDATE OF status,collective_record,material_feedback,replanning,homework_checked ON lessons
WHEN NEW.diary_updated_by IS NOT NULL
BEGIN
 INSERT INTO lesson_diary_audit(lesson_id,offer_id,actor_id,revision)
 VALUES(NEW.id,NEW.offer_id,NEW.diary_updated_by,NEW.revision);
END;
CREATE TABLE homework_checks (
 lesson_id TEXT NOT NULL,
 offer_id TEXT NOT NULL,
 student_id TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('complete','half','not_done')),
 revision INTEGER NOT NULL CHECK(typeof(revision)='integer' AND revision>=1),
 updated_by TEXT NOT NULL REFERENCES staff(id),
 PRIMARY KEY(lesson_id,student_id),
 FOREIGN KEY(lesson_id,offer_id) REFERENCES lessons(id,offer_id),
 FOREIGN KEY(offer_id,student_id) REFERENCES enrollments(offer_id,student_id)
);
CREATE TABLE homework_audit (
 id INTEGER PRIMARY KEY,
 lesson_id TEXT NOT NULL,
 offer_id TEXT NOT NULL,
 student_id TEXT NOT NULL,
 actor_id TEXT NOT NULL REFERENCES staff(id),
 revision INTEGER NOT NULL,
 occurred_at INTEGER NOT NULL DEFAULT (unixepoch()),
 UNIQUE(lesson_id,student_id,revision)
);
CREATE TRIGGER homework_audit_insert AFTER INSERT ON homework_checks
BEGIN
 INSERT INTO homework_audit(lesson_id,offer_id,student_id,actor_id,revision)
 VALUES(NEW.lesson_id,NEW.offer_id,NEW.student_id,NEW.updated_by,NEW.revision);
END;
CREATE TRIGGER homework_audit_update AFTER UPDATE OF status ON homework_checks
BEGIN
 INSERT INTO homework_audit(lesson_id,offer_id,student_id,actor_id,revision)
 VALUES(NEW.lesson_id,NEW.offer_id,NEW.student_id,NEW.updated_by,NEW.revision);
END;
CREATE INDEX homework_student ON homework_checks(offer_id,student_id);
