import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getEnv } from "@/utils/environment";

// Firebase configuration
const firebaseConfig = {
  projectId: "roboflow-platform",
  appId: "1:481589474394:web:1e35528067deb71ccf9463",
  databaseURL: "https://roboflow-platform.firebaseio.com",
  storageBucket: "roboflow-platform-regional-sources",
  locationId: "us-central",
  authDomain: "app.roboflow.com",
  messagingSenderId: "481589474394",
  measurementId: "G-3991Z8P4PM",
  apiKey: getEnv("FIREBASE_API_KEY"),
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export the Firestore instance
export { db };
