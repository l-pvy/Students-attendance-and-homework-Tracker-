import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BookOpen,
  Library,
  BarChart3,
  Settings,
  Plus,
  Search,
  Check,
  X,
  Clock,
  Save,
  Download,
  Pencil,
  Menu,
  ChevronDown
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

/*
=========================================================
MIKIDS ATTENDANCE & HOMEWORK TRACKER
=========================================================

IMPORTANT:
Create a .env file:

VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

Then:

npm install
npm run dev

The SQL database structure is provided below in:
supabase.sql
=========================================================
*/

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const DEFAULT_CLASSES = ["Level 1", "Level 2", "Level 3"];

const DEFAULT_SUBJECTS = [
  "English",
  "Mathematics",
  "Khmer",
  "Science",
  "Computer",
  "Moral Science"
];

const today = () => new Date().toISOString().slice(0, 10);

function App() {
  const [page, setPage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [homework, setHomework] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!supabase) {
      setError(
        "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        studentsRes,
        subjectsRes,
        classesRes,
        attendanceRes,
        homeworkRes,
        submissionsRes
      ] = await Promise.all([
        supabase.from("students").select("*").order("full_name"),
        supabase.from("subjects").select("*").order("name"),
        supabase.from("classes").select("*").order("name"),
        supabase
          .from("attendance")
          .select("*")
          .order("date", { ascending: false }),
        supabase
          .from("homework")
          .select("*")
          .order("due_date", { ascending: true }),
        supabase.from("homework_submissions").select("*")
      ]);

      const result = [
        studentsRes,
        subjectsRes,
        classesRes,
        attendanceRes,
        homeworkRes,
        submissionsRes
      ].find((x) => x.error);

      if (result?.error) throw result.error;

      setStudents(studentsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setClasses(classesRes.data || []);
      setAttendance(attendanceRes.data || []);
      setHomework(homeworkRes.data || []);
      setSubmissions(submissionsRes.data || []);
    } catch (err) {
      setError(err.message || "Unable to load database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const nav = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["students", "Students", Users],
    ["attendance", "Attendance", ClipboardCheck],
    ["homework", "Homework", BookOpen],
    ["subjects", "Subjects", Library],
    ["reports", "Reports", BarChart3],
    ["settings", "Settings", Settings]
  ];

  return (
    <div className="app">
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-logo">MK</div>
          <div>
            <strong>MIKIDS</strong>
            <small>School Tracker</small>
          </div>
        </div>

        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "nav-active" : ""}
              onClick={() => {
                setPage(id);
                setMobileMenu(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <Menu />
          </button>

          <div>
            <strong>MIKIDS International School</strong>
            <small>Academic Year 2026–2027</small>
          </div>
        </header>

        <section className="content">
          {error && <div className="error">{error}</div>}

          {loading ? (
            <div className="loading">Loading school data...</div>
          ) : (
            <>
              {page === "dashboard" && (
                <Dashboard
                  students={students}
                  attendance={attendance}
                  homework={homework}
                  submissions={submissions}
                  onNavigate={setPage}
                />
              )}

              {page === "students" && (
                <Students
                  students={students}
                  classes={classes}
                  reload={loadData}
                />
              )}

              {page === "attendance" && (
                <Attendance
                  students={students}
                  classes={classes}
                  attendance={attendance}
                  reload={loadData}
                />
              )}

              {page === "homework" && (
                <Homework
                  students={students}
                  classes={classes}
                  subjects={subjects}
                  homework={homework}
                  submissions={submissions}
                  reload={loadData}
                />
              )}

              {page === "subjects" && (
                <Subjects
                  subjects={subjects}
                  reload={loadData}
                />
              )}

              {page === "reports" && (
                <Reports
                  students={students}
                  attendance={attendance}
                  homework={homework}
                  submissions={submissions}
                />
              )}

              {page === "settings" && (
                <SettingsPage
                  classes={classes}
                  reload={loadData}
                />
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

/* ========================= DASHBOARD ========================= */

function Dashboard({
  students,
  attendance,
  homework,
  submissions,
  onNavigate
}) {
  const date = today();

  const presentToday = attendance.filter(
    (a) => a.date === date && a.status === "Present"
  ).length;

  const absentToday = attendance.filter(
    (a) => a.date === date && a.status === "Absent"
  ).length;

  const lateToday = attendance.filter(
    (a) => a.date === date && a.status === "Late"
  ).length;

  const dueToday = homework.filter((h) => h.due_date === date).length;

  const overdue = homework.filter(
    (h) => h.due_date < date
  ).length;

  const submitted = submissions.filter(
    (s) => s.status === "Submitted"
  ).length;

  const homeworkRate = submissions.length
    ? Math.round((submitted / submissions.length) * 100)
    : 0;

  return (
    <>
      <PageTitle
        title="School Management Dashboard"
        subtitle="Attendance and homework overview"
      />

      <div className="stats">
        <Stat title="Students" value={students.length} icon={<Users />} />
        <Stat
          title="Present Today"
          value={presentToday}
          icon={<Check />}
          good
        />
        <Stat
          title="Absent Today"
          value={absentToday}
          icon={<X />}
          danger
        />
        <Stat title="Late Today" value={lateToday} icon={<Clock />} />
        <Stat title="Homework Due Today" value={dueToday} icon={<BookOpen />} />
        <Stat title="Overdue" value={overdue} icon={<Clock />} danger />
        <Stat
          title="Homework Submission"
          value={`${homeworkRate}%`}
          icon={<ClipboardCheck />}
        />
      </div>

      <div className="quick-actions">
        <button onClick={() => onNavigate("attendance")}>
          <ClipboardCheck /> Take Attendance
        </button>

        <button onClick={() => onNavigate("homework")}>
          <BookOpen /> Track Homework
        </button>

        <button onClick={() => onNavigate("students")}>
          <Users /> Manage Students
        </button>
      </div>
    </>
  );
}

function Stat({ title, value, icon, danger, good }) {
  return (
    <div className="stat">
      <div className={`stat-icon ${danger ? "danger" : good ? "good" : ""}`}>
        {icon}
      </div>
      <div>
        <strong>{value}</strong>
        <span>{title}</span>
      </div>
    </div>
  );
}

/* ========================= STUDENTS ========================= */

function Students({ students, classes, reload }) {
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState("");
  const [editing, setEditing] = useState(null);

  const filtered = students.filter((s) => {
    const q = query.toLowerCase();

    return (
      (!classId || s.class_id === classId) &&
      (!q ||
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <PageTitle
        title="Students"
        subtitle="Manage students in Level 1, Level 2 and Level 3"
      />

      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            placeholder="Search student..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          className="primary"
          onClick={() => setEditing({})}
        >
          <Plus size={17} /> Add Student
        </button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Class</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>{s.student_id}</td>
                <td><strong>{s.full_name}</strong></td>
                <td>
                  {classes.find((c) => c.id === s.class_id)?.name || "-"}
                </td>
                <td>
                  <Badge type={s.active ? "good" : "danger"}>
                    {s.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td>
                  <button
                    className="icon-button"
                    onClick={() => setEditing(s)}
                  >
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filtered.length && (
          <Empty text="No students found." />
        )}
      </div>

      {editing && (
        <StudentModal
          student={editing}
          classes={classes}
          close={() => setEditing(null)}
          reload={reload}
        />
      )}
    </>
  );
}

function StudentModal({ student, classes, close, reload }) {
  const [studentId, setStudentId] = useState(student.student_id || "");
  const [name, setName] = useState(student.full_name || "");
  const [classId, setClassId] = useState(student.class_id || classes[0]?.id || "");
  const [active, setActive] = useState(student.active ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!studentId || !name || !classId) {
      alert("Please complete all fields.");
      return;
    }

    setSaving(true);

    const payload = {
      student_id: studentId,
      full_name: name,
      class_id: classId,
      active
    };

    const result = student.id
      ? await supabase.from("students").update(payload).eq("id", student.id)
      : await supabase.from("students").insert(payload);

    setSaving(false);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    close();
    reload();
  };

  return (
    <Modal title={student.id ? "Edit Student" : "Add Student"} close={close}>
      <label>
        Student ID
        <input value={studentId} onChange={(e) => setStudentId(e.target.value)} />
      </label>

      <label>
        Full Name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label>
        Class
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active student
      </label>

      <ModalButtons close={close} save={save} saving={saving} />
    </Modal>
  );
}

/* ========================= ATTENDANCE ========================= */

function Attendance({
  students,
  classes,
  attendance,
  reload
}) {
  const [date, setDate] = useState(today());
  const [session, setSession] = useState("Morning");
  const [classId, setClassId] = useState(classes[0]?.id || "");
  const [query, setQuery] = useState("");

  const filtered = students.filter((s) => {
    const q = query.toLowerCase();

    return (
      s.active &&
      (!classId || s.class_id === classId) &&
      (!q ||
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q))
    );
  });

  const getStatus = (studentId) =>
    attendance.find(
      (a) =>
        a.student_id === studentId &&
        a.date === date &&
        a.session === session
    )?.status || "Pending";

  const setStatus = async (studentId, status) => {
    const existing = attendance.find(
      (a) =>
        a.student_id === studentId &&
        a.date === date &&
        a.session === session
    );

    if (existing) {
      await supabase
        .from("attendance")
        .update({ status })
        .eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({
        student_id: studentId,
        date,
        session,
        status,
        academic_year: "2026–2027",
        semester: date < "2027-01-01" ? "Semester 1" : "Semester 2"
      });
    }

    reload();
  };

  const markAll = async (status) => {
    for (const student of filtered) {
      const existing = attendance.find(
        (a) =>
          a.student_id === student.id &&
          a.date === date &&
          a.session === session
      );

      if (existing) {
        await supabase
          .from("attendance")
          .update({ status })
          .eq("id", existing.id);
      } else {
        await supabase.from("attendance").insert({
          student_id: student.id,
          date,
          session,
          status,
          academic_year: "2026–2027",
          semester: date < "2027-01-01" ? "Semester 1" : "Semester 2"
        });
      }
    }

    reload();
  };

  return (
    <>
      <PageTitle
        title="Attendance"
        subtitle="Track Morning and Afternoon attendance for the whole year"
      />

      <div className="attendance-controls">
        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label>
          Session
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
          >
            <option>Morning</option>
            <option>Afternoon</option>
          </select>
        </label>

        <label>
          Class
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <button
          className="primary"
          onClick={() => markAll("Present")}
        >
          <Check size={17} /> Mark All Present
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            placeholder="Search student..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>ID</th>
              <th>Status</th>
              <th>Change</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((s, index) => {
              const status = getStatus(s.id);

              return (
                <tr key={s.id}>
                  <td>{index + 1}</td>
                  <td><strong>{s.full_name}</strong></td>
                  <td>{s.student_id}</td>
                  <td>
                    <Badge type={statusType(status)}>
                      {status}
                    </Badge>
                  </td>

                  <td className="button-row">
                    {["Present", "Absent", "Late"].map((x) => (
                      <button
                        key={x}
                        className={`small-button ${
                          status === x ? "selected" : ""
                        }`}
                        onClick={() => setStatus(s.id, x)}
                      >
                        {x}
                      </button>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ========================= HOMEWORK ========================= */

function Homework({
  students,
  classes,
  subjects,
  homework,
  submissions,
  reload
}) {
  const [showModal, setShowModal] = useState(false);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [query, setQuery] = useState("");

  const filteredHomework = homework.filter((h) => {
    return (
      (!classId || h.class_id === classId) &&
      (!subjectId || h.subject_id === subjectId) &&
      (!query ||
        h.title.toLowerCase().includes(query.toLowerCase()))
    );
  });

  const getSubmission = (homeworkId, studentId) =>
    submissions.find(
      (s) =>
        s.homework_id === homeworkId &&
        s.student_id === studentId
    );

  const updateStatus = async (homeworkId, studentId, status) => {
    const existing = getSubmission(homeworkId, studentId);

    if (existing) {
      await supabase
        .from("homework_submissions")
        .update({
          status,
          submitted_at: status === "Submitted" ? new Date().toISOString() : null
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("homework_submissions").insert({
        homework_id: homeworkId,
        student_id: studentId,
        status,
        submitted_at:
          status === "Submitted" ? new Date().toISOString() : null
      });
    }

    reload();
  };

  return (
    <>
      <PageTitle
        title="Homework Tracking"
        subtitle="Create multiple homework assignments and track every student"
      />

      <div className="toolbar">
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="search">
          <Search size={17} />
          <input
            placeholder="Search homework..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button
          className="primary"
          onClick={() => setShowModal(true)}
        >
          <Plus size={17} /> Add Homework
        </button>
      </div>

      {filteredHomework.map((h) => {
        const classStudents = students.filter(
          (s) => s.class_id === h.class_id && s.active
        );

        const due = deadlineStatus(h.due_date);

        return (
          <div className="homework-card" key={h.id}>
            <div className="homework-header">
              <div>
                <h3>{h.title}</h3>
                <p>
                  {subjects.find((s) => s.id === h.subject_id)?.name}
                  {" · "}
                  {classes.find((c) => c.id === h.class_id)?.name}
                  {" · "}
                  Teacher: {h.teacher_name}
                </p>
              </div>

              <div className="deadline">
                <strong>Due {formatDate(h.due_date)}</strong>
                <Badge type={due.type}>{due.label}</Badge>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>

              <tbody>
                {classStudents.map((s) => {
                  const current =
                    getSubmission(h.id, s.id)?.status || "Pending";

                  return (
                    <tr key={s.id}>
                      <td>{s.full_name}</td>
                      <td>
                        <Badge type={statusType(current)}>
                          {current}
                        </Badge>
                      </td>
                      <td className="button-row">
                        {[
                          "Submitted",
                          "Missing",
                          "Pending",
                          "Partial"
                        ].map((status) => (
                          <button
                            className={`small-button ${
                              current === status ? "selected" : ""
                            }`}
                            key={status}
                            onClick={() =>
                              updateStatus(h.id, s.id, status)
                            }
                          >
                            {status}
                          </button>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {!filteredHomework.length && (
        <Empty text="No homework assignments found." />
      )}

      {showModal && (
        <HomeworkModal
          classes={classes}
          subjects={subjects}
          close={() => setShowModal(false)}
          reload={reload}
        />
      )}
    </>
  );
}

function HomeworkModal({ classes, subjects, close, reload }) {
  const [title, setTitle] = useState("");
  const [teacher, setTeacher] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id || "");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [assigned, setAssigned] = useState(today());
  const [due, setDue] = useState(today());

  const save = async () => {
    if (!title || !classId || !subjectId || !due) {
      alert("Please complete the homework information.");
      return;
    }

    const { data, error } = await supabase
      .from("homework")
      .insert({
        title,
        teacher_name: teacher,
        class_id: classId,
        subject_id: subjectId,
        assigned_date: assigned,
        due_date: due,
        academic_year: "2026–2027",
        semester: assigned < "2027-01-01" ? "Semester 1" : "Semester 2"
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    /*
      Create Pending records for every student
      in this class.
    */

    const { data: students } = await supabase
      .from("students")
      .select("id")
      .eq("class_id", classId)
      .eq("active", true);

    if (students?.length) {
      await supabase.from("homework_submissions").insert(
        students.map((s) => ({
          homework_id: data.id,
          student_id: s.id,
          status: "Pending"
        }))
      );
    }

    close();
    reload();
  };

  return (
    <Modal title="Add Homework" close={close}>
      <label>
        Homework Title
        <input
          placeholder="Homework 1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label>
        Subject
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          {subjects.map((s) => (
            <option value={s.id} key={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Teacher
        <input
          value={teacher}
          onChange={(e) => setTeacher(e.target.value)}
        />
      </label>

      <label>
        Class
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          {classes.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Assigned Date
        <input
          type="date"
          value={assigned}
          onChange={(e) => setAssigned(e.target.value)}
        />
      </label>

      <label>
        Due Date
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      </label>

      <ModalButtons close={close} save={save} />
    </Modal>
  );
}

/* ========================= SUBJECTS ========================= */

function Subjects({ subjects, reload }) {
  const [editing, setEditing] = useState(null);

  return (
    <>
      <PageTitle
        title="Subjects"
        subtitle="Add and edit subjects whenever you need"
      />

      <div className="toolbar">
        <button
          className="primary"
          onClick={() => setEditing({})}
        >
          <Plus size={17} /> Add Subject
        </button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Teacher</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {subjects.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.teacher_name || "-"}</td>
                <td>
                  <Badge type={s.active ? "good" : "danger"}>
                    {s.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td>
                  <button
                    className="icon-button"
                    onClick={() => setEditing(s)}
                  >
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <SubjectModal
          subject={editing}
          close={() => setEditing(null)}
          reload={reload}
        />
      )}
    </>
  );
}

function SubjectModal({ subject, close, reload }) {
  const [name, setName] = useState(subject.name || "");
  const [teacher, setTeacher] = useState(subject.teacher_name || "");
  const [active, setActive] = useState(subject.active ?? true);

  const save = async () => {
    if (!name) {
      alert("Enter a subject name.");
      return;
    }

    const payload = {
      name,
      teacher_name: teacher,
      active
    };

    const result = subject.id
      ? await supabase.from("subjects").update(payload).eq("id", subject.id)
      : await supabase.from("subjects").insert(payload);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    close();
    reload();
  };

  return (
    <Modal title={subject.id ? "Edit Subject" : "Add Subject"} close={close}>
      <label>
        Subject Name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label>
        Teacher
        <input value={teacher} onChange={(e) => setTeacher(e.target.value)} />
      </label>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active
      </label>

      <ModalButtons close={close} save={save} />
    </Modal>
  );
}

/* ========================= SETTINGS ========================= */

function SettingsPage({ classes, reload }) {
  const [newClass, setNewClass] = useState("");

  const addClass = async () => {
    if (!newClass.trim()) return;

    const { error } = await supabase
      .from("classes")
      .insert({ name: newClass.trim() });

    if (error) {
      alert(error.message);
      return;
    }

    setNewClass("");
    reload();
  };

  return (
    <>
      <PageTitle
        title="Settings"
        subtitle="Manage school classes"
      />

      <div className="panel settings-panel">
        <h3>Classes</h3>

        {classes.map((c) => (
          <div className="setting-row" key={c.id}>
            <span>{c.name}</span>
          </div>
        ))}

        <div className="add-setting">
          <input
            placeholder="New class name"
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
          />
          <button className="primary" onClick={addClass}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
    </>
  );
}

/* ========================= REPORTS ========================= */

function Reports({
  students,
  attendance,
  homework,
  submissions
}) {
  const exportCSV = () => {
    const rows = [
      [
        "Student ID",
        "Student",
        "Attendance Present",
        "Attendance Absent",
        "Attendance Late",
        "Homework Submitted",
        "Homework Missing",
        "Homework Pending",
        "Homework Partial"
      ]
    ];

    students.forEach((s) => {
      const records = attendance.filter(
        (a) => a.student_id === s.id
      );

      const hs = submissions.filter(
        (x) => x.student_id === s.id
      );

      rows.push([
        s.student_id,
        s.full_name,
        records.filter((x) => x.status === "Present").length,
        records.filter((x) => x.status === "Absent").length,
        records.filter((x) => x.status === "Late").length,
        hs.filter((x) => x.status === "Submitted").length,
        hs.filter((x) => x.status === "Missing").length,
        hs.filter((x) => x.status === "Pending").length,
        hs.filter((x) => x.status === "Partial").length
      ]);
    });

    const csv = rows
      .map((row) =>
        row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "MIKIDS_School_Report.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageTitle
        title="Reports"
        subtitle="Whole-year attendance and homework records"
      />

      <div className="toolbar">
        <button className="primary" onClick={exportCSV}>
          <Download size={17} /> Export CSV
        </button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Submitted</th>
              <th>Missing</th>
              <th>Pending</th>
              <th>Partial</th>
            </tr>
          </thead>

          <tbody>
            {students.map((s) => {
              const a = attendance.filter(
                (x) => x.student_id === s.id
              );

              const h = submissions.filter(
                (x) => x.student_id === s.id
              );

              return (
                <tr key={s.id}>
                  <td><strong>{s.full_name}</strong></td>
                  <td>{a.filter((x) => x.status === "Present").length}</td>
                  <td>{a.filter((x) => x.status === "Absent").length}</td>
                  <td>{a.filter((x) => x.status === "Late").length}</td>
                  <td>{h.filter((x) => x.status === "Submitted").length}</td>
                  <td>{h.filter((x) => x.status === "Missing").length}</td>
                  <td>{h.filter((x) => x.status === "Pending").length}</td>
                  <td>{h.filter((x) => x.status === "Partial").length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ========================= UI HELPERS ========================= */

function PageTitle({ title, subtitle }) {
  return (
    <div className="page-title">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

function Badge({ children, type }) {
  return <span className={`badge ${type}`}>{children}</span>;
}

function statusType(status) {
  if (status === "Present" || status === "Submitted") return "good";
  if (status === "Absent" || status === "Missing") return "danger";
  if (status === "Late" || status === "Partial") return "warning";
  return "pending";
}

function deadlineStatus(date) {
  const now = today();

  if (date < now)
    return { label: "Overdue", type: "danger" };

  if (date === now)
    return { label: "Due Today", type: "warning" };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date === tomorrow.toISOString().slice(0, 10))
    return { label: "Due Tomorrow", type: "pending" };

  return { label: "Upcoming", type: "good" };
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );
}

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}

function Modal({ title, close, children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h2>{title}</h2>
          <button onClick={close}>×</button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function ModalButtons({ close, save, saving }) {
  return (
    <div className="modal-actions">
      <button className="secondary" onClick={close}>
        Cancel
      </button>

      <button className="primary" onClick={save} disabled={saving}>
        <Save size={16} />
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
