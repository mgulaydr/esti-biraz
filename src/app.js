import { demoArticles, demoCourses, demoMetrics } from './content.js';
import {
  deleteArticle,
  deleteCourse,
  deleteCourseLesson,
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
  saveCourse,
  saveCourseLesson,
  saveNewsletterEmail,
  setLessonProgress,
  slugify,
  subscribeAuth
} from './firebase-service.js';

const state = {
  articles: [],
  courses: [],
  activeCategory: 'Tümü',
  query: '',
  progress: new Map(),
  firebaseEnabled: false,
  activeAdminTab: 'articles'
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
  adminTabs: document.querySelectorAll('[data-admin-tab]'),
  adminPanels: document.querySelectorAll('[data-admin-panel]'),
  adminArticleForm: document.querySelector('#adminArticleForm'),
  adminArticleSelect: document.querySelector('#adminArticleSelect'),
  adminNewArticleButton: document.querySelector('#adminNewArticleButton'),
  adminDeleteArticleButton: document.querySelector('#adminDeleteArticleButton'),
  adminCourseForm: document.querySelector('#adminCourseForm'),
  adminCourseSelect: document.querySelector('#adminCourseSelect'),
  adminCourseSelectForLesson: document.querySelector('#adminCourseSelectForLesson'),
  adminNewCourseButton: document.querySelector('#adminNewCourseButton'),
  adminDeleteCourseButton: document.querySelector('#adminDeleteCourseButton'),
  adminLessonForm: document.querySelector('#adminLessonForm'),
  adminLessonSelect: document.querySelector('#adminLessonSelect'),
  adminNewLessonButton: document.querySelector('#adminNewLessonButton'),
  adminDeleteLessonButton: document.querySelector('#adminDeleteLessonButton'),
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

  await reloadContent();
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
    renderAdminPanel();
  });
}

async function reloadContent() {
  state.articles = sortByDate(await loadCollection('articles', demoArticles));
  state.courses = sortCourses(await loadCollection('courses', demoCourses));
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
  els.openAdminButton.addEventListener('click', () => {
    renderAdminPanel();
    els.adminDialog.showModal();
  });

  els.authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await runAuthAction('login');
  });

  els.registerButton.addEventListener('click', async () => runAuthAction('register'));
  els.logoutButton.addEventListener('click', async () => {
    await logout();
    els.authDialog.close();
  });

  els.adminTabs.forEach((button) => {
    button.addEventListener('click', () => {
      state.activeAdminTab = button.dataset.adminTab;
      renderAdminTabs();
    });
  });

  els.adminArticleForm?.addEventListener('submit', handleAdminArticleSubmit);
  els.adminArticleSelect?.addEventListener('change', () => fillArticleForm(els.adminArticleSelect.value));
  els.adminNewArticleButton?.addEventListener('click', clearArticleForm);
  els.adminDeleteArticleButton?.addEventListener('click', handleAdminArticleDelete);

  els.adminCourseForm?.addEventListener('submit', handleAdminCourseSubmit);
  els.adminCourseSelect?.addEventListener('change', () => fillCourseForm(els.adminCourseSelect.value));
  els.adminNewCourseButton?.addEventListener('click', clearCourseForm);
  els.adminDeleteCourseButton?.addEventListener('click', handleAdminCourseDelete);

  els.adminCourseSelectForLesson?.addEventListener('change', () => {
    populateLessonSelect();
    clearLessonForm({ keepCourse: true });
  });
  els.adminLessonSelect?.addEventListener('change', () => fillLessonForm(els.adminCourseSelectForLesson.value, els.adminLessonSelect.value));
  els.adminNewLessonButton?.addEventListener('click', () => clearLessonForm({ keepCourse: true }));
  els.adminDeleteLessonButton?.addEventListener('click', handleAdminLessonDelete);
  els.adminLessonForm?.addEventListener('submit', handleAdminLessonSubmit);

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
  const categories = ['Tümü', ...new Set(state.articles.map((article) => article.category).filter(Boolean))];
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
    fragment.querySelector('.article-card__category').textContent = article.category || 'Genel';
    fragment.querySelector('h3').textContent = article.title || 'Başlıksız yazı';
    fragment.querySelector('p').textContent = article.summary || 'Bu yazı için özet eklenmedi.';
    fragment.querySelector('.article-card__meta').textContent = `${formatDate(article.publishedAt)} • ${article.readingMinutes || 3} dk okuma`;
    button.addEventListener('click', () => openArticle(article));
    els.articleList.append(fragment);
  });
}

