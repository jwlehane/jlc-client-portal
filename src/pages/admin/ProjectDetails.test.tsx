import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProjectDetails from './ProjectDetails';

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => true,
    id: 'test-project',
    data: () => ({
      name: 'Test Project',
      clientName: 'Test Client',
      clientEmail: 'test@client.com',
    }),
  })),
  collection: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn((_q, cb) => {
    cb({ docs: [] });
    return vi.fn();
  }),
  orderBy: vi.fn(),
  Timestamp: { now: vi.fn() },
  deleteDoc: vi.fn(),
}));

describe('ProjectDetails', () => {
  it('renders project name and client info', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/projects/test-project']}>
        <Routes>
          <Route path="/admin/projects/:projectId" element={<ProjectDetails />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(await screen.findByText(/Test Project/i)).toBeDefined();
    expect(await screen.findByText(/Test Client/i)).toBeDefined();
  });

  it('renders the upload button', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/projects/test-project']}>
        <Routes>
          <Route path="/admin/projects/:projectId" element={<ProjectDetails />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/Upload .md Files/i)).toBeDefined();
  });
});