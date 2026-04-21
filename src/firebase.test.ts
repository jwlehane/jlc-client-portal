import { describe, it, expect, vi } from 'vitest';
import './firebase';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  connectAuthEmulator: vi.fn(),
}));

describe('Firebase Initialization', () => {
  it('should initialize firebase app', async () => {
    const { default: app } = await import('./firebase');
    expect(app).toBeDefined();
  });
});