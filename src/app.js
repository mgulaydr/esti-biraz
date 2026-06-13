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
    const lessons = normalizeLessons(course);
    const progress = calculateCoursePercent(course);
    const fragment = template.content.cloneNode(true);
    fragment.querySelector('h3').textContent = course.title || 'Başlıksız kurs';
    fragment.querySelector('p').textContent = course.summary || 'Bu kurs için henüz özet eklenmedi.';
    fragment.querySelector('progress').value = progress;
    fragment.querySelector('button').textContent = progress ? `Devam et • %${progress}` : 'Derse başla';
    fragment.querySelector('button').disabled = !lessons.length;
    fragment.querySelector('button').addEventListener('click', () => openCourse(course));
    els.courseList.append(fragment);
  });
}

function openCourse(course) {
  const lessons = normalizeLessons(course);
  const progress = state.progress.get(course.id) || {};
  const firstReadableLesson = lessons.find(hasReadableLessonContent) || lessons[0];

  els.courseDialogContent.innerHTML = `
    <div class="course-dialog">
      <p class="article-dialog__category">${escapeHtml(course.category || 'Akademi')}</p>
      <h2 id="courseDialogTitle">${escapeHtml(course.title || 'Başlıksız kurs')}</h2>
      <p>${escapeHtml(course.summary || 'Bu kurs için henüz özet eklenmedi.')}</p>
      <div class="course-meta-row">
        ${course.instructor ? `<span>Eğitmen: ${escapeHtml(course.instructor)}</span>` : ''}
        ${course.level ? `<span>Düzey: ${escapeHtml(course.level)}</span>` : ''}
        ${lessons.length ? `<span>${lessons.length} ders</span>` : ''}
      </div>
      <p class="form-note">${getCurrentUser() ? 'İlerlemeniz Firestore hesabınıza kaydedilir.' : 'Giriş yapmadığınız için ilerleme bu tarayıcıda geçici saklanır.'}</p>

      <div class="course-learning-layout">
        <section aria-label="Ders listesi">
          <ul class="lesson-list">
            ${lessons.map((lesson) => renderLessonListItem(course, lesson, progress)).join('')}
          </ul>
        </section>
        <section id="lessonReader" class="lesson-reader" aria-live="polite">
          ${firstReadableLesson ? renderLessonReader(course, firstReadableLesson, progress) : renderEmptyLessonReader()}
        </section>
      </div>
    </div>
  `;

  els.courseDialogContent.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener('change', async () => {
      await updateLessonProgressUi(course, input.dataset.lessonId, input.checked);
    });
  });

  els.courseDialogContent.querySelectorAll('[data-open-lesson]').forEach((button) => {
    button.addEventListener('click', () => {
      const lesson = lessons.find((item) => item.id === button.dataset.openLesson);
      if (!lesson) return;
      els.courseDialogContent.querySelector('#lessonReader').innerHTML = renderLessonReader(course, lesson, state.progress.get(course.id) || {});
      bindLessonReaderActions(course);
    });
  });

  bindLessonReaderActions(course);
  els.courseDialog.showModal();
}

function renderLessonListItem(course, lesson, progress) {
  const inputId = `lesson-${course.id}-${lesson.id}`;
  const status = progress[lesson.id] ? 'Tamamlandı' : 'Bekliyor';
  const duration = lesson.durationMinutes ? `${lesson.durationMinutes} dk` : '';

  return `
    <li class="lesson-item" data-lesson-row="${escapeHtml(lesson.id)}">
      <input type="checkbox" id="${escapeHtml(inputId)}" data-course-id="${escapeHtml(course.id)}" data-lesson-id="${escapeHtml(lesson.id)}" ${progress[lesson.id] ? 'checked' : ''} />
      <div class="lesson-item__main">
        <label for="${escapeHtml(inputId)}">${escapeHtml(lesson.title || 'Başlıksız ders')}</label>
        <small>${escapeHtml([duration, lesson.type].filter(Boolean).join(' • ') || 'Ders')}</small>
      </div>
      <div class="lesson-item__actions">
        <span>${status}</span>
        <button class="ghost-button ghost-button--small" type="button" data-open-lesson="${escapeHtml(lesson.id)}">Dersi oku</button>
      </div>
    </li>
  `;
}

