import firebase from 'firebase/compat/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDaF9QwsQBuBuz_blvJCPQQspxIlA-ldio",
    authDomain: "chillies-debd6.firebaseapp.com",
    projectId: "chillies-debd6",
    storageBucket: "chillies-debd6.firebasestorage.app",
    messagingSenderId: "868591964292",
    appId: "1:868591964292:web:2a3b00f43008a07177b2d1",
    measurementId: "G-22RTL2DRFV"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export const db = getFirestore();