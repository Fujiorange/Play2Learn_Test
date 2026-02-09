/**
 * RegisterAdminPage Component Tests
 * 
 * Tests for the admin registration page component including:
 * - Component rendering
 * - Form validation
 * - Form elements
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterAdminPage from './RegisterAdminPage';

// Mock the p2lAdminService
jest.mock('../services/p2lAdminService', () => ({
  registerP2LAdmin: jest.fn()
}));

describe('RegisterAdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form without crashing', () => {
    render(
      <BrowserRouter>
        <RegisterAdminPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Create Admin Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
  });

  it('displays all required form fields', () => {
    render(
      <BrowserRouter>
        <RegisterAdminPage />
      </BrowserRouter>
    );
    
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Password/i)).toHaveLength(2); // Password and Confirm Password
    expect(screen.getByText('Create Admin Account')).toBeInTheDocument();
  });

  it('validates email format on submit', async () => {
    render(
      <BrowserRouter>
        <RegisterAdminPage />
      </BrowserRouter>
    );
    
    const emailInput = screen.getByPlaceholderText('admin@example.com');
    const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];
    const confirmPasswordInput = screen.getAllByPlaceholderText('••••••••')[1];
    const submitButton = screen.getByText('Create Admin Account');
    
    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('validates password requirements on submit', async () => {
    render(
      <BrowserRouter>
        <RegisterAdminPage />
      </BrowserRouter>
    );
    
    const emailInput = screen.getByPlaceholderText('admin@example.com');
    const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];
    const confirmPasswordInput = screen.getAllByPlaceholderText('••••••••')[1];
    const submitButton = screen.getByText('Create Admin Account');
    
    // Enter weak password (no special character)
    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/at least one special character/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation on submit', async () => {
    render(
      <BrowserRouter>
        <RegisterAdminPage />
      </BrowserRouter>
    );
    
    const emailInput = screen.getByPlaceholderText('admin@example.com');
    const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];
    const confirmPasswordInput = screen.getAllByPlaceholderText('••••••••')[1];
    const submitButton = screen.getByText('Create Admin Account');
    
    // Enter mismatched passwords
    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(
      <BrowserRouter>
        <RegisterAdminPage />
      </BrowserRouter>
    );
    
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    const passwordInput = passwordInputs[0];
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button
    const toggleButtons = screen.getAllByRole('button', { name: '' });
    const passwordToggle = toggleButtons[0]; // First toggle is for password
    fireEvent.click(passwordToggle);
    
    // Password should now be visible
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('displays password requirements hint', () => {
    render(
      <BrowserRouter>
        <RegisterAdminPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Min 8 characters, 1 letter, 1 number, 1 special character/i)).toBeInTheDocument();
  });

  it('has link to login page', () => {
    render(
      <BrowserRouter>
        <RegisterAdminPage />
      </BrowserRouter>
    );
    
    const loginLink = screen.getByText('Sign in');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
