// firebase/firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyABxyuQtPHj3e4FfyJnyaWiWQYKK8H7IAk",
  authDomain: "ghib-proy.firebaseapp.com",
  projectId: "ghib-proy",
  storageBucket: "ghib-proy.firebasestorage.app",
  messagingSenderId: "555860921376",
  appId: "1:555860921376:web:3e9918e3b276631f270045"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  auth = getAuth(app); // si ya estaba inicializado (recarga rápida)
}

const db = getFirestore(app);

export { auth, db };