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
        content: 'Test Content',
        image_url: '',
        order: 1,
        is_visible: true,
        custom_data: {}
      },
      {
        type: 'features',
        title: 'Platform Features',
        content: '',
        image_url: '',
        order: 2,
        is_visible: true,
        custom_data: {
          features: [
            { icon: '🎯', title: 'Feature 1', description: 'Description 1' },
            { icon: '🏆', title: 'Feature 2', description: 'Description 2' }
          ]
        }
      },
      {
        type: 'testimonials',
        title: 'Success Stories',
        content: '',
        image_url: '',
        order: 3,
        is_visible: true,
        custom_data: {
          testimonials: [
            { id: 1, name: 'John Doe', role: 'Student', quote: 'Great app!', image: '' }
          ]
        }
      }
    ]
  })),
  saveLandingPage: jest.fn(() => Promise.resolve({ success: true })),
}));

describe('LandingPageManager', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <LandingPageManager />
      </BrowserRouter>
    );
  });

  it('loads and displays landing page blocks', async () => {
    render(
      <BrowserRouter>
        <LandingPageManager />
      </BrowserRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check if blocks are displayed
    expect(screen.getByText('Test Hero')).toBeInTheDocument();
    expect(screen.getByText('Platform Features')).toBeInTheDocument();
  });

  it('displays custom data summaries for different block types', async () => {
    render(
      <BrowserRouter>
        <LandingPageManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check for features summary
    expect(screen.getByText(/2 feature\(s\)/)).toBeInTheDocument();
    
    // Check for testimonials summary
    expect(screen.getByText(/1 testimonial\(s\)/)).toBeInTheDocument();
  });
});
