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
import TeacherViewNewsUpdates from './components/Teacher/ViewNewsUpdates';
import TeacherQuizAssignment from './components/Teacher/QuizAssignment';
import TeacherViewAnnouncements from './components/Teacher/ViewAnnouncements';

// Student Components
import StudentDashboard from './components/Student/StudentDashboard';
import StudentViewProfile from './components/Student/ViewProfile';
import StudentEditProfile from './components/Student/EditProfile';
import StudentUpdatePicture from './components/Student/UpdatePicture';
import ViewResults from './components/Student/ViewResults';
import TrackProgress from './components/Student/TrackProgress';
import ViewLeaderboard from './components/Student/ViewLeaderboard';
import DisplaySkillMatrix from './components/Student/DisplaySkillMatrix';
import AttemptQuiz from './components/Student/AttemptQuiz';
import PlacementQuiz from './components/Student/PlacementQuiz';
import AttemptAdaptiveQuiz from './components/Student/AttemptAdaptiveQuiz';
import ViewResultHistory from './components/Student/ViewResultHistory';
import StudentWriteTestimonial from './components/Student/WriteTestimonial';
import StudentCreateSupportTicket from './components/Student/CreateSupportTicket';
import StudentTrackSupportTicket from './components/Student/TrackSupportTicket';
import QuizJourney from './components/Student/QuizJourney';
import StudentViewAnnouncements from './components/Student/ViewAnnouncements';
import StudentViewNewsUpdates from './components/Student/ViewNewsUpdates';
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
import ParentViewChildSkillMatrix from './components/Parents/ViewChildSkillMatrix';
import ParentViewAnnouncements from './components/Parents/ViewAnnouncements';
import ParentViewNewsUpdates from './components/Parents/ViewNewsUpdates';

// SchoolAdmin Components
import SchoolAdminDashboard from './components/SchoolAdmin/SchoolAdminDashboard';
import ManualAddUser from './components/SchoolAdmin/ManualAddUser';
import SchoolLicenseView from './components/SchoolAdmin/SchoolLicenseView';
import BulkUploadCSV from './components/SchoolAdmin/BulkUploadCSV';
import ManageClasses from './components/SchoolAdmin/ManageClasses';
import BadgeManagement from './components/SchoolAdmin/BadgeManagement';
import PointsManagement from './components/SchoolAdmin/PointsManagement';
import TeacherManagement from './components/SchoolAdmin/TeacherManagement';
import StudentManagement from './components/SchoolAdmin/StudentManagement';
import ParentManagement from './components/SchoolAdmin/ParentManagement';
import PendingCredentials from './components/SchoolAdmin/PendingCredentials';
import TeacherAssignment from './components/SchoolAdmin/TeacherAssignment';
import ManageAnnouncements from './components/SchoolAdmin/ManageAnnouncements';
import SchoolAdminCreateSupportTicket from './components/SchoolAdmin/CreateSupportTicket';
import SchoolAdminTrackSupportTicket from './components/SchoolAdmin/TrackSupportTicket';
import SchoolAdminSupportTicketManagement from './components/SchoolAdmin/SupportTicketManagement';

// P2LAdmin Components
import P2LAdminDashboard from './components/P2LAdmin/P2LAdminDashboard';
import SchoolManagement from './components/P2LAdmin/SchoolManagement';
import SchoolAdminManagement from './components/P2LAdmin/SchoolAdminManagement';
import ManualAddSchoolAdmin from './components/P2LAdmin/ManualAddSchoolAdmin';
import QuestionBank from './components/P2LAdmin/QuestionBank';
import QuizManager from './components/P2LAdmin/QuizManager';
import AdaptiveQuizCreator from './components/P2LAdmin/AdaptiveQuizCreator';
import LandingPageManager from './components/P2LAdmin/LandingPageManager';
import HealthCheck from './components/P2LAdmin/HealthCheck';
import MaintenanceBroadcastManager from './components/P2LAdmin/MaintenanceBroadcastManager';
import UserManagement from './components/P2LAdmin/UserManagement';
import SupportTicketManagement from './components/P2LAdmin/SupportTicketManagement';
import SkillPointsConfig from './components/P2LAdmin/SkillPointsConfig';
import LicenseManagement from './components/P2LAdmin/LicenseManagement';
import MarketSurvey from './components/P2LAdmin/MarketSurvey';

