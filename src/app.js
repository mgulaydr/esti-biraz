/* ESTI BIRAZ RECOVERY STAGE8-FREE V2 - app.js */
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
  saveQuizAttempt,
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
  activeAdminTab: 'articles',
  lastRouteHash: ''
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
  handleHashRoute();

  subscribeAuth(async (user) => {
    updateAuthUi(user);
    await refreshAllCourseProgress();
    renderCourses();
    renderAdminPanel();
    handleHashRoute();
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

  setupBlockEditors();
  window.addEventListener('hashchange', handleHashRoute);

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
    button.addEventListener('click', () => navigateToArticle(article));
    els.articleList.append(fragment);
  });
}

function navigateToArticle(article) {
  const id = article?.id || article?.slug || slugify(article?.title || '');
  const nextHash = `#yazi/${encodeURIComponent(id)}`;
  if (window.location.hash === nextHash) openArticle(article);
  else window.location.hash = nextHash;
}

function navigateToCourse(course) {
  const id = course?.id || course?.slug || slugify(course?.title || '');
  const nextHash = courseHash(id);
  if (window.location.hash === nextHash) openCourse(course);
  else window.location.hash = nextHash;
}

function courseHash(courseId) {
  return `#kurs/${encodeURIComponent(courseId)}`;
}

function lessonHash(courseId, lessonId) {
  return `#ders/${encodeURIComponent(courseId)}/${encodeURIComponent(lessonId)}`;
}

