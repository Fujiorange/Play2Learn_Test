import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QuestionBank from './QuestionBank';
import * as p2lAdminService from '../../services/p2lAdminService';

// Mock p2lAdminService
jest.mock('../../services/p2lAdminService', () => ({
  getQuestions: jest.fn(() => Promise.resolve({ 
    data: [
      { _id: '1', text: 'Question 1', answer: 'A', difficulty: 1, quiz_level: 1, subject: 'Math', topic: 'Addition', choices: [] },
      { _id: '2', text: 'Question 2', answer: 'B', difficulty: 2, quiz_level: 2, subject: 'Science', topic: 'Physics', choices: [] }
    ] 
  })),
  getQuestionSubjects: jest.fn(() => Promise.resolve({ 
    data: ['Math', 'Science', 'English'] 
  })),
  getQuestionTopics: jest.fn(() => Promise.resolve({ 
    data: ['Addition', 'Physics', 'Grammar'] 
  })),
  getQuestionGrades: jest.fn(() => Promise.resolve({ 
    data: ['Primary 1', 'Primary 2'] 
  })),
  createQuestion: jest.fn(),
  updateQuestion: jest.fn(),
  deleteQuestion: jest.fn(),
  bulkDeleteQuestions: jest.fn(() => Promise.resolve({ success: true })),
  uploadQuestionsCSV: jest.fn()
}));

describe('QuestionBank', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm to always return true
    global.confirm = jest.fn(() => true);
    global.alert = jest.fn();
  });

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

  it('fetches subjects only once on mount', async () => {
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(p2lAdminService.getQuestionSubjects).toHaveBeenCalledTimes(1);
    });
  });

  it('fetches topics only once on mount', async () => {
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(p2lAdminService.getQuestionTopics).toHaveBeenCalledTimes(1);
    });
  });

  it('renders topic dropdown filter', async () => {
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const topicLabel = screen.getByText('Topic:');
      expect(topicLabel).toBeInTheDocument();
    });
  });

  it('handles error when fetching subjects fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    p2lAdminService.getQuestionSubjects.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    consoleErrorSpy.mockRestore();
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

  it('selects all questions when select all is clicked', async () => {
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const selectAllButton = screen.getByText(/Select All/);
      fireEvent.click(selectAllButton);
    });
    
    await waitFor(() => {
      const deleteButton = screen.getByText(/Delete Selected \(2\)/);
      expect(deleteButton).toBeInTheDocument();
    });
  });

  it('calls bulkDeleteQuestions when delete selected is clicked', async () => {
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const selectAllButton = screen.getByText(/Select All/);
      fireEvent.click(selectAllButton);
    });
    
    await waitFor(() => {
      const deleteButton = screen.getByText(/Delete Selected \(2\)/);
      fireEvent.click(deleteButton);
    });
    
    await waitFor(() => {
      expect(p2lAdminService.bulkDeleteQuestions).toHaveBeenCalledWith(['1', '2']);
    });
  });

  it('toggles individual question selection', async () => {
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
      fireEvent.click(checkboxes[0]);
    });
    
    await waitFor(() => {
      const deleteButton = screen.getByText(/Delete Selected \(1\)/);
      expect(deleteButton).toBeInTheDocument();
    });
  });

  it('clears selections when filters change', async () => {
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
    
    // Select all questions
    await waitFor(() => {
      const selectAllButton = screen.getByText(/Select All/);
      fireEvent.click(selectAllButton);
    });
    
    // Change filter
    await waitFor(() => {
      const difficultySelect = screen.getByLabelText('Difficulty:');
      fireEvent.change(difficultySelect, { target: { value: '1' } });
    });
    
    // Verify getQuestions was called with new filter
    await waitFor(() => {
      expect(p2lAdminService.getQuestions).toHaveBeenCalledWith({ difficulty: '1', quiz_level: '', subject: '', topic: '', grade: '' });
    });
  });

  it('filters questions by topic', async () => {
    render(
      <BrowserRouter>
        <QuestionBank />
      </BrowserRouter>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Topic:')).toBeInTheDocument();
    });
    
    // Change topic filter
    const topicSelect = screen.getByLabelText('Topic:');
    fireEvent.change(topicSelect, { target: { value: 'Addition' } });
    
    // Verify getQuestions was called with topic filter
    await waitFor(() => {
      expect(p2lAdminService.getQuestions).toHaveBeenCalledWith({ difficulty: '', quiz_level: '', subject: '', topic: 'Addition', grade: '' });
    });
  });
});