function renderLessonReader(course, lesson, progress) {
  const contentBlocks = normalizeTextBlocks(lesson.content);
  const exampleBlocks = normalizeTextBlocks(lesson.example);
  const keyPoints = Array.isArray(lesson.keyPoints) ? lesson.keyPoints.filter(Boolean) : [];
  const resources = Array.isArray(lesson.resources) ? lesson.resources.filter(Boolean) : [];
  const completed = Boolean(progress[lesson.id]);

  return `
    <article class="lesson-reader__card">
      <p class="lesson-reader__eyebrow">${escapeHtml(course.title || 'Kurs')}</p>
      <h3>${escapeHtml(lesson.title || 'Başlıksız ders')}</h3>
      ${lesson.durationMinutes ? `<p class="form-note">Tahmini süre: ${escapeHtml(lesson.durationMinutes)} dakika</p>` : ''}

      ${contentBlocks.length
        ? contentBlocks.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')
        : '<p class="form-note">Bu ders için henüz ayrıntılı içerik eklenmemiş. Firestore’daki ilgili ders nesnesine <code>content</code> alanı ekleyebilirsin.</p>'}

      ${keyPoints.length ? `
        <div class="lesson-callout">
          <strong>Kısa özet</strong>
          <ul>${keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>
        </div>
      ` : ''}

      ${exampleBlocks.length ? `
        <div class="lesson-example">
          <strong>Örnek</strong>
          ${exampleBlocks.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
        </div>
      ` : ''}

      ${resources.length ? `
        <div class="lesson-resources">
          <strong>Kaynaklar</strong>
          <ul>${resources.map(renderResourceLink).join('')}</ul>
        </div>
      ` : ''}

      <div class="lesson-reader__footer">
        <button class="primary-button" type="button" data-complete-lesson="${escapeHtml(lesson.id)}">
          ${completed ? 'Tamamlandı işaretini kaldır' : 'Dersi tamamlandı işaretle'}
        </button>
        <span class="form-note">${completed ? 'Bu ders tamamlandı.' : 'Bu ders henüz tamamlanmadı.'}</span>
      </div>
    </article>
  `;
}

function renderEmptyLessonReader() {
  return `
    <article class="lesson-reader__card">
      <h3>Henüz ders yok</h3>
      <p class="form-note">Bu kursa Firestore üzerinde <code>lessons</code> array alanı ekleyerek ders tanımlayabilirsin.</p>
    </article>
  `;
}

function bindLessonReaderActions(course) {
  els.courseDialogContent.querySelectorAll('[data-complete-lesson]').forEach((button) => {
    button.addEventListener('click', async () => {
      const lessonId = button.dataset.completeLesson;
      const progressForCourse = state.progress.get(course.id) || {};
      await updateLessonProgressUi(course, lessonId, !progressForCourse[lessonId]);
      const lesson = normalizeLessons(course).find((item) => item.id === lessonId);
      if (lesson) {
        els.courseDialogContent.querySelector('#lessonReader').innerHTML = renderLessonReader(course, lesson, state.progress.get(course.id) || {});
        bindLessonReaderActions(course);
      }
    });
  });
}

async function updateLessonProgressUi(course, lessonId, completed) {
  await setLessonProgress(course.id, lessonId, completed);
  const progressForCourse = state.progress.get(course.id) || {};
  progressForCourse[lessonId] = completed;
  state.progress.set(course.id, progressForCourse);

  const row = els.courseDialogContent.querySelector(`[data-lesson-row="${cssEscape(lessonId)}"]`);
  if (row) {
    const input = row.querySelector('input[type="checkbox"]');
    const status = row.querySelector('.lesson-item__actions span');
    if (input) input.checked = completed;
    if (status) status.textContent = completed ? 'Tamamlandı' : 'Bekliyor';
  }

  renderCourses();
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
  const lessons = normalizeLessons(course);
  const progress = state.progress.get(course.id) || {};
  const total = lessons.length;
  if (!total) return 0;
  const done = lessons.filter((lesson) => progress[lesson.id]).length;
  return Math.round((done / total) * 100);
}

function normalizeLessons(course) {
  return Array.isArray(course.lessons)
    ? [...course.lessons]
        .map((lesson, index) => ({
          ...lesson,
          id: String(lesson?.id || `ders-${index + 1}`),
          title: lesson?.title || `Ders ${index + 1}`,
          order: Number.isFinite(Number(lesson?.order)) ? Number(lesson.order) : index + 1
        }))
        .sort((a, b) => a.order - b.order)
    : [];
}

function normalizeTextBlocks(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split('\n').map((item) => item.trim()).filter(Boolean);
  return [];
}

function hasReadableLessonContent(lesson) {
  return normalizeTextBlocks(lesson.content).length || normalizeTextBlocks(lesson.example).length;
}

function renderResourceLink(resource) {
  if (typeof resource === 'string') {
    return `<li>${escapeHtml(resource)}</li>`;
  }

  const title = resource.title || resource.label || resource.url || 'Kaynak';
  if (resource.url) {
    return `<li><a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></li>`;
  }

  return `<li>${escapeHtml(title)}</li>`;
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
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
