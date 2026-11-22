/* ============ BILLORA CLOUD CONFIG ============ */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCuave6oZHX6r4BhwYZF9IH_2xMHXrWxRU",
  authDomain: "billora-5c863.firebaseapp.com",
  projectId: "billora-5c863",
  storageBucket: "billora-5c863.firebasestorage.app",
  messagingSenderId: "1061039120038",
  appId: "1:1061039120038:web:c4c2b5c489b17d0800de67",
  measurementId: "G-LNSFQ59GZ0"
};

const ADMIN_WHATSAPP = "919076568175";   /* ⚠️ APNA NUMBER YAHAN DAALO (country code ke saath, bina +) */
const APK_URL = "https://github.com/bir001/billora-android/releases/latest/download/app-release.apk";
const TRIAL_DAYS = 14, GRACE_DAYS = 3;

const DEFAULT_PLANS = [
  {id:'starter',name:'Starter',tag:'For a single shop',m:299,y:2399,was:499,limits:{branches:1,devices:1},cloud:false,pop:false,link:'',feat:['Fast touch billing & GST bills','All paper sizes, thermal printing','Barcode scan & labels','Works fully offline','Daily & monthly reports']},
  {id:'pro',name:'Pro',tag:'Most shops choose this',m:599,y:4799,was:999,limits:{branches:3,devices:3},cloud:true,pop:true,link:'',feat:['Everything in Starter','Cloud sync on all devices','Up to 3 branches','KOT, returns & purchase','Excel & PDF export','Priority WhatsApp support']},
  {id:'business',name:'Business',tag:'Chains & wholesalers',m:999,y:7999,was:1499,limits:{branches:10,devices:10},cloud:true,pop:false,link:'',feat:['Everything in Pro','Up to 10 branches','Branch-wise reports','Staff accounts','Free onboarding call']}
];