function openArticle(article) {
  const blocks = getArticleBlocks(article);
  els.articleDialogContent.innerHTML = `
    <p class="article-dialog__category">${escapeHtml(article.category || 'Genel')}</p>
    <h2 id="articleDialogTitle">${escapeHtml(article.title || 'Başlıksız yazı')}</h2>
    <p class="form-note">${formatDate(article.publishedAt)} • ${(article.tags || []).map(escapeHtml).join(' • ')}</p>
    <div class="rich-content">${renderContentBlocks(blocks)}</div>
  `;
  bindRichContentInteractions(els.articleDialogContent);
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

  const visibleCourses = state.courses.filter((course) => isAdminUser() || !course.status || course.status === 'published');

  visibleCourses.forEach((course) => {
    const lessons = normalizeLessons(course);
    const progress = calculateCoursePercent(course);
    const fragment = template.content.cloneNode(true);
    fragment.querySelector('.course-card__topline').textContent = course.category || 'Akademi';
    fragment.querySelector('h3').textContent = course.title || 'Başlıksız kurs';
    fragment.querySelector('p').textContent = course.summary || 'Bu kurs için henüz özet eklenmedi.';
    fragment.querySelector('progress').value = progress;
    fragment.querySelector('button').textContent = progress ? `Devam et • %${progress}` : 'Derse başla';
    fragment.querySelector('button').disabled = !lessons.length;
    fragment.querySelector('button').addEventListener('click', () => openCourse(course));
    els.courseList.append(fragment);
  });

  if (!visibleCourses.length) {
    els.courseList.innerHTML = '<p class="form-note">Henüz yayınlanmış kurs eklenmedi.</p>';
  }
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
      bindRichContentInteractions(els.courseDialogContent.querySelector('#lessonReader'));
      bindLessonReaderActions(course);
    });
  });

  bindRichContentInteractions(els.courseDialogContent);
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
  const blocks = getLessonBlocks(lesson);
  const resources = Array.isArray(lesson.resources) ? lesson.resources.filter(Boolean) : [];
  const completed = Boolean(progress[lesson.id]);

  return `
    <article class="lesson-reader__card">
      <p class="lesson-reader__eyebrow">${escapeHtml(course.title || 'Kurs')}</p>
      <h3>${escapeHtml(lesson.title || 'Başlıksız ders')}</h3>
      <div class="course-meta-row">
        ${lesson.type ? `<span>${escapeHtml(lesson.type)}</span>` : ''}
        ${lesson.durationMinutes ? `<span>Tahmini süre: ${escapeHtml(lesson.durationMinutes)} dakika</span>` : ''}
      </div>

      <div class="rich-content">
        ${blocks.length
          ? renderContentBlocks(blocks)
          : '<p class="form-note">Bu ders için henüz ayrıntılı içerik eklenmemiş. Yönetim panelinde bu derse <code>contentBlocks</code> veya eski <code>content</code> alanı ekleyebilirsin.</p>'}
      </div>

      ${resources.length && !blocks.some((block) => block.type === 'resource') ? `
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
        bindRichContentInteractions(els.courseDialogContent.querySelector('#lessonReader'));
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

function renderAdminPanel() {
  if (!els.adminDialog) return;
  renderAdminTabs();
  populateArticleSelect();
  populateCourseSelects();
  if (!els.adminArticleForm?.dataset.loaded) clearArticleForm();
  if (!els.adminCourseForm?.dataset.loaded) clearCourseForm();
  populateLessonSelect();
  if (!els.adminLessonForm?.dataset.loaded) clearLessonForm({ keepCourse: true });
}

function renderAdminTabs() {
  els.adminTabs.forEach((button) => {
    const active = button.dataset.adminTab === state.activeAdminTab;
    button.setAttribute('aria-pressed', String(active));
  });

  els.adminPanels.forEach((panel) => {
    panel.hidden = panel.dataset.adminPanel !== state.activeAdminTab;
  });
}

function populateArticleSelect() {
  if (!els.adminArticleSelect) return;
  const currentValue = els.adminArticleSelect.value;
  els.adminArticleSelect.innerHTML = '<option value="">Yeni yazı oluştur</option>';
  state.articles.forEach((article) => {
    const option = document.createElement('option');
    option.value = article.id;
    option.textContent = article.title || article.id;
    els.adminArticleSelect.append(option);
  });
  els.adminArticleSelect.value = state.articles.some((article) => article.id === currentValue) ? currentValue : '';
}

