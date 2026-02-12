/**
 * RegisterPage Component Tests
 * 
 * Tests for the institute registration page component including:
 * - Component rendering
 * - Form validation
 * - Form elements
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';

// Mock the authService
jest.mock('../services/authService', () => ({
  registerSchoolAdmin: jest.fn()
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form without crashing', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Start Your Journey!')).toBeInTheDocument();
    expect(screen.getByText(/Register your institute/i)).toBeInTheDocument();
  });

  it('displays all required form fields for institute registration', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    // Should have institution name field
    expect(screen.getByLabelText(/Institution\/Organization Name/i)).toBeInTheDocument();
    
    // Should have email field
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    
    // Should have password fields
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    
    // Should have referral source (optional)
    expect(screen.getByLabelText(/How did you hear about us/i)).toBeInTheDocument();
  });

  it('does NOT display removed fields (name, gender, DOB, contact)', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    // Should NOT have name field
    expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
    
    // Should NOT have gender field
    expect(screen.queryByLabelText(/Gender/i)).not.toBeInTheDocument();
    
    // Should NOT have date of birth field
    expect(screen.queryByLabelText(/Date of Birth/i)).not.toBeInTheDocument();
    
    // Should NOT have contact number field
    expect(screen.queryByLabelText(/Contact Number/i)).not.toBeInTheDocument();
  });

  it('does NOT display trial student registration tab', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    // Should NOT have trial student tab
    expect(screen.queryByText(/Trial Student/i)).not.toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    const submitButton = screen.getByText('Start Free Trial');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please fill in all required fields/i)).toBeInTheDocument();
    });
  });

  it('validates institution name is required', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
    const confirmPasswordInput = screen.getByPlaceholderText('Re-enter password');
    const submitButton = screen.getByText('Start Free Trial');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Institution\/Organization name is required/i)).toBeInTheDocument();
    });
  });

  it('validates password match', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    const institutionInput = screen.getByPlaceholderText(/school or organization name/i);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
    const confirmPasswordInput = screen.getByPlaceholderText('Re-enter password');
    const submitButton = screen.getByText('Start Free Trial');
    
    fireEvent.change(institutionInput, { target: { value: 'Test School' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    const institutionInput = screen.getByPlaceholderText(/school or organization name/i);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
    const confirmPasswordInput = screen.getByPlaceholderText('Re-enter password');
    const submitButton = screen.getByText('Start Free Trial');
    
    fireEvent.change(institutionInput, { target: { value: 'Test School' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });
  });

  it('has correct button text for institute registration', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
  });

  it('has link to login page', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    const loginLink = screen.getByText('Log in');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('displays free trial badge', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('✨ FREE TRIAL')).toBeInTheDocument();
  });

  // Email validation tests
  it('validates email format - rejects email without @', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    const institutionInput = screen.getByPlaceholderText(/school or organization name/i);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
    const confirmPasswordInput = screen.getByPlaceholderText('Re-enter password');
    const submitButton = screen.getByText('Start Free Trial');
    
    fireEvent.change(institutionInput, { target: { value: 'Test School' } });
    fireEvent.change(emailInput, { target: { value: 'invalidemail.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates email format - rejects email without domain', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    const institutionInput = screen.getByPlaceholderText(/school or organization name/i);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
    const confirmPasswordInput = screen.getByPlaceholderText('Re-enter password');
    const submitButton = screen.getByText('Start Free Trial');
    
    fireEvent.change(institutionInput, { target: { value: 'Test School' } });
    fireEvent.change(emailInput, { target: { value: 'test@' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates email format - rejects email without TLD', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    const institutionInput = screen.getByPlaceholderText(/school or organization name/i);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
    const confirmPasswordInput = screen.getByPlaceholderText('Re-enter password');
    const submitButton = screen.getByText('Start Free Trial');
    
    fireEvent.change(institutionInput, { target: { value: 'Test School' } });
    fireEvent.change(emailInput, { target: { value: 'test@example' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates email format - rejects email with spaces', async () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    const institutionInput = screen.getByPlaceholderText(/school or organization name/i);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
    const confirmPasswordInput = screen.getByPlaceholderText('Re-enter password');
    const submitButton = screen.getByText('Start Free Trial');
    
    fireEvent.change(institutionInput, { target: { value: 'Test School' } });
    fireEvent.change(emailInput, { target: { value: 'test user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('accepts valid email format', async () => {
    const authService = require('../services/authService');
    authService.registerSchoolAdmin.mockResolvedValue({ success: true });
    
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    
    const institutionInput = screen.getByPlaceholderText(/school or organization name/i);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
    const confirmPasswordInput = screen.getByPlaceholderText('Re-enter password');
    const submitButton = screen.getByText('Start Free Trial');
    
    fireEvent.change(institutionInput, { target: { value: 'Test School' } });
    fireEvent.change(emailInput, { target: { value: 'valid.email@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(authService.registerSchoolAdmin).toHaveBeenCalled();
    });
  });
});
