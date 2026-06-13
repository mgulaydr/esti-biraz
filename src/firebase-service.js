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
  assertAdminReady('Yazı kaydetmek için admin hesabıyla giriş yapılmalıdır.');
  const { firestoreMod } = await loadFirebaseModules();
  const articleId = slugify(article.id || article.slug || article.title);
  if (!articleId) throw new Error('Yazı için geçerli bir başlık veya ID gerekli.');

  const docRef = firestoreMod.doc(db, 'articles', articleId);
  const payload = {
    title: String(article.title || '').trim(),
    category: String(article.category || '').trim() || 'Genel',
    summary: String(article.summary || '').trim(),
    body: normalizeTextArray(article.body),
    contentBlocks: normalizeContentBlocks(article.contentBlocks),
    tags: Array.isArray(article.tags) ? article.tags.map(String).map((item) => item.trim()).filter(Boolean) : [],
    readingMinutes: Number.isFinite(Number(article.readingMinutes)) ? Number(article.readingMinutes) : 3,
    publishedAt: article.publishedAt || new Date().toISOString().slice(0, 10),
    slug: articleId,
    updatedAt: firestoreMod.serverTimestamp()
  };

  await firestoreMod.setDoc(docRef, payload, { merge: true });
  return { id: articleId, ...payload };
}

export async function deleteArticle(articleId) {
  assertAdminReady('Yazı silmek için admin hesabıyla giriş yapılmalıdır.');
  const { firestoreMod } = await loadFirebaseModules();
  await firestoreMod.deleteDoc(firestoreMod.doc(db, 'articles', articleId));
  return { id: articleId };
}

export async function saveCourse(course) {
  assertAdminReady('Kurs kaydetmek için admin hesabıyla giriş yapılmalıdır.');
  const { firestoreMod } = await loadFirebaseModules();
  const courseId = slugify(course.id || course.slug || course.title);
  if (!courseId) throw new Error('Kurs için geçerli bir başlık veya ID gerekli.');

  const docRef = firestoreMod.doc(db, 'courses', courseId);
  const existing = await firestoreMod.getDoc(docRef);
  const existingLessons = existing.exists() && Array.isArray(existing.data()?.lessons) ? existing.data().lessons : [];
  const incomingLessons = Array.isArray(course.lessons) ? course.lessons : existingLessons;
  const payload = {
    title: String(course.title || '').trim(),
    category: String(course.category || '').trim() || 'Akademi',
    summary: String(course.summary || '').trim(),
    instructor: String(course.instructor || '').trim(),
    level: String(course.level || '').trim() || 'Başlangıç',
    status: String(course.status || '').trim() || 'published',
    featured: Boolean(course.featured),
    lessons: normalizeLessonsForFirestore(incomingLessons),
    slug: courseId,
    updatedAt: firestoreMod.serverTimestamp()
  };

  await firestoreMod.setDoc(docRef, payload, { merge: true });
  return { id: courseId, ...payload };
}

export async function deleteCourse(courseId) {
  assertAdminReady('Kurs silmek için admin hesabıyla giriş yapılmalıdır.');
  const { firestoreMod } = await loadFirebaseModules();
  await firestoreMod.deleteDoc(firestoreMod.doc(db, 'courses', courseId));
  return { id: courseId };
}

export async function saveCourseLesson(courseId, lesson) {
  assertAdminReady('Ders kaydetmek için admin hesabıyla giriş yapılmalıdır.');
  const { firestoreMod } = await loadFirebaseModules();
  const courseRef = firestoreMod.doc(db, 'courses', courseId);
  const snapshot = await firestoreMod.getDoc(courseRef);
  if (!snapshot.exists()) throw new Error('Ders eklemek için önce kurs kaydedilmelidir.');

  const lessonId = slugify(lesson.id || lesson.title);
  if (!lessonId) throw new Error('Ders için geçerli bir başlık veya ID gerekli.');

  const courseData = snapshot.data();
  const lessons = Array.isArray(courseData.lessons) ? courseData.lessons : [];
  const normalizedLesson = normalizeLessonForFirestore({ ...lesson, id: lessonId });
  const nextLessons = [
    ...lessons.filter((item) => String(item?.id) !== lessonId),
    normalizedLesson
  ].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

  await firestoreMod.setDoc(courseRef, {
    lessons: nextLessons,
    updatedAt: firestoreMod.serverTimestamp()
  }, { merge: true });

  return { id: courseId, ...courseData, lessons: nextLessons };
}