function clearArticleForm() {
  if (!els.adminArticleForm) return;
  els.adminArticleForm.reset();
  els.adminArticleForm.dataset.articleId = '';
  els.adminArticleForm.dataset.loaded = 'true';
  if (els.adminArticleSelect) els.adminArticleSelect.value = '';
  setFormField(els.adminArticleForm, 'publishedAt', new Date().toISOString().slice(0, 10));
  setFormField(els.adminArticleForm, 'contentBlocksText', '');
  setAdminNote('Yeni yazı hazır. Başlık yazınca Firestore’da slug otomatik oluşur. Zengin bloklar boşsa düz içerik kullanılır.');
}

function fillArticleForm(articleId) {
  if (!els.adminArticleForm) return;
  if (!articleId) {
    clearArticleForm();
    return;
  }

  const article = state.articles.find((item) => item.id === articleId);
  if (!article) return;
  els.adminArticleForm.dataset.articleId = article.id;
  els.adminArticleForm.dataset.loaded = 'true';
  setFormField(els.adminArticleForm, 'title', article.title);
  setFormField(els.adminArticleForm, 'category', article.category);
  setFormField(els.adminArticleForm, 'summary', article.summary);
  setFormField(els.adminArticleForm, 'body', normalizeTextBlocks(article.body).join('\n\n'));
  setFormField(els.adminArticleForm, 'contentBlocksText', blocksToEditorText(article.contentBlocks || []));
  setFormField(els.adminArticleForm, 'tags', Array.isArray(article.tags) ? article.tags.join(', ') : '');
  setFormField(els.adminArticleForm, 'publishedAt', article.publishedAt || new Date().toISOString().slice(0, 10));
  setAdminNote(`“${article.title}” düzenleniyor.`);
}

