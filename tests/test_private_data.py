"""SQLite contract tests; no cloud account, private binding or real data."""
from pathlib import Path
import sqlite3
import unittest

ROOT=Path(__file__).resolve().parents[1]/"infra/private-data"
class Contract(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript((ROOT/"migrations/0001_core.sql").read_text())
        self.db.executescript("""
        INSERT INTO academic_years VALUES ('demo-year',2027),('demo-other-year',2028);
        INSERT INTO classes VALUES ('demo-class','demo-year','Demo A'),('demo-other-class','demo-other-year','Demo B');
        INSERT INTO staff VALUES ('demo-t','demo-issuer','teacher',1),('demo-v','demo-issuer','viewer',1),('demo-x','demo-issuer','disabled',0);
        INSERT INTO students VALUES ('demo-s1','Estudante fictício 1'),('demo-s2','Estudante fictício 2');
        INSERT INTO offers VALUES ('demo-o1','demo-year','hs-mathematics','Y11','Demo HS'),('demo-o2','demo-year','olympiads','N1','Demo Oly');
        INSERT INTO offer_classes VALUES ('demo-o1','demo-class','demo-year'),('demo-o2','demo-class','demo-year');
        INSERT INTO offer_staff VALUES ('demo-o1','demo-t','teacher'),('demo-o1','demo-v','viewer'),('demo-o1','demo-x','teacher'),('demo-o2','demo-v','viewer');
        INSERT INTO enrollments VALUES ('demo-o1','demo-s1','active'),('demo-o2','demo-s2','active');
        INSERT INTO lessons VALUES ('demo-l1','demo-o1','hs-matrices','Demo lesson','2027-01-01',480,50,'Demo goal','draft',1),('demo-l2','demo-o2','oly-parity','Demo lesson 2','2027-01-01',540,50,'Demo goal','draft',1);
        INSERT INTO assessments VALUES ('demo-a1','demo-o1','Demo assessment',1000,'open');
        INSERT INTO results VALUES ('demo-a1','demo-o1','demo-s1',1000,NULL,'pending');
        """)
        self.read,self.write=[s.strip() for s in (ROOT/"scoped-queries.sql").read_text().split(";") if s.strip() and not s.strip().startswith("-- END")]
    def tearDown(self):
        self.db.close()
    def reject(self,sql,params=()):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(sql,params)
    def test_integrity(self):
        self.reject("INSERT INTO offer_classes VALUES ('demo-o1','demo-other-class','demo-year')")
        self.reject("INSERT INTO attendance VALUES ('demo-l1','demo-o2','demo-s2','present')")
        self.reject("INSERT INTO attendance VALUES ('demo-l1','demo-o1','demo-s2','present')")
        self.reject("INSERT INTO attendance VALUES ('demo-l1','demo-o1','demo-s1','unknown')")
        self.reject("UPDATE results SET score=1001,status='graded'")
        self.reject("UPDATE results SET score=-1,status='graded'")
        self.reject("UPDATE results SET score=500,status='pending'")
        self.reject("UPDATE results SET score=NULL,status='graded'")
        self.reject("UPDATE results SET max_score=2000")
        self.reject("INSERT INTO evidence VALUES ('e','demo-l1','demo-o2','demo-s2','solution','demo',1)")
        self.reject("INSERT INTO document_refs VALUES ('d','demo-o1','demo-s2','demo-file','feedback')")
        self.reject("INSERT INTO document_refs VALUES ('d','demo-o1',NULL,'demo-file','feedback')")
        self.db.execute("INSERT INTO attendance VALUES ('demo-l1','demo-o1','demo-s1','present')")
        self.db.execute("INSERT INTO document_refs VALUES ('d','demo-o1','demo-s1','demo-file','feedback')")
        self.assertEqual(self.db.execute("PRAGMA foreign_key_check").fetchall(),[])
    def test_scoped_reads(self):
        def read(subject,offer):
            return self.db.execute(self.read,('demo-issuer',subject,offer,'2027-01-01','2027-01-07')).fetchall()
        self.assertEqual(len(read('teacher','demo-o1')),1)
        self.assertEqual(len(read('viewer','demo-o1')),1)
        self.assertEqual(len(read('teacher','demo-o2')),0)
        self.assertEqual(len(read('disabled','demo-o1')),0)
        self.assertEqual(len(read("' OR 1=1 --",'demo-o1')),0)
    def test_scoped_writes(self):
        def write(subject,offer='demo-o1'):
            return self.db.execute(self.write,(850,'demo-a1','demo-s1',offer,'demo-issuer',subject)).rowcount
        self.assertEqual(write('viewer'),0)
        self.assertEqual(write('disabled'),0)
        self.assertEqual(write('teacher','demo-o2'),0)
        self.assertEqual(write('teacher'),1)
        self.assertEqual(self.db.execute("SELECT score FROM results").fetchone()[0],850)
        self.db.execute("UPDATE assessments SET status='closed'")
        self.assertEqual(write('teacher'),0)
        self.db.execute("UPDATE assessments SET status='open'")
        self.db.execute("UPDATE enrollments SET status='withdrawn' WHERE offer_id='demo-o1'")
        self.assertEqual(write('teacher'),0)
if __name__=="__main__":unittest.main(verbosity=2)
