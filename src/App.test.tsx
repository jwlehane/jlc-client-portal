import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from './App';

// Mock Firebase
vi.mock('./firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  orderBy: vi.fn(),
}));

test('renders admin dashboard by default', () => {
  render(<App />);
  const elements = screen.getAllByText(/Project Management/i);
  expect(elements.length).toBeGreaterThan(0);
});