import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPageManager from './LandingPageManager';

// Mock p2lAdminService
jest.mock('../../services/p2lAdminService', () => ({
  getLandingPage: jest.fn(() => Promise.resolve({
    blocks: [
      {
        type: 'hero',
        title: 'Test Hero',
        content: 'Test content',
        image_url: '',
        order: 0,
        is_visible: true,
        custom_data: {}
      },
      {
        type: 'features',
        title: 'Test Features',
        content: 'Features content',
        image_url: '',
        order: 1,
        is_visible: true,
        custom_data: {}
      }
    ]
  })),
  saveLandingPage: jest.fn(() => Promise.resolve({
    success: true,
    message: 'Landing page saved successfully'
  }))
}));

describe('LandingPageManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <LandingPageManager />
      </BrowserRouter>
    );
  });

  it('displays landing page manager title', async () => {
    render(
      <BrowserRouter>
        <LandingPageManager />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Landing Page Manager')).toBeInTheDocument();
    });
  });

  it('shows view mode toggle buttons', async () => {
    render(
      <BrowserRouter>
        <LandingPageManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Edit Mode/)).toBeInTheDocument();
      expect(screen.getByText(/Preview/)).toBeInTheDocument();
    });
  });

  it('displays blocks after loading', async () => {
    render(
      <BrowserRouter>
        <LandingPageManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Hero')).toBeInTheDocument();
    });
  });
});
