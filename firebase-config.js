/* ============ BILLORA CLOUD CONFIG (edit this file) ============
   1) Firebase console > Project settings > Your apps > Web app > copy the config values here.
   2) Leave apiKey empty ("") to run Billora in local-only mode (no login). */
const FIREBASE_CONFIG={apiKey:"",authDomain:"",projectId:"",storageBucket:"",messagingSenderId:"",appId:""};
const ADMIN_WHATSAPP="91XXXXXXXXXX";   /* your WhatsApp number with country code, for plan requests */
const APK_URL="https://github.com/bir001/billora-android/releases/latest/download/app-release.apk";
/* Optional: Google Sheets / Drive export. Create an OAuth Web client in Google Cloud and paste its Client ID. */
const GOOGLE_CLIENT_ID="";
const TRIAL_DAYS=3,GRACE_DAYS=3;
/* Sample plans. Prices are placeholders: change them in Admin > Plans (saved in Firebase). */
const DEFAULT_PLANS=[
 {id:'starter',name:'Starter',tag:'For a single shop',m:299,y:2399,was:499,limits:{branches:1,devices:1},cloud:false,pop:false,link:'',feat:['Fast touch billing & GST bills','All paper sizes, thermal printing','Barcode scan & labels','Works fully offline','Daily & monthly reports']},
 {id:'pro',name:'Pro',tag:'Most shops choose this',m:599,y:4799,was:999,limits:{branches:3,devices:3},cloud:true,pop:true,link:'',feat:['Everything in Starter','Cloud sync on all devices','Up to 3 branches','KOT, returns & purchase','Excel & PDF export','Priority WhatsApp support']},
 {id:'business',name:'Business',tag:'Chains & wholesalers',m:999,y:7999,was:1499,limits:{branches:10,devices:10},cloud:true,pop:false,link:'',feat:['Everything in Pro','Up to 10 branches','Branch-wise reports','Staff accounts','Free onboarding call']}];
