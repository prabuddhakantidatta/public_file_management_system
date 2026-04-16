import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBgZGQQHI9N-baEZoJDcFdcvpiQd_vZt4E",
  authDomain: "cabinet-mapping-app.firebaseapp.com",
  databaseURL: "https://cabinet-mapping-app-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cabinet-mapping-app",
  storageBucket: "cabinet-mapping-app.firebasestorage.app",
  messagingSenderId: "173300160497",
  appId: "1:173300160497:web:2fdae4a7ff524a65b79650"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
