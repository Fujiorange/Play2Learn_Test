import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import P2LAdminDashboard from './P2LAdminDashboard';

// Mock p2lAdminService
jest.mock('../../services/p2lAdminService', () => ({
  getHealthStatus: jest.fn(() => Promise.resolve({
    success: true,
    database: { status: 'connected', connected: true },
    environment: 'test',
    uptime: 1000
  })),
  getDashboardStats: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      schools: 5,
      admins: 10,
      questions: 100,
      quizzes: 20
    }
  }))
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key) => {
    if (key === 'user') {
      return JSON.stringify({ name: 'Test Admin', role: 'p2ladmin' });
    }
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('P2LAdminDashboard', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <P2LAdminDashboard />
      </BrowserRouter>
    );
  });
});
