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
  getDocs,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';

export interface UserProfile {
  id?: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  isPremium: boolean;
  lastLogin?: any;
  createdAt?: any;
  updatedAt?: any;
}

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
      return false;
    } else {
      await setDoc(prefRef, {
        timestamp: serverTimestamp(),
        videoId: videoId
      });
      return true;
    }
  },

  /**
   * listing all the users from firestore
   */
  async getUsers(): Promise<UserProfile[]> {
    const usersSnap = await getDocs(collection(db, 'users'));
    return usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
  },

  /**
   * Ensures a user profile exists in Firestore.
   * If it doesn't exist, it creates one. If it does, it updates basic info.
   */
  async ensureUserProfile(user: any): Promise<UserProfile | null> {
    if (!user) return null;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      const profileData = {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || null,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (!userSnap.exists()) {
        // New users always start with 'user' role.
        // Admin role must be assigned manually in Firestore.
        const newProfile: UserProfile = {
          ...profileData,
          role: 'user',
          isPremium: false,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, newProfile);
        return newProfile;
      } else {
        await updateDoc(userRef, profileData);
        const existingData = userSnap.data() as UserProfile;
        return { ...existingData, ...profileData } as UserProfile;
      }
    } catch (error) {
      console.error("Error ensuring user profile:", error);
      return null;
    }
  },

  /**
   * Generic content update or create.
   */
  async publishContent(type: string, data: any, id?: string) {
    if (id) {
      const docRef = doc(db, type, id);
      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
      return id;
    } else {
      const docRef = await addDoc(collection(db, type), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    }
  },

  /**
   * Delete content from a collection.
   */
  async deleteContent(collectionName: string, id: string) {
    await deleteDoc(doc(db, collectionName, id));
  }
};
