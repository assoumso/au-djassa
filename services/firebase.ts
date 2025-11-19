
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB9h5wdR3p0jd2YafbfYtb4POYoTnIGbHU",
  authDomain: "ventezen-ss8bq.firebaseapp.com",
  projectId: "ventezen-ss8bq",
  storageBucket: "ventezen-ss8bq.firebasestorage.app",
  messagingSenderId: "115566391827",
  appId: "1:115566391827:web:51b00e7adde230b11005e6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
