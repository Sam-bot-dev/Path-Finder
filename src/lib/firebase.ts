import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, type User } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { AppData } from './types'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)
const app = firebaseConfigured ? (getApps()[0] || initializeApp(config)) : null
const auth = app ? getAuth(app) : null
const db = app ? getFirestore(app) : null
const storage = app && config.storageBucket ? getStorage(app) : null
export const cloud = {
  watch(callback: (user: User | null) => void) { if (!auth) { callback(null); return () => {} } return onAuthStateChanged(auth, callback) },
  async google() { if (!auth) throw new Error('Cloud sign-in is not configured for this deployment.'); return signInWithPopup(auth, new GoogleAuthProvider()) },
  async email(email: string, password: string, name?: string) {
    if (!auth) throw new Error('Cloud sign-in is not configured for this deployment.')
    if (name) { const credential = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(credential.user, { displayName: name }); return credential }
    return signInWithEmailAndPassword(auth, email, password)
  },
  async logout() { if (auth) await signOut(auth) },
  async load(uid: string): Promise<AppData | null> { if (!db) return null; const snap = await getDoc(doc(db, 'learners', uid)); return snap.exists() ? snap.data() as AppData : null },
  async save(uid: string, data: AppData) { if (db) await setDoc(doc(db, 'learners', uid), JSON.parse(JSON.stringify(data))) },
  async remove(uid: string) { if (db) await deleteDoc(doc(db, 'learners', uid)) },
  async photo(uid: string, file: File) {
    if (!storage) throw new Error('Firebase Storage is not configured.')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error('Choose a JPG, PNG, or WebP smaller than 2 MB.')
    const photoRef = ref(storage, `avatars/${uid}/profile`)
    await uploadBytes(photoRef, file, { contentType: file.type })
    const url = await getDownloadURL(photoRef)
    if (auth?.currentUser) await updateProfile(auth.currentUser, { photoURL: url })
    return url
  },
}
export type { User }
