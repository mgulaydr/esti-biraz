import { demoArticles, demoCourses, demoMetrics } from './content.js';
import {
  firebaseIsConfigured,
  getCurrentUser,
  getCourseProgress,
  initFirebase,
  isAdminUser,
  loadCollection,
  login,
  logout,
  register,
  saveArticle,
  saveNewsletterEmail,
  setLessonProgress,
  subscribeAuth
} from './firebase-service.js';

const state = {
  articles: [],
  courses: [],
  activeCategory: 'Tümü',
  query: '',
  progress: new Map(),
  firebaseEnabled: false
};

const els = {
  todayLabel: document.querySelector('#todayLabel'),
  categoryFilters: document.querySelector('#categoryFilters'),
  articleList: document.querySelector('#articleList'),
  courseList: document.querySelector('#courseList'),
  metricGrid: document.querySelector('#metricGrid'),
  searchForm: document.querySelector('#searchForm'),
  searchInput: document.querySelector('#searchInput'),
  articleDialog: document.querySelector('#articleDialog'),
  articleDialogContent: document.querySelector('#articleDialogContent'),
  courseDialog: document.querySelector('#courseDialog'),
  courseDialogContent: document.querySelector('#courseDialogContent'),
  authDialog: document.querySelector('#authDialog'),
  authForm: document.querySelector('#authForm'),
  authStatus: document.querySelector('#authStatus'),
  loginButton: document.querySelector('#loginButton'),
  registerButton: document.querySelector('#registerButton'),
  logoutButton: document.querySelector('#logoutButton'),
  openAdminButton: document.querySelector('#openAdminButton'),
  adminDialog: document.querySelector('#adminDialog'),
  adminArticleForm: document.querySelector('#adminArticleForm'),
  adminNote: document.querySelector('#adminNote'),
  newsletterForm: document.querySelector('#newsletterForm'),
  newsletterNote: document.querySelector('#newsletterNote'),
  themeToggle: document.querySelector('#themeToggle')
};

boot();

async function boot() {
  setTodayLabel();
  restoreTheme();
  bindEvents();

  const initResult = await initFirebase();
  state.firebaseEnabled = Boolean(initResult.enabled);

  state.articles = sortByDate(await loadCollection('articles', demoArticles));
  state.courses = await loadCollection('courses', demoCourses);

  await refreshAllCourseProgress();
  renderCategoryFilters();
  renderArticles();
  renderCourses();
  renderMetrics();
  updateAuthUi(getCurrentUser());

  subscribeAuth(async (user) => {
    updateAuthUi(user);
    await refreshAllCourseProgress();
    renderCourses();
  });
}

function setTodayLabel() {
  const now = new Date();
  const label = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);
  els.todayLabel.textContent = label;
  els.todayLabel.dateTime = now.toISOString().slice(0, 10);
}

