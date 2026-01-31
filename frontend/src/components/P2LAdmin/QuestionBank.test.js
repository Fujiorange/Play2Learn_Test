import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QuestionBank from './QuestionBank';

// Mock p2lAdminService
jest.mock('../../services/p2lAdminService', () => ({
  getQuestions: jest.fn(() => Promise.resolve({ data: [] })),
  createQuestion: jest.fn(),
  updateQuestion: jest.fn(),
  deleteQuestion: jest.fn()
}));

describe('QuestionBank', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
  });
});
