-- Candidate audit and optimistic concurrency. No seed.
ALTER TABLE results ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK(typeof(revision)='integer' AND revision>=1);
ALTER TABLE results ADD COLUMN updated_by TEXT REFERENCES staff(id);
CREATE TABLE result_audit (
 id INTEGER PRIMARY KEY,
 assessment_id TEXT NOT NULL,
 offer_id TEXT NOT NULL,
 student_id TEXT NOT NULL,
 actor_id TEXT NOT NULL REFERENCES staff(id),
 revision INTEGER NOT NULL,
 occurred_at INTEGER NOT NULL DEFAULT (unixepoch()),
 UNIQUE(assessment_id,student_id,revision)
);
CREATE TRIGGER results_audit_update AFTER UPDATE OF score,status ON results
WHEN NEW.score IS NOT OLD.score OR NEW.status IS NOT OLD.status OR NEW.revision IS NOT OLD.revision
BEGIN
 INSERT INTO result_audit(assessment_id,offer_id,student_id,actor_id,revision)
 VALUES(NEW.assessment_id,NEW.offer_id,NEW.student_id,NEW.updated_by,NEW.revision);
END;
CREATE INDEX result_audit_offer ON result_audit(offer_id,occurred_at);