function handleHashRoute() {
  const hash = window.location.hash || '';
  if (!hash || hash === state.lastRouteHash) return;
  state.lastRouteHash = hash;

  const parts = hash.replace(/^#/, '').split('/').map((part) => decodeURIComponent(part));
  const [type, firstId, secondId] = parts;

  if (type === 'yazi' && firstId) {
    const article = state.articles.find((item) => [item.id, item.slug, slugify(item.title)].includes(firstId));
    if (article) openArticle(article);
  }

  if (type === 'kurs' && firstId) {
    const course = state.courses.find((item) => [item.id, item.slug, slugify(item.title)].includes(firstId));
    if (course) openCourse(course);
  }

  if (type === 'ders' && firstId && secondId) {
    const course = state.courses.find((item) => [item.id, item.slug, slugify(item.title)].includes(firstId));
    if (!course) return;
    openCourse(course);
    const lesson = normalizeLessons(course).find((item) => item.id === secondId || slugify(item.title) === secondId);
    if (!lesson) return;
    requestAnimationFrame(() => {
      const reader = els.courseDialogContent.querySelector('#lessonReader');
      if (!reader) return;
      reader.innerHTML = renderLessonReader(course, lesson, state.progress.get(course.id) || {});
      bindRichContentInteractions(reader);
      bindLessonReaderActions(course);
    });
  }
}

function openArticle(article) {
  const blocks = getArticleBlocks(article);
  els.articleDialogContent.innerHTML = `
    <p class="article-dialog__category">${escapeHtml(article.category || 'Genel')}</p>
    <h2 id="articleDialogTitle">${escapeHtml(article.title || 'Başlıksız yazı')}</h2>
    <p class="form-note">${formatDate(article.publishedAt)} • ${(article.tags || []).map(escapeHtml).join(' • ')}</p>
    <div class="rich-content">${renderContentBlocks(blocks, { scope: 'article', articleId: article.id || article.slug || article.title })}</div>
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

function renderCourseProgressSummary(course) {
  const lessons = normalizeLessons(course);
  const progress = state.progress.get(course.id) || {};
  const total = lessons.length;
  const done = lessons.filter((lesson) => progress[lesson.id]).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  return `
    <div class="course-progress-summary" data-course-progress-summary>
      <div class="course-progress-summary__row">
        <strong>Kurs ilerlemesi</strong>
        <span>${done}/${total} ders • %${percent}</span>
      </div>
      <progress value="${percent}" max="100">${percent}%</progress>
    </div>
  `;
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
    fragment.querySelector('button').addEventListener('click', () => navigateToCourse(course));
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
      ${renderCourseProgressSummary(course)}
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
      const nextHash = lessonHash(course.id, lesson.id);
      if (window.location.hash !== nextHash) window.location.hash = nextHash;
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
          ? renderContentBlocks(blocks, { scope: 'lesson', courseId: course.id, lessonId: lesson.id })
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


function setupBlockEditors() {
  document.querySelectorAll('textarea[name="contentBlocksText"]').forEach((textarea) => {
    if (textarea.dataset.blockEditorReady === 'true') return;
    textarea.dataset.blockEditorReady = 'true';
    textarea.classList.add('block-editor-source');

    const editor = document.createElement('div');
    editor.className = 'block-editor';
    editor.innerHTML = `
      <div class="block-editor__head">
        <div>
          <strong>${escapeHtml(getBlockEditorTitle(textarea))}</strong>
          <p class="form-note">Form doldurarak blok ekle. Kaydettiğinde alttaki veri <code>contentBlocks</code> olarak Firestore’a gider.</p>
        </div>
        <div class="block-editor__tools">
          <label>
            Blok türü
            <select data-block-add-type>
              ${getBlockTypeOptions('paragraph')}
            </select>
          </label>
          <button class="ghost-button" type="button" data-block-add>Blok ekle</button>
          <button class="ghost-button" type="button" data-block-import>Metinden içe aktar</button>
        </div>
      </div>
      <p class="form-note block-editor__status" data-block-editor-status></p>
      <div class="block-editor__list" data-block-list></div>
      <details class="block-editor__preview-wrap">
        <summary>Önizleme</summary>
        <div class="rich-content block-editor__preview" data-block-preview></div>
      </details>
    `;
    textarea.insertAdjacentElement('afterend', editor);
    editor._textarea = textarea;
    editor._blocks = [];

    editor.addEventListener('click', handleBlockEditorClick);
    editor.addEventListener('input', handleBlockEditorInput);
    editor.addEventListener('change', handleBlockEditorInput);
    textarea.addEventListener('input', () => {
      if (textarea.dataset.blockEditorUpdating === 'true') return;
      syncBlockEditor(textarea);
    });

    syncBlockEditor(textarea);
  });
}

function getBlockEditorTitle(textarea) {
  if (textarea.closest('#adminArticleForm')) return 'Yazı blok editörü';
  if (textarea.closest('#adminLessonForm')) return 'Ders blok editörü';
  return 'Zengin içerik blok editörü';
}

function syncBlockEditorForForm(form) {
  const textarea = form?.elements?.contentBlocksText;
  if (textarea) syncBlockEditor(textarea);
}

function syncBlockEditor(textarea) {
  const editor = getBlockEditor(textarea);
  if (!editor) return;
  const result = safeParseEditorBlocks(textarea.value);
  editor._blocks = result.blocks;
  editor._parseError = result.error;
  renderBlockEditor(editor);
}

function getBlockEditor(textarea) {
  let node = textarea?.nextElementSibling;
  while (node) {
    if (node.classList?.contains('block-editor')) return node;
    node = node.nextElementSibling;
  }
  return null;
}

function safeParseEditorBlocks(value) {
  try {
    return { blocks: parseContentBlocksText(value), error: '' };
  } catch (error) {
    return { blocks: [], error: error.message };
  }
}

function renderBlockEditor(editor) {
  const blocks = Array.isArray(editor._blocks) ? editor._blocks : [];
  const list = editor.querySelector('[data-block-list]');
  const status = editor.querySelector('[data-block-editor-status]');
  if (status) {
    status.textContent = editor._parseError
      ? `Blok metni okunamadı: ${editor._parseError}`
      : blocks.length ? `${blocks.length} blok hazır.` : 'Henüz blok yok. Bir blok türü seçip “Blok ekle” düğmesine bas.';
  }
  if (list) {
    list.innerHTML = blocks.length
      ? blocks.map((block, index) => renderBlockEditorCard(block, index, blocks.length)).join('')
      : '<div class="block-editor__empty">Henüz zengin blok eklenmedi. Düz metin alanları yedek olarak kullanılmaya devam eder.</div>';
  }
  renderBlockEditorPreview(editor);
}

function renderBlockEditorPreview(editor) {
  const preview = editor.querySelector('[data-block-preview]');
  if (!preview) return;
  const blocks = Array.isArray(editor._blocks) ? editor._blocks : [];
  preview.innerHTML = blocks.length
    ? renderContentBlocks(blocks)
    : '<p class="form-note">Önizleme için en az bir blok ekle.</p>';
  bindRichContentInteractions(preview);
}

function renderBlockEditorCard(block, index, total) {
  const type = String(block?.type || 'paragraph').toLowerCase();
  return `
    <article class="block-card" data-block-index="${index}">
      <header class="block-card__head">
        <label>
          Tür
          <select data-block-field="type">
            ${getBlockTypeOptions(type)}
          </select>
        </label>
        <div class="block-card__actions">
          <button class="ghost-button ghost-button--small" type="button" data-block-move="up" ${index === 0 ? 'disabled' : ''}>Yukarı</button>
          <button class="ghost-button ghost-button--small" type="button" data-block-move="down" ${index === total - 1 ? 'disabled' : ''}>Aşağı</button>
          <button class="ghost-button ghost-button--small danger-button" type="button" data-block-delete>Sil</button>
        </div>
      </header>
      <div class="block-card__body">
        ${renderBlockEditorFields(block, type)}
      </div>
    </article>
  `;
}

function renderBlockEditorFields(block, type) {
  if (type === 'heading') {
    return blockInput('Başlık metni', 'text', block.text || block.title || '');
  }
  if (type === 'paragraph') {
    return blockTextarea('Paragraf', 'text', block.text || '', 4);
  }
  if (type === 'quote') {
    return `${blockTextarea('Alıntı', 'text', block.text || '', 4)}${blockInput('Kaynak / kişi', 'source', block.source || '')}`;
  }
  if (type === 'callout') {
    return `
      <div class="block-card__grid">
        <label>Ton
          <select data-block-field="tone">
            ${getToneOptions(block.tone || 'info')}
          </select>
        </label>
        ${blockInput('Başlık', 'title', block.title || toneTitle(block.tone || 'info'))}
      </div>
      ${blockTextarea('Not metni', 'text', block.text || '', 4)}
    `;
  }
  if (type === 'list') {
    const items = Array.isArray(block.items) ? block.items.join('\n') : (block.text || '');
    return blockTextarea('Liste maddeleri; her satır bir madde', 'items', items, 5);
  }
  if (type === 'image') {
    return `
      <p class="form-note">Görsel için herkese açık bir URL kullan. Dosya yükleme ücretsiz Firebase planında kapalıdır.</p>
      ${blockInput('Görsel URL', 'url', block.url || '', 'https://...')}
      <div class="block-card__grid">
        ${blockInput('Alt metin', 'alt', block.alt || '')}
        ${blockInput('Açıklama', 'caption', block.caption || '')}
      </div>
    `;
  }
  if (type === 'youtube' || type === 'video') {
    return `
      ${blockInput('YouTube linki veya video ID', 'url', block.url || block.videoId || '', 'https://www.youtube.com/watch?v=...')}
      ${blockInput('Video başlığı', 'title', block.title || '')}
    `;
  }
  if (type === 'pdf') {
    return `
      <p class="form-note">PDF için herkese açık bir URL kullan. Dosya yükleme ücretsiz Firebase planında kapalıdır.</p>
      ${blockInput('PDF başlığı', 'title', block.title || 'PDF belge')}
      ${blockInput('PDF URL', 'url', block.url || '', 'https://...pdf')}
    `;
  }
  if (type === 'resource') {
    return `
      ${blockInput('Kaynak başlığı', 'title', block.title || block.label || '')}
      ${blockInput('Kaynak URL', 'url', block.url || '', 'https://...')}
    `;
  }
  if (type === 'truefalse') {
    return `
      ${blockTextarea('Doğru / yanlış ifadesi', 'statement', block.statement || block.text || '', 3)}
      <label>Doğru cevap
        <select data-block-field="correct">
          <option value="true" ${block.correct !== false ? 'selected' : ''}>Doğru</option>
          <option value="false" ${block.correct === false ? 'selected' : ''}>Yanlış</option>
        </select>
      </label>
      ${blockTextarea('Açıklama', 'explanation', block.explanation || '', 3)}
    `;
  }
  if (type === 'matching') {
    const pairs = Array.isArray(block.pairs) ? block.pairs.map((pair) => `${pair.left || ''} | ${pair.right || ''}`).join('\n') : '';
    return blockTextarea('Eşleştirme çiftleri; her satır: Sol kavram | Sağ karşılık', 'pairs', pairs, 6);
  }
  if (type === 'code') {
    return `
      ${blockInput('Dil / başlık', 'language', block.language || block.title || 'text')}
      ${blockTextarea('Kod', 'code', block.code || block.text || '', 8)}
    `;
  }
  if (type === 'table') {
    const headers = Array.isArray(block.headers) ? block.headers.join(' | ') : '';
    const rows = Array.isArray(block.rows) ? block.rows.map((row) => (Array.isArray(row) ? row : []).join(' | ')).join('\n') : '';
    return `
      ${blockInput('Tablo başlığı / açıklaması', 'caption', block.caption || block.title || '')}
      ${blockInput('Sütun başlıkları; | ile ayır', 'headers', headers, 'Ölçüt | Değer | Yorum')}
      ${blockTextarea('Satırlar; her satırda hücreleri | ile ayır', 'rows', rows, 6)}
    `;
  }
  if (type === 'infographic') {
    return `
      <div class="block-card__grid">
        ${blockInput('Kart başlığı', 'title', block.title || 'Veriyle bak')}
        ${blockInput('Vurgu değeri', 'value', block.value || '')}
      </div>
      <label>Ton
        <select data-block-field="tone">
          ${getToneOptions(block.tone || 'data')}
        </select>
      </label>
      ${blockTextarea('Açıklama', 'text', block.text || '', 4)}
    `;
  }
  if (type === 'concept') {
    return `
      ${blockInput('Kavram', 'term', block.term || block.title || '')}
      ${blockTextarea('Tanım', 'definition', block.definition || block.text || '', 4)}
      ${blockTextarea('Ek not / örnek', 'note', block.note || '', 3)}
    `;
  }
  if (type === 'glossary') {
    const items = Array.isArray(block.items) ? block.items.map((item) => `${item.term || ''} | ${item.definition || ''}`).join('\n') : '';
    return blockTextarea('Terimler; her satır: Terim | Açıklama', 'items', items, 7);
  }
  if (type === 'objectives' || type === 'outcomes') {
    const items = Array.isArray(block.items) ? block.items.join('\n') : '';
    const label = type === 'objectives' ? 'Ders hedefleri; her satır bir hedef' : 'Ders sonunda kazanımlar; her satır bir kazanım';
    return `${blockInput('Başlık', 'title', block.title || (type === 'objectives' ? 'Ders hedefleri' : 'Ders sonunda kazanımlar'))}${blockTextarea(label, 'items', items, 6)}`;
  }
  if (type === 'quiz') {
    const options = Array.isArray(block.options) ? block.options.join('\n') : '';
    return `
      ${blockTextarea('Soru', 'question', block.question || '', 3)}
      <div class="block-card__grid">
        ${blockTextarea('Seçenekler; her satır bir seçenek', 'options', options, 5)}
        ${blockInput('Doğru seçenek sıra no. 0=A, 1=B, 2=C', 'correctIndex', Number.isFinite(Number(block.correctIndex)) ? String(block.correctIndex) : '0', '0')}
      </div>
      ${blockTextarea('Açıklama', 'explanation', block.explanation || '', 3)}
    `;
  }
  return blockTextarea('Metin', 'text', block.text || '', 4);
}

function blockInput(label, field, value, placeholder = '') {
  return `<label>${escapeHtml(label)} <input data-block-field="${escapeHtml(field)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" /></label>`;
}

function blockTextarea(label, field, value, rows = 4) {
  return `<label>${escapeHtml(label)} <textarea data-block-field="${escapeHtml(field)}" rows="${rows}">${escapeHtml(value)}</textarea></label>`;
}


function getBlockTypeOptions(current) {
  const options = [
    ['paragraph', 'Paragraf'],
    ['heading', 'Ara başlık'],
    ['callout', 'Renkli not / callout'],
    ['quote', 'Alıntı'],
    ['list', 'Liste'],
    ['image', 'Görsel'],
    ['youtube', 'YouTube video'],
    ['pdf', 'PDF gömme'],
    ['resource', 'Kaynak bağlantısı'],
    ['quiz', 'Çoktan seçmeli mini test'],
    ['truefalse', 'Doğru / yanlış sorusu'],
    ['matching', 'Eşleştirme sorusu'],
    ['code', 'Kod bloğu'],
    ['table', 'Tablo'],
    ['infographic', 'İnfografik kart'],
    ['concept', 'Önemli kavram kartı'],
    ['glossary', 'Terim sözlüğü kutusu'],
    ['objectives', 'Ders hedefleri'],
    ['outcomes', 'Ders sonunda kazanımlar']
  ];
  return options.map(([value, label]) => `<option value="${value}" ${value === current ? 'selected' : ''}>${label}</option>`).join('');
}

function getToneOptions(current) {
  const options = [
    ['info', 'Bilgi / mavi'],
    ['warning', 'Dikkat / kırmızı'],
    ['success', 'Akılda kalsın / yeşil'],
    ['data', 'Veriyle bak / teal'],
    ['source', 'Kaynak kontrolü'],
    ['exam', 'Sınav notu']
  ];
  return options.map(([value, label]) => `<option value="${value}" ${value === current ? 'selected' : ''}>${label}</option>`).join('');
}

function handleBlockEditorClick(event) {
  const editor = event.currentTarget;
  const textarea = editor._textarea;
  if (!textarea) return;

  if (event.target.closest('[data-block-add]')) {
    const type = editor.querySelector('[data-block-add-type]')?.value || 'paragraph';
    editor._blocks.push(createDefaultBlock(type));
    commitBlockEditor(editor);
    renderBlockEditor(editor);
    return;
  }

  if (event.target.closest('[data-block-import]')) {
    syncBlockEditor(textarea);
    return;
  }

  const card = event.target.closest('[data-block-index]');
  if (!card) return;
  const index = Number(card.dataset.blockIndex);

  if (event.target.closest('[data-block-delete]')) {
    editor._blocks.splice(index, 1);
    commitBlockEditor(editor);
    renderBlockEditor(editor);
    return;
  }

  const move = event.target.closest('[data-block-move]')?.dataset.blockMove;
  if (move === 'up' && index > 0) {
    [editor._blocks[index - 1], editor._blocks[index]] = [editor._blocks[index], editor._blocks[index - 1]];
    commitBlockEditor(editor);
    renderBlockEditor(editor);
    return;
  }
  if (move === 'down' && index < editor._blocks.length - 1) {
    [editor._blocks[index + 1], editor._blocks[index]] = [editor._blocks[index], editor._blocks[index + 1]];
    commitBlockEditor(editor);
    renderBlockEditor(editor);
  }
}

function handleBlockEditorInput(event) {
  const editor = event.currentTarget;
  const card = event.target.closest('[data-block-index]');
  if (!card) return;
  const index = Number(card.dataset.blockIndex);
  if (!Number.isFinite(index)) return;


  if (event.target.matches('[data-block-field="type"]')) {
    const oldBlock = editor._blocks[index] || {};
    editor._blocks[index] = convertBlockToType(oldBlock, event.target.value);
    commitBlockEditor(editor);
    renderBlockEditor(editor);
    return;
  }

  editor._blocks[index] = readBlockEditorCard(card);
  commitBlockEditor(editor, { silent: true });
  renderBlockEditorPreview(editor);
}


function createDefaultBlock(type) {
  const cleanType = String(type || 'paragraph').toLowerCase();
  if (cleanType === 'heading') return { type: 'heading', text: 'Yeni ara başlık' };
  if (cleanType === 'callout') return { type: 'callout', tone: 'info', title: 'Bir yudum bilgi', text: 'Not metni...' };
  if (cleanType === 'quote') return { type: 'quote', text: 'Alıntı metni...', source: '' };
  if (cleanType === 'list') return { type: 'list', items: ['Madde bir', 'Madde iki'] };
  if (cleanType === 'image') return { type: 'image', url: '', alt: '', caption: '' };
  if (cleanType === 'youtube') return { type: 'youtube', url: '', title: 'Video ders' };
  if (cleanType === 'pdf') return { type: 'pdf', title: 'PDF belge', url: '' };
  if (cleanType === 'resource') return { type: 'resource', title: 'Kaynak', url: '' };
  if (cleanType === 'quiz') return { type: 'quiz', question: 'Soru metni?', options: ['Seçenek A', 'Seçenek B'], correctIndex: 0, explanation: 'Kısa açıklama.' };
  if (cleanType === 'truefalse') return { type: 'truefalse', statement: 'Bu ifade doğru mu?', correct: true, explanation: 'Kısa açıklama.' };
  if (cleanType === 'matching') return { type: 'matching', pairs: [{ left: 'Kavram', right: 'Karşılık' }, { left: 'Örnek', right: 'Açıklama' }] };
  if (cleanType === 'code') return { type: 'code', language: 'text', code: 'Kod veya komut buraya...' };
  if (cleanType === 'table') return { type: 'table', caption: 'Tablo başlığı', headers: ['Ölçüt', 'Değer'], rows: [['Örnek', 'Açıklama']] };
  if (cleanType === 'infographic') return { type: 'infographic', tone: 'data', title: 'Veriyle bak', value: '%', text: 'Kısa veri yorumu...' };
  if (cleanType === 'concept') return { type: 'concept', term: 'Önemli kavram', definition: 'Kavramın kısa tanımı...', note: '' };
  if (cleanType === 'glossary') return { type: 'glossary', items: [{ term: 'Terim', definition: 'Açıklama' }] };
  if (cleanType === 'objectives') return { type: 'objectives', title: 'Ders hedefleri', items: ['Bu derste temel kavramları ayırt eder.'] };
  if (cleanType === 'outcomes') return { type: 'outcomes', title: 'Ders sonunda kazanımlar', items: ['Konuyu kısa örneklerle açıklayabilir.'] };
  return { type: 'paragraph', text: 'Yeni paragraf...' };
}

function convertBlockToType(block, nextType) {
  const text = block.text || block.title || block.question || '';
  const next = createDefaultBlock(nextType);
  if (next.type === 'heading') next.text = text || next.text;
  if (next.type === 'paragraph') next.text = text || next.text;
  if (next.type === 'callout') next.text = text || next.text;
  if (next.type === 'quote') next.text = text || next.text;
  if (next.type === 'resource' && block.url) next.url = block.url;
  if ((next.type === 'image' || next.type === 'youtube' || next.type === 'pdf') && block.url) next.url = block.url;
  return next;
}

function readBlockEditorCard(card) {
  const type = getCardField(card, 'type') || 'paragraph';
  if (type === 'heading') return { type, text: getCardField(card, 'text') };
  if (type === 'paragraph') return { type, text: getCardField(card, 'text') };
  if (type === 'quote') return { type, text: getCardField(card, 'text'), source: getCardField(card, 'source') };
  if (type === 'callout') return { type, tone: getCardField(card, 'tone') || 'info', title: getCardField(card, 'title'), text: getCardField(card, 'text') };
  if (type === 'list') return { type, items: splitLines(getCardField(card, 'items')) };
  if (type === 'image') return { type, url: getCardField(card, 'url'), alt: getCardField(card, 'alt'), caption: getCardField(card, 'caption') };
  if (type === 'youtube') return { type, url: getCardField(card, 'url'), title: getCardField(card, 'title') };
  if (type === 'pdf') return { type, title: getCardField(card, 'title'), url: getCardField(card, 'url') };
  if (type === 'resource') return { type, title: getCardField(card, 'title'), url: getCardField(card, 'url') };
  if (type === 'truefalse') return { type, statement: getCardField(card, 'statement'), correct: getCardField(card, 'correct') !== 'false', explanation: getCardField(card, 'explanation') };
  if (type === 'matching') return { type, pairs: parsePairs(getCardField(card, 'pairs')) };
  if (type === 'code') return { type, language: getCardField(card, 'language') || 'text', code: getCardField(card, 'code') };
  if (type === 'table') return { type, caption: getCardField(card, 'caption'), headers: splitPipes(getCardField(card, 'headers')), rows: parseTableRows(getCardField(card, 'rows')) };
  if (type === 'infographic') return { type, tone: getCardField(card, 'tone') || 'data', title: getCardField(card, 'title'), value: getCardField(card, 'value'), text: getCardField(card, 'text') };
  if (type === 'concept') return { type, term: getCardField(card, 'term'), definition: getCardField(card, 'definition'), note: getCardField(card, 'note') };
  if (type === 'glossary') return { type, items: parsePairs(getCardField(card, 'items')).map((pair) => ({ term: pair.left, definition: pair.right })) };
  if (type === 'objectives' || type === 'outcomes') return { type, title: getCardField(card, 'title'), items: splitLines(getCardField(card, 'items')) };
  if (type === 'quiz') return {
    type,
    question: getCardField(card, 'question'),
    options: splitLines(getCardField(card, 'options')),
    correctIndex: Number(getCardField(card, 'correctIndex') || 0),
    explanation: getCardField(card, 'explanation')
  };
  return { type: 'paragraph', text: getCardField(card, 'text') };
}

function parsePairs(value) {
  return splitLines(value).map((line) => {
    const [left, right] = splitPipe(line);
    return { left: left || '', right: right || '' };
  }).filter((pair) => pair.left || pair.right);
}

function splitPipes(value) {
  return String(value || '').split('|').map((part) => part.trim()).filter(Boolean);
}

function parseTableRows(value) {
  return splitLines(value).map(splitPipes).filter((row) => row.length);
}

function getCardField(card, field) {
  return card.querySelector(`[data-block-field="${cssEscape(field)}"]`)?.value?.trim() || '';
}

function commitBlockEditor(editor, { silent = false } = {}) {
  const textarea = editor._textarea;
  if (!textarea) return;
  const cleaned = editor._blocks.map(cleanContentBlock).filter(Boolean);
  textarea.dataset.blockEditorUpdating = 'true';
  textarea.value = cleaned.length ? JSON.stringify(cleaned, null, 2) : '';
  textarea.dataset.blockEditorUpdating = 'false';
  if (!silent) {
    const status = editor.querySelector('[data-block-editor-status]');
    if (status) status.textContent = cleaned.length ? `${cleaned.length} blok hazır.` : 'Blok yok.';
  }
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
  syncBlockEditorForForm(els.adminArticleForm);
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
  syncBlockEditorForForm(els.adminArticleForm);
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
  syncBlockEditorForForm(els.adminLessonForm);
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
  syncBlockEditorForForm(els.adminLessonForm);
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

function quizDataAttrs(context = {}, index = 0, type = 'quiz') {
  const attrs = {
    scope: context.scope || 'content',
    articleId: context.articleId || '',
    courseId: context.courseId || '',
    lessonId: context.lessonId || '',
    quizId: context.quizId || `${type}-${index}`
  };
  return `data-quiz-scope="${escapeHtml(attrs.scope)}" data-article-id="${escapeHtml(attrs.articleId)}" data-course-id="${escapeHtml(attrs.courseId)}" data-lesson-id="${escapeHtml(attrs.lessonId)}" data-quiz-id="${escapeHtml(attrs.quizId)}"`;
}

function renderContentBlocks(blocks = [], context = {}) {
  return blocks.map((block, index) => renderContentBlock(block, index, context)).join('');
}

function renderContentBlock(block, index = 0, context = {}) {
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

  if (type === 'truefalse') {
    const correct = block.correct !== false;
    return `<section class="content-quiz content-quiz--truefalse" data-quiz ${quizDataAttrs(context, index, 'truefalse')}><strong>${escapeHtml(block.statement || block.text || 'Doğru mu, yanlış mı?')}</strong><div class="content-quiz__options"><button type="button" data-quiz-option="true" data-correct="${correct === true}">Doğru</button><button type="button" data-quiz-option="false" data-correct="${correct === false}">Yanlış</button></div>${block.explanation ? `<p class="content-quiz__explanation" hidden>${escapeHtml(block.explanation)}</p>` : ''}</section>`;
  }

  if (type === 'matching') {
    const pairs = Array.isArray(block.pairs) ? block.pairs : [];
    return `<section class="content-matching"><h4>Eşleştirme</h4><div class="content-matching__grid">${pairs.map((pair) => `<span>${escapeHtml(pair.left || '')}</span><strong>${escapeHtml(pair.right || '')}</strong>`).join('')}</div></section>`;
  }

  if (type === 'code') {
    return `<figure class="content-code"><figcaption>${escapeHtml(block.language || block.title || 'Kod')}</figcaption><pre><code>${escapeHtml(block.code || block.text || '')}</code></pre></figure>`;
  }

  if (type === 'table') {
    const headers = Array.isArray(block.headers) ? block.headers : [];
    const rows = Array.isArray(block.rows) ? block.rows : [];
    return `<figure class="content-table">${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''}<div class="content-table__scroll"><table>${headers.length ? `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>` : ''}<tbody>${rows.map((row) => `<tr>${(Array.isArray(row) ? row : []).map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></figure>`;
  }

  if (type === 'infographic') {
    const tone = ['info', 'warning', 'success', 'data', 'source', 'exam'].includes(block.tone) ? block.tone : 'data';
    return `<aside class="content-infographic content-infographic--${tone}">${block.value ? `<strong>${escapeHtml(block.value)}</strong>` : ''}<span>${escapeHtml(block.title || 'Veriyle bak')}</span>${block.text ? `<p>${escapeHtml(block.text)}</p>` : ''}</aside>`;
  }

  if (type === 'concept') {
    return `<aside class="content-concept"><span>Önemli kavram</span><strong>${escapeHtml(block.term || block.title || '')}</strong><p>${escapeHtml(block.definition || block.text || '')}</p>${block.note ? `<small>${escapeHtml(block.note)}</small>` : ''}</aside>`;
  }

  if (type === 'glossary') {
    const items = Array.isArray(block.items) ? block.items : [];
    return `<section class="content-glossary"><h4>Terim sözlüğü</h4><dl>${items.map((item) => `<dt>${escapeHtml(item.term || item.left || '')}</dt><dd>${escapeHtml(item.definition || item.right || '')}</dd>`).join('')}</dl></section>`;
  }

  if (type === 'objectives' || type === 'outcomes') {
    const items = Array.isArray(block.items) ? block.items : [];
    const title = block.title || (type === 'objectives' ? 'Ders hedefleri' : 'Ders sonunda kazanımlar');
    return `<section class="content-objectives content-objectives--${type}"><h4>${escapeHtml(title)}</h4><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`;
  }

  if (type === 'quiz') {
    const options = Array.isArray(block.options) ? block.options : [];
    const correctIndex = Number(block.correctIndex);
    return `<section class="content-quiz" data-quiz ${quizDataAttrs(context, index, 'quiz')}><strong>${escapeHtml(block.question || 'Mini soru')}</strong><div class="content-quiz__options">${options.map((option, index) => `<button type="button" data-quiz-option="${index}" data-correct="${index === correctIndex}">${escapeHtml(option)}</button>`).join('')}</div>${block.explanation ? `<p class="content-quiz__explanation" hidden>${escapeHtml(block.explanation)}</p>` : ''}</section>`;
  }

  return `<p>${escapeHtml(block.text || JSON.stringify(block))}</p>`;
}

function bindRichContentInteractions(root = document) {
  root.querySelectorAll('[data-quiz]').forEach((quiz) => {
    quiz.querySelectorAll('[data-quiz-option]').forEach((button) => {
      button.addEventListener('click', async () => {
        quiz.querySelectorAll('[data-quiz-option]').forEach((item) => { item.disabled = true; });
        button.dataset.selected = 'true';
        const correct = button.dataset.correct === 'true';
        button.dataset.result = correct ? 'correct' : 'wrong';
        const explanation = quiz.querySelector('.content-quiz__explanation');
        if (explanation) explanation.hidden = false;

        const status = document.createElement('p');
        status.className = 'content-quiz__save-note';
        status.textContent = getCurrentUser()
          ? 'Yanıtınız kaydediliyor…'
          : 'Giriş yapmadığınız için yanıt bu tarayıcıda geçici saklanır.';
        quiz.append(status);

        try {
          await saveQuizAttempt({
            scope: quiz.dataset.quizScope || 'content',
            articleId: quiz.dataset.articleId || '',
            courseId: quiz.dataset.courseId || '',
            lessonId: quiz.dataset.lessonId || '',
            quizId: quiz.dataset.quizId || 'quiz',
            question: quiz.querySelector('strong')?.textContent || '',
            selected: button.dataset.quizOption,
            correct
          });
          status.textContent = getCurrentUser() ? 'Yanıtınız kaydedildi.' : 'Yanıtınız bu tarayıcıda geçici saklandı.';
        } catch (error) {
          status.textContent = 'Yanıt gösterildi; kayıt yapılamadı. Firestore Rules içinde quizAttempts izni gerekebilir.';
        }
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
    if (type === 'truefalse') return [`Doğru/Yanlış: ${block.statement || block.text || ''}`, `Cevap: ${block.correct === false ? 'Yanlış' : 'Doğru'}`, block.explanation ? `Açıklama: ${block.explanation}` : ''].filter(Boolean).join('\n');
    if (type === 'matching') return ['Eşleştirme:', ...(block.pairs || []).map((pair) => `${pair.left || ''} | ${pair.right || ''}`)].join('\n');
    if (type === 'code') return `Kod: ${block.language || 'text'}\n${block.code || block.text || ''}`;
    if (type === 'table') return [`Tablo: ${block.caption || ''}`, (block.headers || []).join(' | '), ...(block.rows || []).map((row) => (Array.isArray(row) ? row : []).join(' | '))].filter(Boolean).join('\n');
    if (type === 'infographic') return `İnfografik: ${[block.title, block.value].filter(Boolean).join(' | ')}\n${block.text || ''}`;
    if (type === 'concept') return `Kavram: ${block.term || block.title || ''}\n${block.definition || block.text || ''}${block.note ? `\nNot: ${block.note}` : ''}`;
    if (type === 'glossary') return ['Terim sözlüğü:', ...(block.items || []).map((item) => `${item.term || ''} | ${item.definition || ''}`)].join('\n');
    if (type === 'objectives' || type === 'outcomes') return [`${type === 'objectives' ? 'Ders hedefleri' : 'Ders sonunda kazanımlar'}:`, ...(block.items || []).map((item) => `- ${item}`)].join('\n');
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
  let type = String(block.type || 'paragraph').toLowerCase();
  const aliases = {
    true_false: 'truefalse',
    trueFalse: 'truefalse',
    dogruyanlis: 'truefalse',
    doğruyanlış: 'truefalse',
    match: 'matching',
    infographicCard: 'infographic',
    conceptCard: 'concept',
    learningObjectives: 'objectives',
    learningOutcomes: 'outcomes'
  };
  type = aliases[type] || type;
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
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (/^(public\/assets\/|assets\/|\.\/|\/)/i.test(raw)) return !raw.includes('..');
  try {
    const url = new URL(raw);
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
