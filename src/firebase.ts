import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAThe1_F61AYEZtXl6ISwNkd6D0XMSgg3k",
  authDomain: "wbcs-progress-tracker-30fa6.firebaseapp.com",
  databaseURL: "https://wbcs-progress-tracker-30fa6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wbcs-progress-tracker-30fa6",
  storageBucket: "wbcs-progress-tracker-30fa6.firebasestorage.app",
  messagingSenderId: "9259146",
  appId: "1:9259146:web:8fc8523c6040658bf40573"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
