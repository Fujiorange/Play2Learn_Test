import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QuestionBank from './QuestionBank';

// Mock p2lAdminService
jest.mock('../../services/p2lAdminService', () => ({
  getQuestions: jest.fn(() => Promise.resolve({ 
    data: [
      { _id: '1', text: 'Question 1', answer: 'A', difficulty: 1, subject: 'Math', choices: [] },
      { _id: '2', text: 'Question 2', answer: 'B', difficulty: 2, subject: 'Science', choices: [] }
    ] 
  })),
  getQuestionSubjects: jest.fn(() => Promise.resolve({ 
    data: ['Math', 'Science', 'English'] 
  })),
  createQuestion: jest.fn(),
  updateQuestion: jest.fn(),
  deleteQuestion: jest.fn(),
  bulkDeleteQuestions: jest.fn()
}));

describe('QuestionBank', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
  });

  it('renders subject dropdown filter', async () => {
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const subjectLabel = screen.getByText('Subject:');
      expect(subjectLabel).toBeInTheDocument();
    });
  });

  it('renders select all button when questions are loaded', async () => {
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const selectAllButton = screen.getByText(/Select All/);
      expect(selectAllButton).toBeInTheDocument();
    });
  });
});
