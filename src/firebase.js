import {
  initializeApp
} from "firebase/app";

import {
  getAuth
} from "firebase/auth";

import {
  getFirestore
} from "firebase/firestore";

import {
  getStorage
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB9BEqpcoHXTY-ZjInrA3fyhy1XljjTPF4",
  authDomain: "msh-patente.firebaseapp.com",
  projectId: "msh-patente",
  storageBucket: "msh-patente.firebasestorage.app",
  messagingSenderId: "1296263333563",
  appId: "1:1296263333563:web:5913f5a49b988eabe25dde"
};

const app = initializeApp(firebaseConfig);

export const auth =
  getAuth(app);

export const db =
  getFirestore(app);

export const storage =
  getStorage(app);

export default app;