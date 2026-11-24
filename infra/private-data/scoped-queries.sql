-- Reference read patterns, NOT an API. Bind identity from verified server auth.
-- Lesson list (issuer, subject, offer id, start date, end date).
SELECT l.id,l.unit_id,l.title,l.lesson_date,l.starts_at_minute,l.duration_minutes,l.goal,l.status,l.revision
FROM lessons l
JOIN offer_staff os ON os.offer_id=l.offer_id
JOIN staff s ON s.id=os.staff_id AND s.active=1
WHERE s.identity_issuer=? AND s.identity_subject=? AND l.offer_id=?
 AND l.lesson_date>=? AND l.lesson_date<=?
ORDER BY l.lesson_date,l.starts_at_minute;

-- Grade write (score, assessment id, student id, offer id, issuer, subject).
-- Server must check affected row count. Cannot create or modify grades without teacher scope.
UPDATE results SET score=?,status='graded'
WHERE assessment_id=? AND student_id=? AND offer_id=?
AND EXISTS (
 SELECT 1 FROM offer_staff os JOIN staff s ON s.id=os.staff_id
 WHERE os.offer_id=results.offer_id AND os.role='teacher' AND s.active=1
 AND s.identity_issuer=? AND s.identity_subject=?
)
AND EXISTS (
 SELECT 1 FROM enrollments e WHERE e.offer_id=results.offer_id
 AND e.student_id=results.student_id AND e.status='active'
)
AND EXISTS (
 SELECT 1 FROM assessments a WHERE a.id=results.assessment_id
 AND a.offer_id=results.offer_id AND a.status='open'
);