function bindEvents() {
  els.themeToggle.addEventListener('click', toggleTheme);
  els.searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    state.query = els.searchInput.value.trim().toLocaleLowerCase('tr-TR');
    renderArticles();
    document.querySelector('#saglik')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => document.querySelector(`#${button.dataset.closeDialog}`)?.close());
  });

  document.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', () => document.querySelector(button.dataset.scrollTarget)?.scrollIntoView({ behavior: 'smooth' }));
  });

  els.loginButton.addEventListener('click', () => els.authDialog.showModal());
  els.openAdminButton.addEventListener('click', () => els.adminDialog.showModal());

  els.authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await runAuthAction('login');
  });

  els.registerButton.addEventListener('click', async () => runAuthAction('register'));
  els.logoutButton.addEventListener('click', async () => {
    await logout();
    els.authDialog.close();
  });

  els.adminArticleForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(els.adminArticleForm);
    const payload = {
      title: data.get('title'),
      category: data.get('category'),
      summary: data.get('summary'),
      body: String(data.get('body')).split('\n').filter(Boolean),
      tags: String(data.get('tags') || '').split(',').map((tag) => tag.trim()).filter(Boolean),
      readingMinutes: Math.max(2, Math.ceil(String(data.get('body')).length / 850))
    };

    try {
      const saved = await saveArticle(payload);
      state.articles = sortByDate([saved, ...state.articles.filter((article) => article.id !== saved.id)]);
      els.adminNote.textContent = 'Yazı kaydedildi.';
      els.adminArticleForm.reset();
      renderCategoryFilters();
      renderArticles();
    } catch (error) {
      els.adminNote.textContent = error.message;
    }
  });

  els.newsletterForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.querySelector('#newsletterEmail').value.trim();
    if (!email) return;
    const result = await saveNewsletterEmail(email);
    els.newsletterNote.textContent = result.mode === 'firestore'
      ? 'Kaydınız Firestore üzerinde saklandı.'
      : 'Firebase bağlı olmadığı için kayıt bu tarayıcıda geçici olarak saklandı.';
    els.newsletterForm.reset();
  });
}

async function runAuthAction(action) {
  const email = document.querySelector('#authEmail').value.trim();
  const password = document.querySelector('#authPassword').value;
  try {
    if (action === 'register') await register(email, password);
    else await login(email, password);
    els.authStatus.textContent = 'Giriş başarılı.';
  } catch (error) {
    els.authStatus.textContent = error.message;
  }
}

function updateAuthUi(user) {
  const configured = firebaseIsConfigured();
  els.loginButton.textContent = user ? user.email : 'Giriş';
  els.logoutButton.hidden = !user;
  els.registerButton.hidden = Boolean(user) || !configured;
  els.openAdminButton.hidden = !isAdminUser(user);

  if (!configured) {
    els.authStatus.textContent = 'Firebase ayarları eklenmedi. Site demo/localStorage modunda çalışıyor.';
  } else if (user) {
    els.authStatus.textContent = `${user.email} ile giriş yapıldı.`;
  } else {
    els.authStatus.textContent = 'Giriş yaparsanız ders ilerlemesi Firestore üzerinde kalıcı saklanır.';
  }
}

function renderCategoryFilters() {
  const categories = ['Tümü', ...new Set(state.articles.map((article) => article.category))];
  els.categoryFilters.innerHTML = '';
  categories.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category;
    button.setAttribute('aria-pressed', String(category === state.activeCategory));
    button.addEventListener('click', () => {
      state.activeCategory = category;
      renderCategoryFilters();
      renderArticles();
    });
    els.categoryFilters.append(button);
  });
}

function renderArticles() {
  const template = document.querySelector('#articleCardTemplate');
  const filtered = state.articles.filter((article) => {
    const inCategory = state.activeCategory === 'Tümü' || article.category === state.activeCategory;
    const haystack = [article.title, article.category, article.summary, ...(article.tags || [])]
      .join(' ')
      .toLocaleLowerCase('tr-TR');
    const inQuery = !state.query || haystack.includes(state.query);
    return inCategory && inQuery;
  });

  els.articleList.innerHTML = '';

  if (!filtered.length) {
    els.articleList.innerHTML = '<p class="form-note">Aramanıza uygun içerik bulunamadı.</p>';
    return;
  }

  filtered.forEach((article) => {
    const fragment = template.content.cloneNode(true);
    const button = fragment.querySelector('.article-card__button');
    fragment.querySelector('.article-card__category').textContent = article.category;
    fragment.querySelector('h3').textContent = article.title;
    fragment.querySelector('p').textContent = article.summary;
    fragment.querySelector('.article-card__meta').textContent = `${formatDate(article.publishedAt)} • ${article.readingMinutes || 3} dk okuma`;
    button.addEventListener('click', () => openArticle(article));
    els.articleList.append(fragment);
  });
}