export async function deleteCourseLesson(courseId, lessonId) {
  assertAdminReady('Ders silmek için admin hesabıyla giriş yapılmalıdır.');
  const { firestoreMod } = await loadFirebaseModules();
  const courseRef = firestoreMod.doc(db, 'courses', courseId);
  const snapshot = await firestoreMod.getDoc(courseRef);
  if (!snapshot.exists()) throw new Error('Kurs bulunamadı.');

  const courseData = snapshot.data();
  const lessons = Array.isArray(courseData.lessons) ? courseData.lessons : [];
  const nextLessons = lessons.filter((item) => String(item?.id) !== String(lessonId));

  await firestoreMod.setDoc(courseRef, {
    lessons: nextLessons,
    updatedAt: firestoreMod.serverTimestamp()
  }, { merge: true });

  return { id: courseId, ...courseData, lessons: nextLessons };
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

function assertAdminReady(message) {
  if (!firebaseIsConfigured() || !db) throw new Error('Firestore hazır değil. Firebase ayarlarını kontrol et.');
  if (!isAdminUser()) throw new Error(message);
}

function readLocalProgress(courseId) {
  return JSON.parse(localStorage.getItem(`${LOCAL_PREFIX}progress:${courseId}`) || '{}');
}

function writeLocalProgress(courseId, progress) {
  localStorage.setItem(`${LOCAL_PREFIX}progress:${courseId}`, JSON.stringify(progress));
}

function normalizeLessonsForFirestore(lessons) {
  return lessons.map(normalizeLessonForFirestore)
    .filter((lesson) => lesson.id && lesson.title)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

function normalizeLessonForFirestore(lesson) {
  const order = Number(lesson.order);
  const durationMinutes = Number(lesson.durationMinutes);
  return {
    id: slugify(lesson.id || lesson.title),
    title: String(lesson.title || '').trim(),
    order: Number.isFinite(order) ? order : 1,
    durationMinutes: Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : null,
    type: String(lesson.type || '').trim() || 'Okuma',
    content: normalizeTextArray(lesson.content),
    keyPoints: normalizeTextArray(lesson.keyPoints),
    example: normalizeTextArray(lesson.example),
    resources: normalizeResources(lesson.resources),
    contentBlocks: normalizeContentBlocks(lesson.contentBlocks)
  };
}

function normalizeTextArray(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split('\n').map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeResources(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return item.trim();
    return {
      title: String(item?.title || item?.label || item?.url || '').trim(),
      url: String(item?.url || '').trim()
    };
  }).filter((item) => typeof item === 'string' ? item : item.title || item.url);
}

function normalizeContentBlocks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((block) => block && typeof block === 'object')
    .map((block) => {
      const type = String(block.type || 'paragraph').trim().toLowerCase();
      const normalized = { type };

      ['text', 'title', 'tone', 'url', 'alt', 'caption', 'source', 'question', 'explanation', 'videoId'].forEach((key) => {
        if (block[key] !== undefined && block[key] !== null) normalized[key] = String(block[key]).trim();
      });

      if (Array.isArray(block.items)) normalized.items = block.items.map(String).map((item) => item.trim()).filter(Boolean);
      if (Array.isArray(block.options)) normalized.options = block.options.map(String).map((item) => item.trim()).filter(Boolean);
      if (Number.isFinite(Number(block.correctIndex))) normalized.correctIndex = Number(block.correctIndex);

      return normalized;
    })
    .filter((block) => block.type);
}

export function slugify(value) {
  return String(value || '')
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
