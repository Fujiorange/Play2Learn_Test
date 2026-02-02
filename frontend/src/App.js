// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Dynamic Landing Page Component
import DynamicLandingPage from './components/DynamicLandingPage/DynamicLandingPage';

// Auth Components
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import RegisterAdminPage from './components/RegisterAdminPage';

// Teacher Components
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import TeacherViewProfile from './components/Teacher/ViewProfile';
import TeacherEditProfile from './components/Teacher/EditProfile';
import TeacherUpdatePicture from './components/Teacher/UpdatePicture';
import StudentList from './components/Teacher/StudentList';
import StudentPerformance from './components/Teacher/StudentPerformance';
import StudentLeaderboard from './components/Teacher/StudentLeaderboard';
import StudentMatrix from './components/Teacher/StudentMatrix';
import CreateAssignment from './components/Teacher/CreateAssignment';
import ModifyAssignment from './components/Teacher/ModifyAssignment';
import ViewSubmissions from './components/Teacher/ViewSubmissions';
import TrackCompletion from './components/Teacher/TrackCompletion';
import CreateFeedback from './components/Teacher/CreateFeedback';
import ViewFeedback from './components/Teacher/ViewFeedback';
import Chat from './components/Teacher/Chat';
import WriteTestimonial from './components/Teacher/WriteTestimonial';
import TeacherCreateTicket from './components/Teacher/CreateTicket';
import TeacherTrackTicket from './components/Teacher/TrackTicket';

// ⭐ NEW IMPORT - Teacher News & Updates
import TeacherViewNewsUpdates from './components/Teacher/ViewNewsUpdates';

// Student Components
import StudentDashboard from './components/Student/StudentDashboard';
import StudentViewProfile from './components/Student/ViewProfile';
import StudentEditProfile from './components/Student/EditProfile';
import StudentUpdatePicture from './components/Student/UpdatePicture';
import ViewResults from './components/Student/ViewResults';
import TrackProgress from './components/Student/TrackProgress';
import ViewLeaderboard from './components/Student/ViewLeaderboard';
import DisplaySkillMatrix from './components/Student/DisplaySkillMatrix';
import ViewDetailedSubjectInfo from './components/Student/ViewDetailedSubjectInfo';
import AttemptQuiz from './components/Student/AttemptQuiz';
import PlacementQuiz from './components/Student/PlacementQuiz';
import TakeQuiz from './components/Student/TakeQuiz';
import QuizResult from './components/Student/QuizResult';
import AttemptAssignment from './components/Student/AttemptAssignment';
import ViewResultHistory from './components/Student/ViewResultHistory';
import StudentWriteTestimonial from './components/Student/WriteTestimonial';
import StudentCreateSupportTicket from './components/Student/CreateSupportTicket';
import StudentTrackSupportTicket from './components/Student/TrackSupportTicket';

// ⭐ NEW IMPORT - Student Announcements
import StudentViewAnnouncements from './components/Student/ViewAnnouncements';

// ⭐ NEW IMPORT - Student News & Updates
import StudentViewNewsUpdates from './components/Student/ViewNewsUpdates';

// ⭐ NEW IMPORTS - Student Rewards System
import StudentViewRewardShop from './components/Student/ViewRewardShop';
import StudentViewBadges from './components/Student/ViewBadges';

// Parent Components
import ParentDashboard from './components/Parents/ParentDashboard';
import ParentViewProfile from './components/Parents/ViewProfile';
import ParentEditProfile from './components/Parents/EditProfile';
import ParentUpdatePicture from './components/Parents/UpdatePicture';
import ParentViewChildren from './components/Parents/ViewChildren';
import ParentViewChildPerformance from './components/Parents/ViewChildPerformance';
import ParentViewChildProgress from './components/Parents/ViewChildProgress';
import ParentViewFeedback from './components/Parents/ViewFeedback';
import ParentChatWithTeacher from './components/Parents/ChatWithTeacher';
import ParentWriteTestimonial from './components/Parents/WriteTestimonial';
import ParentCreateSupportTicket from './components/Parents/CreateSupportTicket';
import ParentTrackSupportTicket from './components/Parents/TrackSupportTicket';

// ⭐ NEW IMPORTS - Parent Modules
import ParentViewChildSkillMatrix from './components/Parents/ViewChildSkillMatrix';
import ParentViewAnnouncements from './components/Parents/ViewAnnouncements';

// ⭐ NEW IMPORT - Parent News & Updates
import ParentViewNewsUpdates from './components/Parents/ViewNewsUpdates';

