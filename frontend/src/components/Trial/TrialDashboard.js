
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : `${window.location.origin}/api`);

export default function TrialDashboard() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('student'); // 'student' | 'teacher'
  const [error, setError] = useState('');

  // Student view
  const [playable, setPlayable] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);
  const [attemptId, setAttemptId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  // Teacher view
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [teacherOverview, setTeacherOverview] = useState({ students: [], leaderboard: [] });
  const [teacherSelectedStudent, setTeacherSelectedStudent] = useState(null);

  const token = useMemo(() => localStorage.getItem('token') || localStorage.getItem('authToken') || '', []);

  async function api(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}


  async function bootstrapIfNeeded() {
    // Always safe to call; backend will "ensure" seed exists
    await api('/trial/bootstrap', { method: 'POST' });
  }

  async function loadStudentData() {
    setError('');
    try {
      await bootstrapIfNeeded();
      const data = await api('/trial/students');
      const playableList = data.playable || [];
      setPlayable(playableList);

      if (playableList.length) {
        setSelectedStudentId(String(playableList[0]._id));
      } else {
        setSelectedStudentId('');
      }
    } catch (e) {
      setPlayable([]);
      setSelectedStudentId('');
      setError(`Failed to load playable students: ${e.message}`);
    }
  }

  async function loadTeacherData(classIdOverride) {
    setError('');
    try {
      await bootstrapIfNeeded();

      const cls = await api('/trial/classes');
      const classList = cls.classes || [];
      setClasses(classList);

      const classId = classIdOverride || classList?.[0]?._id || '';
      setSelectedClassId(String(classId));

      if (classId) {
        const ov = await api(`/trial/teacher/overview?classId=${classId}`);
        setTeacherOverview(ov || { students: [], leaderboard: [] });
      } else {
        setTeacherOverview({ students: [], leaderboard: [] });
      }

      setTeacherSelectedStudent(null);
    } catch (e) {
      setClasses([]);
      setSelectedClassId('');
      setTeacherOverview({ students: [], leaderboard: [] });
      setTeacherSelectedStudent(null);
      setError(`Failed to load teacher view: ${e.message}`);
    }
  }

  async function loadTeacherStudentDetails(studentId) {
    try {
      const d = await api(`/trial/teacher/student/${studentId}`);
      setTeacherSelectedStudent(d?.student || null);
    } catch (e) {
      setTeacherSelectedStudent(null);
      setError(`Failed to load student details: ${e.message}`);
    }
  }

  useEffect(() => {
    if (!token) {
      setError('No token found. Please login first.');
      return;
    }

    if (mode === 'student') {
      loadStudentData();
    } else {
      loadTeacherData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    navigate('/login');
  }

  async function startQuiz() {
    if (!selectedStudentId) return;
    setQuizLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await api('/trial/quiz/start', {
        method: 'POST',
        body: JSON.stringify({ studentId: selectedStudentId, count: 15 }),
      });

      setAttemptId(String(data.attemptId));
      setQuestions(data.questions || []);
      setAnswers({});
    } catch (e) {
      setError(e.message);
      setAttemptId('');
      setQuestions([]);
      setAnswers({});
    } finally {
      setQuizLoading(false);
    }
  }

  async function submitQuiz() {
    if (!attemptId || !selectedStudentId) return;

    setQuizLoading(true);
    setError('');

    try {
      const arr = questions.map((_, idx) => (answers[idx] === undefined ? null : Number(answers[idx])));
      const data = await api('/trial/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ attemptId, studentId: selectedStudentId, answers: arr }),
      });
      setResult(data);

      // refresh teacher stats too (so leaderboard updates after quiz)
      // refresh student playable to reflect new profile/score
      await loadStudentData();
    } catch (e) {
      setError(e.message);
    } finally {
      setQuizLoading(false);
    }
  }

  const styles = {
    page: { minHeight: '100vh', background: '#f3f4f6', paddingBottom: 40 },
    topbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '18px 26px',
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
    },
    brand: { display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, fontSize: 18 },
    brandDot: { width: 26, height: 26, borderRadius: 8, background: '#10b981' },
    logout: {
      background: '#ef4444',
      border: 'none',
      color: '#fff',
      padding: '9px 14px',
      borderRadius: 10,
      fontWeight: 900,
      cursor: 'pointer',
    },
    wrap: { maxWidth: 1120, margin: '0 auto', padding: '22px 18px' },
    hero: {
      background: '#10b981',
      borderRadius: 18,
      padding: 22,
      color: '#fff',
      boxShadow: '0 10px 26px rgba(0,0,0,0.08)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
    },
    heroTitle: { fontSize: 22, fontWeight: 900, marginBottom: 6 },
    heroSub: { fontSize: 13, opacity: 0.95 },
    pillRow: { display: 'flex', gap: 8, alignItems: 'center' },
    pill: (active) => ({
      padding: '8px 12px',
      borderRadius: 999,
      border: active ? '2px solid #fff' : '2px solid rgba(255,255,255,0.4)',
      background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
      fontWeight: 900,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    }),
    select: {
      marginTop: 10,
      width: 260,
      padding: '10px 12px',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.6)',
      background: 'rgba(255,255,255,0.95)',
    },
    error: { marginTop: 12, color: '#dc2626', fontWeight: 900 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 },
    card: {
      background: '#fff',
      borderRadius: 16,
      padding: 18,
      border: '1px solid #e5e7eb',
      boxShadow: '0 12px 28px rgba(0,0,0,0.06)',
    },
    cardTitle: { margin: 0, fontWeight: 900, color: '#111827' },
    small: { color: '#6b7280', fontSize: 13, marginTop: 6 },
    btn: (primary) => ({
      marginTop: 12,
      padding: '10px 12px',
      borderRadius: 12,
      border: primary ? 'none' : '1px solid #e5e7eb',
      background: primary ? '#10b981' : '#fff',
      color: primary ? '#fff' : '#111827',
      fontWeight: 900,
      cursor: 'pointer',
    }),
    qBox: { marginTop: 14, padding: 12, borderRadius: 14, border: '1px solid #e5e7eb' },
    label: { fontWeight: 900, marginBottom: 6 },
    podiumRow: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 18, padding: '18px 8px' },
    podiumBox: (h, bg) => ({
      width: 140,
      height: h,
      borderRadius: 12,
      background: bg,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#fff',
      fontWeight: 900,
    }),
    tableWrap: { overflowX: 'auto', marginTop: 6 },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' },
    th: { textAlign: 'left', fontSize: 12, color: '#6b7280', padding: '0 10px' },
    tr: (sel) => ({ cursor: 'pointer', background: sel ? '#ecfdf5' : '#fff' }),
    tdL: { padding: '14px 10px', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, fontWeight: 900 },
    td: { padding: '14px 10px' },
    tdR: { padding: '14px 10px', borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  };

  function Podium({ rows }) {
    const top = (rows || []).slice(0, 3);
    const second = top[1];
    const first = top[0];
    const third = top[2];

    const box = (emoji, row, height, bg) => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 18 }}>{emoji}</div>
        <div style={styles.podiumBox(height, bg)}>
          <div style={{ fontSize: 14, opacity: 0.95 }}>{row?.name || '-'}</div>
          <div style={{ fontSize: 18 }}>{row?.score ?? 0} pts</div>
        </div>
      </div>
    );

    return (
      <div style={styles.podiumRow}>
        {box('🥈', second, 120, '#9ca3af')}
        {box('🥇', first, 160, '#f59e0b')}
        {box('🥉', third, 110, '#f97316')}
      </div>
    );
  }

  function LeaderboardTable({ rows }) {
    return (
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>RANK</th>
              <th style={styles.th}>PLAYER</th>
              <th style={styles.th}>POINTS</th>
              <th style={styles.th}>LEVEL</th>
              <th style={styles.th}>ACHIEVEMENTS</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r, idx) => {
              const sid = String(r.student_id || r._id);
              const sel = String(teacherSelectedStudent?._id || '') === sid;
              return (
                <tr
                  key={sid}
                  style={styles.tr(sel)}
                  onClick={() => {
                    loadTeacherStudentDetails(sid);
                  }}
                >
                  <td style={styles.tdL}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</td>
                  <td style={{ ...styles.td, fontWeight: 900, color: '#111827' }}>{r.name}</td>
                  <td style={{ ...styles.td, fontWeight: 900, color: '#10b981' }}>{r.score ?? 0}</td>
                  <td style={styles.td}>Level {r.profile ?? 1}</td>
                  <td style={styles.tdR}>🏆 0</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={styles.brand}>
          <div style={styles.brandDot} />
          <div>Play2Learn</div>
        </div>
        <button style={styles.logout} onClick={logout}>
          Logout
        </button>
      </div>

      <div style={styles.wrap}>
        <div style={styles.hero}>
          <div>
            <div style={styles.heroTitle}>Welcome to Trial Mode 👋</div>
            <div style={styles.heroSub}>Toggle Student / Teacher to experience your platform flow.</div>
            {error ? <div style={styles.error}>{error}</div> : null}
          </div>

          <div>
            <div style={styles.pillRow}>
              <div style={styles.pill(mode === 'student')} onClick={() => setMode('student')}>
                Trial Student
              </div>
              <div style={styles.pill(mode === 'teacher')} onClick={() => setMode('teacher')}>
                Trial Teacher
              </div>
            </div>

            {mode === 'student' ? (
              <select
                style={styles.select}
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setResult(null);
                  setAttemptId('');
                  setQuestions([]);
                  setAnswers({});
                }}
              >
                <option value="">Select Student</option>
                {playable.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} (Profile {s.profile || 1})
                  </option>
                ))}
              </select>
            ) : (
              <select
                style={styles.select}
                value={selectedClassId}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedClassId(v);
                  loadTeacherData(v);
                }}
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.class_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {mode === 'student' ? (
          <div style={styles.grid2}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Placement Quiz</h3>
              <div style={styles.small}>15 questions • Score ≥ 70% to advance • &lt; 50% to demote</div>

              <button style={styles.btn(true)} onClick={startQuiz} disabled={!selectedStudentId || quizLoading}>
                {quizLoading ? 'Loading…' : 'Start Placement Quiz'}
              </button>

              {questions.length ? (
                <div style={{ marginTop: 12 }}>
                  {questions.map((q, idx) => (
                    <div key={idx} style={styles.qBox}>
                      <div style={styles.label}>
                        Q{idx + 1}: {q.prompt}
                      </div>
                      <select
                        style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}
                        value={answers[idx] ?? ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [idx]: Number(e.target.value) }))}
                      >
                        <option value="">Select answer</option>
                        {(q.choices || []).map((c, cIdx) => (
                          <option key={cIdx} value={cIdx}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <button style={styles.btn(true)} onClick={submitQuiz} disabled={quizLoading}>
                    Submit Quiz
                  </button>
                </div>
              ) : null}
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Results</h3>
              {!result ? (
                <div style={styles.small}>Complete the quiz to see score, placement, and breakdown.</div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 40, fontWeight: 900 }}>{result.score}%</div>
                  <div style={styles.small}>
                    Correct: {result.correct} / {result.total}
                  </div>
                  <div style={styles.small}>New Profile: {result.new_profile}</div>
                  <div style={{ marginTop: 14, fontWeight: 900 }}>Operation Breakdown</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 10 }}>
                    {['add', 'sub', 'mul', 'div'].map((k) => (
                      <div key={k} style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 12 }}>
                        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 900 }}>{k.toUpperCase()}</div>
                        <div style={{ fontSize: 18, fontWeight: 900 }}>{result.operation_breakdown?.[k] ?? 0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={styles.grid2}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Leaderboard</h3>
              <div style={styles.small}>Strongest students in this class (by last score).</div>

              {(teacherOverview.leaderboard || []).length ? (
                <>
                  <Podium rows={teacherOverview.leaderboard || []} />
                  <LeaderboardTable rows={teacherOverview.leaderboard || []} />
                </>
              ) : (
                <div style={{ color: '#6b7280', marginTop: 10 }}>
                  No leaderboard data yet. Let a trial student take a quiz first.
                </div>
              )}
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Selected Student</h3>
              {!teacherSelectedStudent ? (
                <div style={styles.small}>Click a student from the leaderboard to view details.</div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{teacherSelectedStudent.name}</div>
                  <div style={styles.small}>Profile: {teacherSelectedStudent.profile ?? 1}</div>
                  <div style={styles.small}>Last Score: {teacherSelectedStudent.last_score ?? 0}%</div>

                  <div style={{ marginTop: 14, fontWeight: 900 }}>Matrix (last breakdown)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 10 }}>
                    {['add', 'sub', 'mul', 'div'].map((k) => (
                      <div key={k} style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 12 }}>
                        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 900 }}>{k.toUpperCase()}</div>
                        <div style={{ fontSize: 18, fontWeight: 900 }}>
                          {teacherSelectedStudent.last_operation_breakdown?.[k] ?? 0}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 14, fontWeight: 900 }}>Assigned Adaptive Topics</div>
                  <div style={styles.small}>
                    {(teacherSelectedStudent.assigned_adaptive_topics || []).length
                      ? (teacherSelectedStudent.assigned_adaptive_topics || []).join(', ')
                      : 'None yet'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
