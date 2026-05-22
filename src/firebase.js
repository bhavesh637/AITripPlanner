import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider
} from "firebase/auth";

import {
  getFirestore
} from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyABEhSdH7eCSoa8xu2CGJUyXcCpMB74YY0",
  authDomain: "ai-travel-planner-f3e9a.firebaseapp.com",
  projectId: "ai-travel-planner-f3e9a",
  storageBucket: "ai-travel-planner-f3e9a.firebasestorage.app",
  messagingSenderId: "827080165000",
  appId: "1:827080165000:web:afc8e980d32e9b0fa6013d",
  measurementId: "G-7NDPM47SCX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const provider =
  new GoogleAuthProvider();

export const db =
  getFirestore(app);