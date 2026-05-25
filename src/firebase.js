import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// ─────────────────────────────────────────────────────────────────────────────
// Replace these values with your own Firebase project config.
// Project Settings → Your apps → Web app → firebaseConfig
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyA8qarl6sZLv71cgs99JKOin9pjwljmbIo",
  authDomain: "strengthen-app.firebaseapp.com",
  databaseURL: "https://strengthen-app-default-rtdb.firebaseio.com",
  projectId: "strengthen-app",
  storageBucket: "strengthen-app.firebasestorage.app",
  messagingSenderId: "1035596386129",
  appId: "1:1035596386129:web:aeadbbca7ddd74ae910d70",
  measurementId: "G-7S30WF0791"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