// SchoolAdmin Components
import SchoolAdminDashboard from './components/SchoolAdmin/SchoolAdminDashboard';
import ManualAddUser from './components/SchoolAdmin/ManualAddUser';
import RemoveUser from './components/SchoolAdmin/RemoveUser';
import BulkUploadCSV from './components/SchoolAdmin/BulkUploadCSV';
import ManageClasses from './components/SchoolAdmin/ManageClasses';
import ProvidePermission from './components/SchoolAdmin/ProvidePermission';
import ResetPassword from './components/SchoolAdmin/ResetPassword';
import DisableUser from './components/SchoolAdmin/DisableUser';
import BadgeManagement from './components/SchoolAdmin/BadgeManagement';
import PointsManagement from './components/SchoolAdmin/PointsManagement';

// P2LAdmin Components
import P2LAdminDashboard from './components/P2LAdmin/P2LAdminDashboard';
import SchoolManagement from './components/P2LAdmin/SchoolManagement';
import SchoolAdminManagement from './components/P2LAdmin/SchoolAdminManagement';
import QuestionBank from './components/P2LAdmin/QuestionBank';
import QuizManager from './components/P2LAdmin/QuizManager';
import AdaptiveQuizCreator from './components/P2LAdmin/AdaptiveQuizCreator';
import LandingPageManager from './components/P2LAdmin/LandingPageManager';
import HealthCheck from './components/P2LAdmin/HealthCheck';
import MaintenanceBroadcastManager from './components/P2LAdmin/MaintenanceBroadcastManager';

// Maintenance Banner
import MaintenanceBanner from './components/MaintenanceBanner/MaintenanceBanner';

// Student Adaptive Quiz Components
import AdaptiveQuizzes from './components/Student/AdaptiveQuizzes';
import AttemptAdaptiveQuiz from './components/Student/AttemptAdaptiveQuiz';

