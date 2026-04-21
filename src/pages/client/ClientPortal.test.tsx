import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClientPortal from './ClientPortal';

// Mock react-markdown to avoid rendering complex HTML in tests
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown-content">{children}</div>,
}));

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
      name: 'Client Project Alpha',
      clientName: 'Acme Corp',
      clientEmail: 'contact@acme.com',
    }),
  })),
  collection: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn((_q, cb) => {
    cb({ 
      docs: [
        {
          id: 'doc-1',
          data: () => ({
            title: 'Design Proposal',
            content: '# Design Proposal Content',
            status: 'draft',
            projectId: 'test-project'
          })
        },
        {
          id: 'doc-2',
          data: () => ({
            title: 'Technical Specs',
            content: '# Tech Specs Content',
            status: 'approved',
            projectId: 'test-project'
          })
        }
      ] 
    });
    return vi.fn();
  }),
  orderBy: vi.fn(),
}));

describe('ClientPortal', () => {
  it('renders project name and client email', async () => {
    render(
      <MemoryRouter initialEntries={['/client/test-project']}>
        <Routes>
          <Route path="/client/:projectId" element={<ClientPortal />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(await screen.findByText(/contact@acme.com/i)).toBeDefined();
  });

  it('renders the document list', async () => {
    render(
      <MemoryRouter initialEntries={['/client/test-project']}>
        <Routes>
          <Route path="/client/:projectId" element={<ClientPortal />} />
        </Routes>
      </MemoryRouter>
    );
    
    const elements = await screen.findAllByText(/Design Proposal/i);
    expect(elements.length).toBeGreaterThan(0);
    expect(await screen.findByText(/Technical Specs/i)).toBeDefined();
  });

  it('renders the content of the default selected document', async () => {
    render(
      <MemoryRouter initialEntries={['/client/test-project']}>
        <Routes>
          <Route path="/client/:projectId" element={<ClientPortal />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(await screen.findByTestId('markdown-content')).toBeDefined();
    expect(await screen.findByText(/# Design Proposal Content/i)).toBeDefined();
  });
});