// Maintenance Banner
import MaintenanceBanner from './components/MaintenanceBanner/MaintenanceBanner';

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
          <Route path="/" element={<DynamicLandingPage />} />

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
          <Route path="/teacher/news" element={<TeacherViewNewsUpdates />} />
          <Route path="/teacher/announcements" element={<TeacherViewAnnouncements />} />
          <Route path="/teacher/quiz-assignment" element={<TeacherQuizAssignment />} />

          {/* ========== STUDENT ROUTES ========== */}
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentViewProfile />} />
          <Route path="/student/profile/edit" element={<StudentEditProfile />} />
          <Route path="/student/profile/picture" element={<StudentUpdatePicture />} />
          <Route path="/student/results" element={<ViewResults />} />
          <Route path="/student/progress" element={<TrackProgress />} />
          <Route path="/student/leaderboard" element={<ViewLeaderboard />} />
          <Route path="/student/skills" element={<DisplaySkillMatrix />} />
          <Route path="/student/announcements" element={<StudentViewAnnouncements />} />
          <Route path="/student/news" element={<StudentViewNewsUpdates />} />
          <Route path="/student/shop" element={<StudentViewRewardShop />} />
          <Route path="/student/badges" element={<StudentViewBadges />} />

          {/* ========== QUIZ ROUTES ========== */}
          <Route path="/student/quiz/attempt" element={<AttemptQuiz />} />
          <Route path="/student/quiz/placement" element={<PlacementQuiz />} />
          <Route path="/student/adaptive-quiz/:quizId" element={<AttemptAdaptiveQuiz />} />
          <Route path="/student/quiz-journey" element={<QuizJourney />} />
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
          <Route path="/parent/children/skills" element={<ParentViewChildSkillMatrix />} />
          <Route path="/parent/announcements" element={<ParentViewAnnouncements />} />
          <Route path="/parent/news" element={<ParentViewNewsUpdates />} />
          <Route path="/parent/feedback" element={<ParentViewFeedback />} />
          <Route path="/parent/chat" element={<ParentChatWithTeacher />} />
          <Route path="/parent/testimonial" element={<ParentWriteTestimonial />} />
          <Route path="/parent/support/create" element={<ParentCreateSupportTicket />} />
          <Route path="/parent/support/track" element={<ParentTrackSupportTicket />} />

          {/* ========== SCHOOL ADMIN ROUTES ========== */}
          <Route path="/school-admin" element={<SchoolAdminDashboard />} />
          <Route path="/school-admin/license" element={<SchoolLicenseView />} />
          <Route path="/school-admin/users/manual-add" element={<ManualAddUser />} />
          <Route path="/school-admin/users/bulk-upload" element={<BulkUploadCSV />} />
          <Route path="/school-admin/users/pending-credentials" element={<PendingCredentials />} />
          <Route path="/school-admin/classes/manage" element={<ManageClasses />} />
          <Route path="/school-admin/badges" element={<BadgeManagement />} />
          <Route path="/school-admin/points" element={<PointsManagement />} />
          <Route path="/school-admin/teachers" element={<TeacherManagement />} />
          <Route path="/school-admin/students" element={<StudentManagement />} />
          <Route path="/school-admin/parents" element={<ParentManagement />} />
          <Route path="/school-admin/teachers/assignments" element={<TeacherAssignment />} />
          <Route path="/school-admin/announcements" element={<ManageAnnouncements />} />
          <Route path="/school-admin/support/create" element={<SchoolAdminCreateSupportTicket />} />
          <Route path="/school-admin/support/track" element={<SchoolAdminTrackSupportTicket />} />
          <Route path="/school-admin/support-tickets" element={<SchoolAdminSupportTicketManagement />} />

          {/* ========== P2LADMIN ROUTES ========== */}
          <Route path="/platform-admin" element={<Navigate to="/p2ladmin/dashboard" replace />} />
          <Route path="/p2ladmin/dashboard" element={<P2LAdminDashboard />} />
          <Route path="/p2ladmin/schools" element={<SchoolManagement />} />
          <Route path="/p2ladmin/school-admins" element={<SchoolAdminManagement />} />
          <Route path="/p2ladmin/school-admins/manual-add" element={<ManualAddSchoolAdmin />} />
          <Route path="/p2ladmin/licenses" element={<LicenseManagement />} />
          <Route path="/p2ladmin/questions" element={<QuestionBank />} />
          <Route path="/p2ladmin/quizzes" element={<QuizManager />} />
          <Route path="/p2ladmin/quizzes/create-adaptive" element={<AdaptiveQuizCreator />} />
          <Route path="/p2ladmin/landing-page" element={<LandingPageManager />} />
          <Route path="/p2ladmin/maintenance" element={<MaintenanceBroadcastManager />} />
          <Route path="/p2ladmin/health" element={<HealthCheck />} />
          <Route path="/p2ladmin/users" element={<UserManagement />} />
          <Route path="/p2ladmin/support-tickets" element={<SupportTicketManagement />} />
          <Route path="/p2ladmin/skill-points" element={<SkillPointsConfig />} />
          <Route path="/p2ladmin/market-survey" element={<MarketSurvey />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;