function App() {
  // Get user role from localStorage for maintenance banner
  const getUserRole = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.role || null;
    } catch {
      return null;
    }
  };

  return (
    <Router>
      <div className="App">
        {/* Show maintenance banner on all pages except landing */}
        <MaintenanceBanner userRole={getUserRole()} />
        
        <Routes>
          {/* ========== LANDING PAGE ========== */}
          <Route
            path="/"
            element={<DynamicLandingPage />}
          />

          {/* ========== AUTHENTICATION ========== */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register_admin" element={<RegisterAdminPage />} />

          {/* ========== TEACHER ROUTES ========== */}
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/profile" element={<TeacherViewProfile />} />
          <Route path="/teacher/profile/edit" element={<TeacherEditProfile />} />
          <Route path="/teacher/profile/picture" element={<TeacherUpdatePicture />} />
          <Route path="/teacher/students" element={<StudentList />} />
          <Route path="/teacher/students/performance" element={<StudentPerformance />} />
          <Route path="/teacher/students/leaderboard" element={<StudentLeaderboard />} />
          <Route path="/teacher/students/matrix" element={<StudentMatrix />} />
          <Route path="/teacher/assignment/create" element={<CreateAssignment />} />
          <Route path="/teacher/assignment/modify" element={<ModifyAssignment />} />
          <Route path="/teacher/submissions" element={<ViewSubmissions />} />
          <Route path="/teacher/completion" element={<TrackCompletion />} />
          <Route path="/teacher/feedback/create" element={<CreateFeedback />} />
          <Route path="/teacher/feedback/view" element={<ViewFeedback />} />
          <Route path="/teacher/chat" element={<Chat />} />
          <Route path="/teacher/testimonial" element={<WriteTestimonial />} />
          <Route path="/teacher/support/create" element={<TeacherCreateTicket />} />
          <Route path="/teacher/support/track" element={<TeacherTrackTicket />} />
          
          {/* ⭐ NEW ROUTE - Teacher News & Updates */}
          <Route path="/teacher/news" element={<TeacherViewNewsUpdates />} />

          {/* ========== STUDENT ROUTES ========== */}
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentViewProfile />} />
          <Route path="/student/profile/edit" element={<StudentEditProfile />} />
          <Route path="/student/profile/picture" element={<StudentUpdatePicture />} />
          <Route path="/student/results" element={<ViewResults />} />
          <Route path="/student/progress" element={<TrackProgress />} />
          <Route path="/student/leaderboard" element={<ViewLeaderboard />} />
          <Route path="/student/skills" element={<DisplaySkillMatrix />} />
          <Route path="/student/subjects" element={<ViewDetailedSubjectInfo />} />

          {/* ⭐ NEW ROUTE - Student Announcements */}
          <Route path="/student/announcements" element={<StudentViewAnnouncements />} />
          
          {/* ⭐ NEW ROUTE - Student News & Updates */}
          <Route path="/student/news" element={<StudentViewNewsUpdates />} />

          {/* â­ NEW ROUTES - Student Rewards System */}
          <Route path="/student/shop" element={<StudentViewRewardShop />} />
          <Route path="/student/badges" element={<StudentViewBadges />} />

          {/* ========== QUIZ ROUTES ========== */}
          <Route path="/student/quiz/attempt" element={<AttemptQuiz />} />
          <Route path="/student/quiz/placement" element={<PlacementQuiz />} />
          <Route path="/student/quiz/take" element={<TakeQuiz />} />
          <Route path="/student/quiz/result" element={<QuizResult />} />

          {/* ========== ADAPTIVE QUIZ ROUTES ========== */}
          <Route path="/student/adaptive-quizzes" element={<AdaptiveQuizzes />} />
          <Route path="/student/adaptive-quiz/:quizId" element={<AttemptAdaptiveQuiz />} />

          <Route path="/student/assignment/attempt" element={<AttemptAssignment />} />
          <Route path="/student/results/history" element={<ViewResultHistory />} />
          <Route path="/student/testimonial" element={<StudentWriteTestimonial />} />

          {/* Student Support */}
          <Route path="/student/support/create" element={<StudentCreateSupportTicket />} />
          <Route path="/student/support/track" element={<StudentTrackSupportTicket />} />
          <Route path="/student/support" element={<StudentCreateSupportTicket />} />
          <Route path="/student/support/tickets" element={<StudentTrackSupportTicket />} />

          {/* ========== PARENT ROUTES ========== */}
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/profile" element={<ParentViewProfile />} />
          <Route path="/parent/profile/edit" element={<ParentEditProfile />} />
          <Route path="/parent/profile/picture" element={<ParentUpdatePicture />} />
          <Route path="/parent/children" element={<ParentViewChildren />} />
          <Route path="/parent/children/performance" element={<ParentViewChildPerformance />} />
          <Route path="/parent/children/progress" element={<ParentViewChildProgress />} />
          
          {/* ⭐ Parent Module Routes */}
          <Route path="/parent/children/skills" element={<ParentViewChildSkillMatrix />} />
          <Route path="/parent/announcements" element={<ParentViewAnnouncements />} />
          
          {/* ⭐ NEW ROUTE - Parent News & Updates */}
          <Route path="/parent/news" element={<ParentViewNewsUpdates />} />
          
          <Route path="/parent/feedback" element={<ParentViewFeedback />} />
          <Route path="/parent/chat" element={<ParentChatWithTeacher />} />
          <Route path="/parent/testimonial" element={<ParentWriteTestimonial />} />
          <Route path="/parent/support/create" element={<ParentCreateSupportTicket />} />
          <Route path="/parent/support/track" element={<ParentTrackSupportTicket />} />

          {/* ========== SCHOOL ADMIN ROUTES ========== */}
          <Route path="/school-admin" element={<SchoolAdminDashboard />} />
          <Route path="/school-admin/users/manual-add" element={<ManualAddUser />} />
          <Route path="/school-admin/users/remove" element={<RemoveUser />} />
          <Route path="/school-admin/users/bulk-upload" element={<BulkUploadCSV />} />
          <Route path="/school-admin/classes/manage" element={<ManageClasses />} />
          <Route path="/school-admin/users/permissions" element={<ProvidePermission />} />
          <Route path="/school-admin/users/reset-password" element={<ResetPassword />} />
          <Route path="/school-admin/users/disable" element={<DisableUser />} />
          <Route path="/school-admin/badges" element={<BadgeManagement />} />
          <Route path="/school-admin/points" element={<PointsManagement />} />

          {/* ========== P2LADMIN ROUTES ========== */}
          {/* Redirect /platform-admin to /p2ladmin/dashboard */}
          <Route path="/platform-admin" element={<Navigate to="/p2ladmin/dashboard" replace />} />
          <Route path="/p2ladmin/dashboard" element={<P2LAdminDashboard />} />
          <Route path="/p2ladmin/schools" element={<SchoolManagement />} />
          <Route path="/p2ladmin/school-admins" element={<SchoolAdminManagement />} />
          <Route path="/p2ladmin/questions" element={<QuestionBank />} />
          <Route path="/p2ladmin/quizzes" element={<QuizManager />} />
          <Route path="/p2ladmin/quizzes/create-adaptive" element={<AdaptiveQuizCreator />} />
          <Route path="/p2ladmin/landing-page" element={<LandingPageManager />} />
          <Route path="/p2ladmin/maintenance" element={<MaintenanceBroadcastManager />} />
          <Route path="/p2ladmin/health" element={<HealthCheck />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;