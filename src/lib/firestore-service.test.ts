import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirestoreService } from './firestore-service';
import { db } from '../firebase';
import { getDoc, setDoc, deleteDoc, doc } from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-uid' } },
  storage: {}
}));

vi.mock('firebase/firestore', () => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp')
}));

describe('FirestoreService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user profile', async () => {
    const mockDoc = {
      exists: () => true,
      data: () => ({ role: 'admin', isPremium: true })
    };
    (getDoc as any).mockResolvedValue(mockDoc);

    const profile = await FirestoreService.getUserProfile('test-uid');
    expect(profile).toEqual({ role: 'admin', isPremium: true });
    expect(doc).toHaveBeenCalledWith(db, 'users', 'test-uid');
  });

  it('should toggle preference (add)', async () => {
    // Mock getDoc to say it doesn't exist
    (getDoc as any).mockResolvedValue({ exists: () => false });

    const added = await FirestoreService.togglePreference('user1', 'video1', 'bookmarks');
    expect(added).toBe(true);
    expect(setDoc).toHaveBeenCalled();
  });

  it('should toggle preference (remove)', async () => {
    // Mock getDoc to say it exists
    (getDoc as any).mockResolvedValue({ exists: () => true });

    const added = await FirestoreService.togglePreference('user1', 'video1', 'bookmarks');
    expect(added).toBe(false);
    expect(deleteDoc).toHaveBeenCalled();
  });
});
