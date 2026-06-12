import { firebaseConfig, adminEmails } from './firebase-config.js';

const CDN = 'https://www.gstatic.com/firebasejs/10.12.5';
const LOCAL_PREFIX = 'esti-biraz:';

let firebaseModules = null;
let app = null;
let auth = null;
let db = null;
let currentUser = null;
let authSubscribers = [];

export function firebaseIsConfigured() {
  return Boolean(
    firebaseConfig?.apiKey &&
    firebaseConfig.apiKey !== 'REPLACE_WITH_FIREBASE_API_KEY' &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.includes('REPLACE_WITH')
  );
}

async function loadFirebaseModules() {
  if (!firebaseModules) {
    const [appMod, authMod, firestoreMod] = await Promise.all([
      import(`${CDN}/firebase-app.js`),
      import(`${CDN}/firebase-auth.js`),
      import(`${CDN}/firebase-firestore.js`)
    ]);
    firebaseModules = { appMod, authMod, firestoreMod };
  }
  return firebaseModules;
}

export async function initFirebase() {
  if (!firebaseIsConfigured()) {
    notifyAuthSubscribers(null);
    return { enabled: false, reason: 'Firebase config placeholder durumda.' };
  }

  const { appMod, authMod, firestoreMod } = await loadFirebaseModules();
  app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
  auth = authMod.getAuth(app);
  db = firestoreMod.getFirestore(app);

  authMod.onAuthStateChanged(auth, (user) => {
    currentUser = user;
    notifyAuthSubscribers(user);
  });

  return { enabled: true };
}

export function getCurrentUser() {
  return currentUser;
}

export function isAdminUser(user = currentUser) {
  return Boolean(user?.email && adminEmails.includes(user.email));
}

export function subscribeAuth(callback) {
  authSubscribers.push(callback);
  callback(currentUser);
  return () => {
    authSubscribers = authSubscribers.filter((item) => item !== callback);
  };
}

function notifyAuthSubscribers(user) {
  authSubscribers.forEach((callback) => callback(user));
}

export async function login(email, password) {
  if (!firebaseIsConfigured()) throw new Error('Firebase ayarları eklenmediği için giriş yapılamaz.');
  const { authMod } = await loadFirebaseModules();
  const result = await authMod.signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function register(email, password) {
  if (!firebaseIsConfigured()) throw new Error('Firebase ayarları eklenmediği için kayıt yapılamaz.');
  const { authMod } = await loadFirebaseModules();
  const result = await authMod.createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logout() {
  if (!firebaseIsConfigured()) return;
  const { authMod } = await loadFirebaseModules();
  await authMod.signOut(auth);
}

export async function loadCollection(collectionName, fallback = []) {
  if (!firebaseIsConfigured() || !db) return fallback;
  const { firestoreMod } = await loadFirebaseModules();
  const collectionRef = firestoreMod.collection(db, collectionName);
  const snapshot = await firestoreMod.getDocs(collectionRef);
  if (snapshot.empty) return fallback;
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function saveArticle(article) {
  if (!firebaseIsConfigured() || !db) throw new Error('Firestore hazır değil.');
  if (!isAdminUser()) throw new Error('Yazı eklemek için admin hesabıyla giriş yapılmalıdır.');

  const { firestoreMod } = await loadFirebaseModules();
  const slug = slugify(article.title);
  const docRef = firestoreMod.doc(db, 'articles', slug);
  const payload = {
    ...article,
    slug,
    publishedAt: new Date().toISOString().slice(0, 10),
    createdAt: firestoreMod.serverTimestamp(),
    updatedAt: firestoreMod.serverTimestamp()
  };
  await firestoreMod.setDoc(docRef, payload, { merge: true });
  return { id: slug, ...payload };
}

export async function getCourseProgress(courseId) {
  const user = getCurrentUser();
  if (!firebaseIsConfigured() || !db || !user) {
    return readLocalProgress(courseId);
  }

  const { firestoreMod } = await loadFirebaseModules();
  const lessonsRef = firestoreMod.collection(db, 'users', user.uid, 'courseProgress', courseId, 'lessons');
  const snapshot = await firestoreMod.getDocs(lessonsRef);
  const progress = {};
  snapshot.forEach((docSnap) => {
    progress[docSnap.id] = Boolean(docSnap.data()?.completed);
  });
  return progress;
}

export async function setLessonProgress(courseId, lessonId, completed) {
  const user = getCurrentUser();
  if (!firebaseIsConfigured() || !db || !user) {
    const progress = readLocalProgress(courseId);
    progress[lessonId] = completed;
    writeLocalProgress(courseId, progress);
    return { mode: 'local', progress };
  }

  const { firestoreMod } = await loadFirebaseModules();
  const lessonRef = firestoreMod.doc(db, 'users', user.uid, 'courseProgress', courseId, 'lessons', lessonId);
  await firestoreMod.setDoc(lessonRef, {
    completed,
    updatedAt: firestoreMod.serverTimestamp()
  }, { merge: true });
  return { mode: 'firestore' };
}

export async function saveNewsletterEmail(email) {
  if (!firebaseIsConfigured() || !db) {
    const key = `${LOCAL_PREFIX}newsletter`;
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    if (!items.includes(email)) items.push(email);
    localStorage.setItem(key, JSON.stringify(items));
    return { mode: 'local' };
  }

  const { firestoreMod } = await loadFirebaseModules();
  const docRef = firestoreMod.doc(db, 'newsletterSubscribers', slugify(email));
  await firestoreMod.setDoc(docRef, {
    email,
    createdAt: firestoreMod.serverTimestamp()
  }, { merge: true });
  return { mode: 'firestore' };
}

function readLocalProgress(courseId) {
  return JSON.parse(localStorage.getItem(`${LOCAL_PREFIX}progress:${courseId}`) || '{}');
}

function writeLocalProgress(courseId, progress) {
  localStorage.setItem(`${LOCAL_PREFIX}progress:${courseId}`, JSON.stringify(progress));
}

function slugify(value) {
  return String(value)
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}
