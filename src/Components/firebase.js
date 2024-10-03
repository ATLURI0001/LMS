import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCakMhPSb5JFeycZHvxSPDB_ujxrACCboI",
  authDomain: "learning-edu-app.firebaseapp.com",
  projectId: "learning-edu-app",
  storageBucket: "learning-edu-app.appspot.com",
  messagingSenderId: "718001890315",
  appId: "1:718001890315:web:f068897e285a457e8a130e",
  measurementId: "G-178HMBYJ58"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);