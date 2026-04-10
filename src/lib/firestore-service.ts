import { db, auth } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  addDoc,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';

export interface Video {
  id: string;
  title: string;
  category: string;
  youtubeId: string;
  thumbnail: string;
  createdAt?: any;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  thumbnail: string;
  createdAt?: any;
}

/**
 * Service to manage Firestore operations for Videos, Articles, and User Preferences.
 */
export const FirestoreService = {
  /**
   * Toggles a user's preference for a video (bookmarks or downloads).
   */
  async togglePreference(userId: string, videoId: string, type: 'bookmarks' | 'downloads') {
    const prefRef = doc(db, 'users', userId, type, videoId);
    const prefSnap = await getDoc(prefRef);

    if (prefSnap.exists()) {
      await deleteDoc(prefRef);
      return false; // Removed
    } else {
      await setDoc(prefRef, {
        id: videoId,
        savedAt: serverTimestamp(),
      });
      return true; // Added
    }
  },

  /**
   * Fetches user profile data including role and premium status.
   */
  async getUserProfile(userId: string) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  },

  /**
   * Generic content update or create.
   */
  async publishContent(collectionName: string, data: any, id?: string) {
    if (id) {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
      return id;
    } else {
      const colRef = collection(db, collectionName);
      const newDoc = await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
      return newDoc.id;
    }
  },

  /**
   * Deletes content from a collection.
   */
  async deleteContent(collectionName: string, id: string) {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }
};