function openArticle(article) {
  els.articleDialogContent.innerHTML = `
    <p class="article-dialog__category">${escapeHtml(article.category)}</p>
    <h2 id="articleDialogTitle">${escapeHtml(article.title)}</h2>
    <p class="form-note">${formatDate(article.publishedAt)} • ${(article.tags || []).map(escapeHtml).join(' • ')}</p>
    ${(Array.isArray(article.body) ? article.body : [article.body]).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
  `;
  els.articleDialog.showModal();
}

async function refreshAllCourseProgress() {
  state.progress = new Map();
  await Promise.all(state.courses.map(async (course) => {
    state.progress.set(course.id, await getCourseProgress(course.id));
  }));
}

function renderCourses() {
  const template = document.querySelector('#courseCardTemplate');
  els.courseList.innerHTML = '';

  state.courses.forEach((course) => {
    const progress = calculateCoursePercent(course);
    const fragment = template.content.cloneNode(true);
    fragment.querySelector('h3').textContent = course.title;
    fragment.querySelector('p').textContent = course.summary;
    fragment.querySelector('progress').value = progress;
    fragment.querySelector('button').textContent = progress ? `Devam et • %${progress}` : 'Derse başla';
    fragment.querySelector('button').addEventListener('click', () => openCourse(course));
    els.courseList.append(fragment);
  });
}

function openCourse(course) {
  const progress = state.progress.get(course.id) || {};
  els.courseDialogContent.innerHTML = `
    <div class="course-dialog">
      <p class="article-dialog__category">${escapeHtml(course.category || 'Akademi')}</p>
      <h2 id="courseDialogTitle">${escapeHtml(course.title)}</h2>
      <p>${escapeHtml(course.summary)}</p>
      <p class="form-note">${getCurrentUser() ? 'İlerlemeniz Firestore hesabınıza kaydedilir.' : 'Giriş yapmadığınız için ilerleme bu tarayıcıda geçici saklanır.'}</p>
      <ul class="lesson-list">
        ${course.lessons.map((lesson) => `
          <li class="lesson-item">
            <input type="checkbox" id="${course.id}-${lesson.id}" data-course-id="${course.id}" data-lesson-id="${lesson.id}" ${progress[lesson.id] ? 'checked' : ''} />
            <label for="${course.id}-${lesson.id}">${escapeHtml(lesson.title)}</label>
            <span>${progress[lesson.id] ? 'Tamamlandı' : 'Bekliyor'}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;

  els.courseDialogContent.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener('change', async () => {
      await setLessonProgress(input.dataset.courseId, input.dataset.lessonId, input.checked);
      const progressForCourse = state.progress.get(input.dataset.courseId) || {};
      progressForCourse[input.dataset.lessonId] = input.checked;
      state.progress.set(input.dataset.courseId, progressForCourse);
      input.closest('.lesson-item').querySelector('span').textContent = input.checked ? 'Tamamlandı' : 'Bekliyor';
      renderCourses();
    });
  });

  els.courseDialog.showModal();
}

function renderMetrics() {
  els.metricGrid.innerHTML = demoMetrics.map((metric) => `
    <article class="metric-card">
      <strong>${escapeHtml(metric.value)}</strong>
      <span>${escapeHtml(metric.label)}</span>
    </article>
  `).join('');
}

function calculateCoursePercent(course) {
  const progress = state.progress.get(course.id) || {};
  const total = course.lessons?.length || 0;
  if (!total) return 0;
  const done = course.lessons.filter((lesson) => progress[lesson.id]).length;
  return Math.round((done / total) * 100);
}

function restoreTheme() {
  const saved = localStorage.getItem('esti-biraz:theme');
  if (saved) document.documentElement.dataset.theme = saved;
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.dataset.theme = 'dark';
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('esti-biraz:theme', next);
}

function sortByDate(items) {
  return [...items].sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
}

function formatDate(value) {
  if (!value) return 'Tarih yok';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
