-- Individual material requests. No document contents, Drive IDs or credentials in seed.
CREATE TABLE material_requests (
 id TEXT PRIMARY KEY NOT NULL,
 offer_id TEXT NOT NULL,
 student_id TEXT NOT NULL,
 evidence_id TEXT NOT NULL REFERENCES evidence(id),
 purpose TEXT NOT NULL CHECK(purpose IN ('recovery','extension','adaptation','feedback')),
 objective TEXT NOT NULL CHECK(length(trim(objective)) BETWEEN 1 AND 300),
 requested_by TEXT NOT NULL REFERENCES staff(id),
 created_at INTEGER NOT NULL DEFAULT (unixepoch()),
 status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','cancelled')),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(typeof(revision)='integer' AND revision>=1),
 cancelled_by TEXT REFERENCES staff(id),
 cancelled_at INTEGER,
 CHECK((status='requested' AND cancelled_by IS NULL AND cancelled_at IS NULL)
 OR (status='cancelled' AND cancelled_by IS NOT NULL AND cancelled_at IS NOT NULL)),
 FOREIGN KEY(offer_id,student_id) REFERENCES enrollments(offer_id,student_id)
);
CREATE TRIGGER material_request_scope_insert BEFORE INSERT ON material_requests
WHEN NOT EXISTS(SELECT 1 FROM evidence e WHERE e.id=NEW.evidence_id AND e.offer_id=NEW.offer_id AND e.student_id=NEW.student_id)
BEGIN
 SELECT RAISE(ABORT,'incompatible evidence scope');
END;
CREATE INDEX material_requests_scope ON material_requests(offer_id,student_id,created_at);
