import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProjectDashboard from './ProjectDashboard';

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn((_q, cb) => {
    // Immediately call back with empty data to clear loading state in tests
    cb({ docs: [] });
    return vi.fn(); // Return unsubscribe
  }),
  orderBy: vi.fn(),
  Timestamp: { now: vi.fn() },
}));

describe('ProjectDashboard', () => {
  it('renders the active projects header', async () => {
    render(
      <MemoryRouter>
        <ProjectDashboard />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Active Projects/i)).toBeDefined();
  });

  it('renders the New Project button', async () => {
    render(
      <MemoryRouter>
        <ProjectDashboard />
      </MemoryRouter>
    );
    const elements = await screen.findAllByText(/New Project/i);
    expect(elements.length).toBeGreaterThan(0);
  });
});