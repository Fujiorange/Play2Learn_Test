import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SchoolManagement from './SchoolManagement';

// Mock p2lAdminService
jest.mock('../../services/p2lAdminService', () => ({
  getSchools: jest.fn(() => Promise.resolve({ data: [] })),
  createSchool: jest.fn(),
  updateSchool: jest.fn(),
  deleteSchool: jest.fn()
}));

describe('SchoolManagement', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <SchoolManagement />
      </BrowserRouter>
    );
  });
});
