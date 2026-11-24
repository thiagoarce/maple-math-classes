-- Private diary: optimistic attendance updates and actor references.
ALTER TABLE attendance ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK(typeof(revision)='integer' AND revision>=1);
ALTER TABLE attendance ADD COLUMN updated_by TEXT REFERENCES staff(id);
ALTER TABLE evidence ADD COLUMN recorded_by TEXT REFERENCES staff(id);
CREATE TABLE attendance_audit (
 id INTEGER PRIMARY KEY,
 lesson_id TEXT NOT NULL,
 offer_id TEXT NOT NULL,
 student_id TEXT NOT NULL,
 actor_id TEXT NOT NULL REFERENCES staff(id),
 revision INTEGER NOT NULL,
 occurred_at INTEGER NOT NULL DEFAULT (unixepoch()),
 UNIQUE(lesson_id,student_id,revision)
);
CREATE TRIGGER attendance_audit_insert AFTER INSERT ON attendance
WHEN NEW.updated_by IS NOT NULL
BEGIN
 INSERT INTO attendance_audit(lesson_id,offer_id,student_id,actor_id,revision)
 VALUES(NEW.lesson_id,NEW.offer_id,NEW.student_id,NEW.updated_by,NEW.revision);
END;
CREATE TRIGGER attendance_audit_update AFTER UPDATE OF status ON attendance
WHEN NEW.updated_by IS NOT NULL
BEGIN
 INSERT INTO attendance_audit(lesson_id,offer_id,student_id,actor_id,revision)
 VALUES(NEW.lesson_id,NEW.offer_id,NEW.student_id,NEW.updated_by,NEW.revision);
END;
CREATE INDEX attendance_audit_offer ON attendance_audit(offer_id,occurred_at);