async function handleAdminArticleSubmit(event) {
  event.preventDefault();
  const data = new FormData(els.adminArticleForm);
  const body = splitParagraphs(data.get('body'));
  const contentBlocks = parseContentBlocksText(data.get('contentBlocksText'));
  const payload = {
    id: els.adminArticleForm.dataset.articleId || undefined,
    title: data.get('title'),
    category: data.get('category'),
    summary: data.get('summary'),
    body,
    contentBlocks,
    tags: String(data.get('tags') || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    readingMinutes: Math.max(2, Math.ceil(body.join(' ').length / 850)),
    publishedAt: data.get('publishedAt') || new Date().toISOString().slice(0, 10)
  };

  try {
    const saved = await saveArticle(payload);
    state.articles = sortByDate([saved, ...state.articles.filter((article) => article.id !== saved.id)]);
    els.adminArticleForm.dataset.articleId = saved.id;
    renderCategoryFilters();
    renderArticles();
    populateArticleSelect();
    els.adminArticleSelect.value = saved.id;
    setAdminNote('Yazı kaydedildi.');
  } catch (error) {
    setAdminNote(error.message);
  }
}

async function handleAdminArticleDelete() {
  const articleId = els.adminArticleForm?.dataset.articleId;
  if (!articleId) {
    setAdminNote('Silmek için önce bir yazı seç.');
    return;
  }
  const article = state.articles.find((item) => item.id === articleId);
  if (!confirm(`“${article?.title || articleId}” yazısı silinsin mi?`)) return;

  try {
    await deleteArticle(articleId);
    state.articles = state.articles.filter((item) => item.id !== articleId);
    renderCategoryFilters();
    renderArticles();
    populateArticleSelect();
    clearArticleForm();
    setAdminNote('Yazı silindi.');
  } catch (error) {
    setAdminNote(error.message);
  }
}

function populateCourseSelects() {
  const previousCourseValue = els.adminCourseSelect?.value;
  const previousLessonCourseValue = els.adminCourseSelectForLesson?.value;

  [els.adminCourseSelect, els.adminCourseSelectForLesson].forEach((select) => {
    if (!select) return;
    const placeholder = select === els.adminCourseSelect ? 'Yeni kurs oluştur' : 'Ders eklenecek kursu seç';
    select.innerHTML = `<option value="">${placeholder}</option>`;
    state.courses.forEach((course) => {
      const option = document.createElement('option');
      option.value = course.id;
      option.textContent = course.title || course.id;
      select.append(option);
    });
  });

  if (els.adminCourseSelect) {
    els.adminCourseSelect.value = state.courses.some((course) => course.id === previousCourseValue) ? previousCourseValue : '';
  }
  if (els.adminCourseSelectForLesson) {
    const fallback = state.courses[0]?.id || '';
    els.adminCourseSelectForLesson.value = state.courses.some((course) => course.id === previousLessonCourseValue)
      ? previousLessonCourseValue
      : fallback;
  }
}

function clearCourseForm() {
  if (!els.adminCourseForm) return;
  els.adminCourseForm.reset();
  els.adminCourseForm.dataset.courseId = '';
  els.adminCourseForm.dataset.loaded = 'true';
  if (els.adminCourseSelect) els.adminCourseSelect.value = '';
  setFormField(els.adminCourseForm, 'status', 'published');
  setFormField(els.adminCourseForm, 'level', 'Başlangıç');
  setAdminNote('Yeni kurs hazır. Dersleri ayrı Dersler sekmesinden eklersin.');
}

function fillCourseForm(courseId) {
  if (!els.adminCourseForm) return;
  if (!courseId) {
    clearCourseForm();
    return;
  }

  const course = state.courses.find((item) => item.id === courseId);
  if (!course) return;
  els.adminCourseForm.dataset.courseId = course.id;
  els.adminCourseForm.dataset.loaded = 'true';
  setFormField(els.adminCourseForm, 'title', course.title);
  setFormField(els.adminCourseForm, 'category', course.category);
  setFormField(els.adminCourseForm, 'summary', course.summary);
  setFormField(els.adminCourseForm, 'instructor', course.instructor);
  setFormField(els.adminCourseForm, 'level', course.level || 'Başlangıç');
  setFormField(els.adminCourseForm, 'status', course.status || 'published');
  setFormField(els.adminCourseForm, 'featured', Boolean(course.featured));
  setAdminNote(`“${course.title}” kursu düzenleniyor.`);
}

async function handleAdminCourseSubmit(event) {
  event.preventDefault();
  const data = new FormData(els.adminCourseForm);
  const courseId = els.adminCourseForm.dataset.courseId;
  const existing = state.courses.find((course) => course.id === courseId);
  const payload = {
    id: courseId || undefined,
    title: data.get('title'),
    category: data.get('category'),
    summary: data.get('summary'),
    instructor: data.get('instructor'),
    level: data.get('level'),
    status: data.get('status') || 'published',
    featured: data.get('featured') === 'on',
    lessons: existing?.lessons || []
  };

  try {
    const saved = await saveCourse(payload);
    upsertCourse(saved);
    await refreshAllCourseProgress();
    renderCourses();
    populateCourseSelects();
    els.adminCourseForm.dataset.courseId = saved.id;
    els.adminCourseSelect.value = saved.id;
    els.adminCourseSelectForLesson.value = saved.id;
    populateLessonSelect();
    setAdminNote('Kurs kaydedildi.');
  } catch (error) {
    setAdminNote(error.message);
  }
}

async function handleAdminCourseDelete() {
  const courseId = els.adminCourseForm?.dataset.courseId;
  if (!courseId) {
    setAdminNote('Silmek için önce bir kurs seç.');
    return;
  }
  const course = state.courses.find((item) => item.id === courseId);
  if (!confirm(`“${course?.title || courseId}” kursu silinsin mi? Kullanıcı ilerleme kayıtları ayrıca silinmez.`)) return;

  try {
    await deleteCourse(courseId);
    state.courses = state.courses.filter((item) => item.id !== courseId);
    state.progress.delete(courseId);
    renderCourses();
    populateCourseSelects();
    populateLessonSelect();
    clearCourseForm();
    clearLessonForm({ keepCourse: true });
    setAdminNote('Kurs silindi.');
  } catch (error) {
    setAdminNote(error.message);
  }
}

function populateLessonSelect() {
  if (!els.adminLessonSelect) return;
  const course = state.courses.find((item) => item.id === els.adminCourseSelectForLesson?.value);
  const previous = els.adminLessonSelect.value;
  els.adminLessonSelect.innerHTML = '<option value="">Yeni ders oluştur</option>';
  normalizeLessons(course || {}).forEach((lesson) => {
    const option = document.createElement('option');
    option.value = lesson.id;
    option.textContent = `${lesson.order}. ${lesson.title}`;
    els.adminLessonSelect.append(option);
  });
  els.adminLessonSelect.value = normalizeLessons(course || {}).some((lesson) => lesson.id === previous) ? previous : '';
}

function clearLessonForm({ keepCourse = false } = {}) {
  if (!els.adminLessonForm) return;
  const selectedCourse = els.adminCourseSelectForLesson?.value || '';
  els.adminLessonForm.reset();
  els.adminLessonForm.dataset.lessonId = '';
  els.adminLessonForm.dataset.loaded = 'true';
  if (keepCourse && els.adminCourseSelectForLesson) els.adminCourseSelectForLesson.value = selectedCourse;
  if (els.adminLessonSelect) els.adminLessonSelect.value = '';
  setFormField(els.adminLessonForm, 'type', 'Okuma');
  const nextOrder = normalizeLessons(state.courses.find((course) => course.id === selectedCourse) || {}).length + 1;
  setFormField(els.adminLessonForm, 'order', nextOrder);
  setFormField(els.adminLessonForm, 'contentBlocksText', '');
  setAdminNote('Yeni ders hazır. İstersen düz alanları, istersen zengin içerik bloklarını kullanabilirsin.');
}

function fillLessonForm(courseId, lessonId) {
  if (!els.adminLessonForm) return;
  if (!courseId || !lessonId) {
    clearLessonForm({ keepCourse: true });
    return;
  }

  const course = state.courses.find((item) => item.id === courseId);
  const lesson = normalizeLessons(course || {}).find((item) => item.id === lessonId);
  if (!lesson) return;
  els.adminLessonForm.dataset.lessonId = lesson.id;
  els.adminLessonForm.dataset.loaded = 'true';
  setFormField(els.adminLessonForm, 'title', lesson.title);
  setFormField(els.adminLessonForm, 'order', lesson.order);
  setFormField(els.adminLessonForm, 'durationMinutes', lesson.durationMinutes || '');
  setFormField(els.adminLessonForm, 'type', lesson.type || 'Okuma');
  setFormField(els.adminLessonForm, 'content', normalizeTextBlocks(lesson.content).join('\n\n'));
  setFormField(els.adminLessonForm, 'keyPoints', Array.isArray(lesson.keyPoints) ? lesson.keyPoints.join('\n') : '');
  setFormField(els.adminLessonForm, 'example', normalizeTextBlocks(lesson.example).join('\n\n'));
  setFormField(els.adminLessonForm, 'resources', resourcesToText(lesson.resources));
  setFormField(els.adminLessonForm, 'contentBlocksText', blocksToEditorText(lesson.contentBlocks || []));
  setAdminNote(`“${lesson.title}” dersi düzenleniyor.`);
}

async function handleAdminLessonSubmit(event) {
  event.preventDefault();
  const courseId = els.adminCourseSelectForLesson?.value;
  if (!courseId) {
    setAdminNote('Ders kaydetmek için önce kurs seç.');
    return;
  }

  const data = new FormData(els.adminLessonForm);
  const lesson = {
    id: els.adminLessonForm.dataset.lessonId || undefined,
    title: data.get('title'),
    order: Number(data.get('order') || 1),
    durationMinutes: Number(data.get('durationMinutes') || 0) || null,
    type: data.get('type') || 'Okuma',
    content: splitParagraphs(data.get('content')),
    keyPoints: splitLines(data.get('keyPoints')),
    example: splitParagraphs(data.get('example')),
    resources: parseResources(data.get('resources')),
    contentBlocks: parseContentBlocksText(data.get('contentBlocksText'))
  };

  try {
    const updatedCourse = await saveCourseLesson(courseId, lesson);
    upsertCourse(updatedCourse);
    await refreshAllCourseProgress();
    renderCourses();
    populateCourseSelects();
    els.adminCourseSelectForLesson.value = courseId;
    populateLessonSelect();
    const savedLessonId = slugify(lesson.id || lesson.title);
    els.adminLessonForm.dataset.lessonId = savedLessonId;
    els.adminLessonSelect.value = savedLessonId;
    setAdminNote('Ders kaydedildi.');
  } catch (error) {
    setAdminNote(error.message);
  }
}

async function handleAdminLessonDelete() {
  const courseId = els.adminCourseSelectForLesson?.value;
  const lessonId = els.adminLessonForm?.dataset.lessonId || els.adminLessonSelect?.value;
  if (!courseId || !lessonId) {
    setAdminNote('Silmek için önce kurs ve ders seç.');
    return;
  }
  const course = state.courses.find((item) => item.id === courseId);
  const lesson = normalizeLessons(course || {}).find((item) => item.id === lessonId);
  if (!confirm(`“${lesson?.title || lessonId}” dersi silinsin mi?`)) return;

  try {
    const updatedCourse = await deleteCourseLesson(courseId, lessonId);
    upsertCourse(updatedCourse);
    renderCourses();
    populateCourseSelects();
    els.adminCourseSelectForLesson.value = courseId;
    populateLessonSelect();
    clearLessonForm({ keepCourse: true });
    setAdminNote('Ders silindi.');
  } catch (error) {
    setAdminNote(error.message);
  }
}

function setAdminNote(message) {
  if (els.adminNote) els.adminNote.textContent = message;
}

function setFormField(form, name, value) {
  const field = form?.elements?.[name];
  if (!field) return;
  if (field.type === 'checkbox') field.checked = Boolean(value);
  else field.value = value ?? '';
}

function upsertCourse(course) {
  state.courses = sortCourses([course, ...state.courses.filter((item) => item.id !== course.id)]);
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
  return Array.isArray(course?.lessons)
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

function splitParagraphs(value) {
  return String(value || '')
    .split(/\n{2,}|\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseResources(value) {
  return splitLines(value).map((line) => {
    const [title, url] = line.split('|').map((part) => part.trim());
    if (url) return { title, url };
    if (/^https?:\/\//i.test(title)) return { title, url: title };
    return title;
  });
}

function resourcesToText(resources) {
  if (!Array.isArray(resources)) return '';
  return resources.map((resource) => {
    if (typeof resource === 'string') return resource;
    return [resource.title, resource.url].filter(Boolean).join(' | ');
  }).join('\n');
}

function hasReadableLessonContent(lesson) {
  return getLessonBlocks(lesson).length;
}



function getArticleBlocks(article) {
  if (Array.isArray(article?.contentBlocks) && article.contentBlocks.length) return article.contentBlocks;
  return normalizeTextBlocks(article?.body).map((text) => ({ type: 'paragraph', text }));
}

function getLessonBlocks(lesson) {
  if (Array.isArray(lesson?.contentBlocks) && lesson.contentBlocks.length) return lesson.contentBlocks;

  const blocks = normalizeTextBlocks(lesson?.content).map((text) => ({ type: 'paragraph', text }));
  const keyPoints = Array.isArray(lesson?.keyPoints) ? lesson.keyPoints.filter(Boolean) : [];
  const exampleBlocks = normalizeTextBlocks(lesson?.example);
  const resources = Array.isArray(lesson?.resources) ? lesson.resources.filter(Boolean) : [];

  if (keyPoints.length) blocks.push({ type: 'callout', tone: 'success', title: 'Kısa özet', text: keyPoints.join('\n') });
  exampleBlocks.forEach((text) => blocks.push({ type: 'callout', tone: 'info', title: 'Örnek', text }));
  resources.forEach((resource) => {
    if (typeof resource === 'string') blocks.push({ type: 'resource', title: resource, url: /^https?:\/\//i.test(resource) ? resource : '' });
    else blocks.push({ type: 'resource', title: resource.title || resource.label || 'Kaynak', url: resource.url || '' });
  });
  return blocks;
}

function renderContentBlocks(blocks = []) {
  return blocks.map((block) => renderContentBlock(block)).join('');
}

function renderContentBlock(block) {
  const type = String(block?.type || 'paragraph').toLowerCase();

  if (type === 'heading') return `<h3 class="content-heading">${escapeHtml(block.text || block.title || '')}</h3>`;
  if (type === 'paragraph') return `<p>${escapeHtml(block.text || '')}</p>`;
  if (type === 'quote') return `<blockquote class="content-quote"><p>${escapeHtml(block.text || '')}</p>${block.source ? `<cite>${escapeHtml(block.source)}</cite>` : ''}</blockquote>`;

  if (type === 'callout') {
    const tone = ['info', 'warning', 'success', 'data', 'source', 'exam'].includes(block.tone) ? block.tone : 'info';
    const text = normalizeTextBlocks(block.text).length ? normalizeTextBlocks(block.text) : [block.text || ''];
    return `<aside class="content-callout content-callout--${tone}">${block.title ? `<strong>${escapeHtml(block.title)}</strong>` : ''}${text.filter(Boolean).map((item) => `<p>${escapeHtml(item)}</p>`).join('')}</aside>`;
  }

  if (type === 'list') {
    const items = Array.isArray(block.items) ? block.items : normalizeTextBlocks(block.text);
    return `<ul class="content-list">${items.filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }

  if (type === 'image') {
    if (!isSafeUrl(block.url)) return '';
    return `<figure class="content-image"><img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt || block.title || '')}" loading="lazy" />${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''}</figure>`;
  }

  if (type === 'youtube' || type === 'video') {
    const embedUrl = getYouTubeEmbedUrl(block.url || block.videoId);
    if (!embedUrl) return `<p class="form-note">Geçersiz YouTube bağlantısı.</p>`;
    return `<figure class="content-embed content-embed--video">${block.title ? `<figcaption>${escapeHtml(block.title)}</figcaption>` : ''}<iframe src="${escapeHtml(embedUrl)}" title="${escapeHtml(block.title || 'YouTube video')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></figure>`;
  }

  if (type === 'pdf') {
    if (!isSafeUrl(block.url)) return '';
    return `<figure class="content-embed content-embed--pdf"><figcaption>${escapeHtml(block.title || 'PDF belge')}</figcaption><iframe src="${escapeHtml(block.url)}" title="${escapeHtml(block.title || 'PDF belge')}" loading="lazy"></iframe><p><a href="${escapeHtml(block.url)}" target="_blank" rel="noopener noreferrer">PDF’i yeni sekmede aç</a></p></figure>`;
  }

  if (type === 'resource') {
    const title = block.title || block.label || block.url || 'Kaynak';
    return `<p class="content-resource">Kaynak: ${block.url && isSafeUrl(block.url) ? `<a href="${escapeHtml(block.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>` : escapeHtml(title)}</p>`;
  }

  if (type === 'quiz') {
    const options = Array.isArray(block.options) ? block.options : [];
    const correctIndex = Number(block.correctIndex);
    return `<section class="content-quiz" data-quiz><strong>${escapeHtml(block.question || 'Mini soru')}</strong><div class="content-quiz__options">${options.map((option, index) => `<button type="button" data-quiz-option="${index}" data-correct="${index === correctIndex}">${escapeHtml(option)}</button>`).join('')}</div>${block.explanation ? `<p class="content-quiz__explanation" hidden>${escapeHtml(block.explanation)}</p>` : ''}</section>`;
  }

  return `<p>${escapeHtml(block.text || JSON.stringify(block))}</p>`;
}

function bindRichContentInteractions(root = document) {
  root.querySelectorAll('[data-quiz]').forEach((quiz) => {
    quiz.querySelectorAll('[data-quiz-option]').forEach((button) => {
      button.addEventListener('click', () => {
        quiz.querySelectorAll('[data-quiz-option]').forEach((item) => { item.disabled = true; });
        button.dataset.selected = 'true';
        button.dataset.result = button.dataset.correct === 'true' ? 'correct' : 'wrong';
        const explanation = quiz.querySelector('.content-quiz__explanation');
        if (explanation) explanation.hidden = false;
      });
    });
  });
}

function parseContentBlocksText(value) {
  const text = String(value || '').trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed.map(cleanContentBlock).filter(Boolean) : [];
    } catch (error) {
      throw new Error(`Zengin içerik JSON okunamadı: ${error.message}`);
    }
  }
  return text.split(/\n\s*\n/g).map((chunk) => parseContentChunk(chunk.trim())).filter(Boolean);
}

function parseContentChunk(chunk) {
  if (!chunk) return null;
  const lines = chunk.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const first = lines[0] || '';
  if (/^##\s+/.test(first)) return { type: 'heading', text: first.replace(/^##\s+/, '').trim() };
  if (/^>\s+/.test(first)) return { type: 'quote', text: lines.map((line) => line.replace(/^>\s?/, '')).join('\n') };

  const callout = first.match(/^\[!(info|warning|success|data|source|exam)\]\s*(.*)$/i);
  if (callout) return { type: 'callout', tone: callout[1].toLowerCase(), title: callout[2] || toneTitle(callout[1]), text: lines.slice(1).join('\n') };

  const lower = first.toLowerCase();
  if (lower.startsWith('youtube:') || lower.startsWith('video:')) {
    const value = first.replace(/^(youtube|video):/i, '');
    const [url, title] = splitPipe(value);
    return { type: 'youtube', url, title };
  }
  if (lower.startsWith('pdf:')) {
    const value = first.replace(/^pdf:/i, '');
    const [title, url] = splitPipe(value);
    return { type: 'pdf', title: title || 'PDF', url };
  }
  if (lower.startsWith('image:') || lower.startsWith('resim:')) {
    const value = first.replace(/^(image|resim):/i, '');
    const [url, alt, caption] = splitPipe(value);
    return { type: 'image', url, alt, caption };
  }
  if (lower.startsWith('resource:') || lower.startsWith('kaynak:')) {
    const value = first.replace(/^(resource|kaynak):/i, '');
    const [title, url] = splitPipe(value);
    return { type: 'resource', title, url };
  }
  if (lower.startsWith('quiz:') || lower.startsWith('soru:')) return parseQuizChunk(lines);
  if (lines.every((line) => /^[-*]\s+/.test(line))) return { type: 'list', items: lines.map((line) => line.replace(/^[-*]\s+/, '')) };
  return { type: 'paragraph', text: lines.join('\n') };
}

function parseQuizChunk(lines) {
  const question = lines[0].replace(/^(quiz|soru):\s*/i, '').trim();
  const options = [];
  let correctIndex = -1;
  let explanation = '';
  lines.slice(1).forEach((line) => {
    const option = line.match(/^([A-Ea-e])\)\s*(.*)$/);
    if (option) { options.push(option[2].trim()); return; }
    const correct = line.match(/^(correct|dogru|doğru):\s*([A-Ea-e0-9]+)/i);
    if (correct) {
      const value = correct[2].trim().toUpperCase();
      correctIndex = /^[A-E]$/.test(value) ? value.charCodeAt(0) - 65 : Number(value);
      return;
    }
    const exp = line.match(/^(explanation|açıklama|aciklama):\s*(.*)$/i);
    if (exp) explanation = exp[2].trim();
  });
  return { type: 'quiz', question, options, correctIndex, explanation };
}

function blocksToEditorText(blocks) {
  if (!Array.isArray(blocks) || !blocks.length) return '';
  return blocks.map((block) => {
    const type = String(block?.type || 'paragraph').toLowerCase();
    if (type === 'heading') return `## ${block.text || block.title || ''}`;
    if (type === 'paragraph') return block.text || '';
    if (type === 'quote') return `> ${block.text || ''}`;
    if (type === 'callout') return `[!${block.tone || 'info'}] ${block.title || ''}\n${block.text || ''}`;
    if (type === 'list') return (block.items || []).map((item) => `- ${item}`).join('\n');
    if (type === 'youtube' || type === 'video') return `youtube: ${[block.url, block.title].filter(Boolean).join(' | ')}`;
    if (type === 'pdf') return `pdf: ${[block.title, block.url].filter(Boolean).join(' | ')}`;
    if (type === 'image') return `image: ${[block.url, block.alt, block.caption].filter(Boolean).join(' | ')}`;
    if (type === 'resource') return `resource: ${[block.title, block.url].filter(Boolean).join(' | ')}`;
    if (type === 'quiz') {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      const opts = (block.options || []).map((option, index) => `${letters[index]}) ${option}`).join('\n');
      const correct = Number.isFinite(Number(block.correctIndex)) ? `Doğru: ${letters[Number(block.correctIndex)] || block.correctIndex}` : '';
      const explanation = block.explanation ? `Açıklama: ${block.explanation}` : '';
      return [`Soru: ${block.question || ''}`, opts, correct, explanation].filter(Boolean).join('\n');
    }
    return JSON.stringify(block, null, 2);
  }).join('\n\n');
}

function cleanContentBlock(block) {
  if (!block || typeof block !== 'object') return null;
  const type = String(block.type || 'paragraph').toLowerCase();
  return { ...block, type };
}

function splitPipe(value = '') {
  return String(value).split('|').map((part) => part.trim());
}

function toneTitle(tone) {
  return ({ info: 'Bilgi', warning: 'Dikkat', success: 'Akılda kalsın', data: 'Veriyle bak', source: 'Kaynak kontrolü', exam: 'Sınav notu' })[String(tone).toLowerCase()] || 'Not';
}

function getYouTubeEmbedUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return `https://www.youtube.com/embed/${raw}`;
  try {
    const url = new URL(raw);
    let id = '';
    if (url.hostname.includes('youtu.be')) id = url.pathname.replace('/', '').split('/')[0];
    else if (url.hostname.includes('youtube.com')) id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
    if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`;
  } catch (_) {
    return '';
  }
  return '';
}

function isSafeUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol);
  } catch (_) {
    return false;
  }
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

function sortCourses(items) {
  return [...items].sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'tr-TR'));
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
