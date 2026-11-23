(() => {
  const pages = [
    ['index.html', 'Home'], ['about.html', 'Our story & beliefs'], ['gatherings.html', 'Gatherings'], ['outreach.html', 'Outreach'],
    ['archive.html', 'History & archive'], ['gallery.html', 'Photo archive'], ['quiz.html', 'Bible Quiz'], ['journal.html', 'Journal'],
    ['blog.html', 'Blog'], ['blog-quiet-start.html', 'A Quiet Start'], ['blog-confidence-community.html', 'Confidence Grows in Community'],
    ['blog-faith-in-action.html', 'Faith Beyond Sunday'], ['blog-honest-questions.html', 'Honest Questions'], ['blog-begin-again.html', 'Begin Again'],
    ['story-maiden-quiz.html', 'Maiden Bible Quiz story'], ['story-october-gathering.html', 'October gathering story'], ['story-teen-classes.html', 'Teen classes story'],
    ['shop.html', 'Bookshop'], ['give.html', 'Giving'], ['donate.html', 'Donate'], ['contact.html', 'Contact'],
  ];
  const $ = (id) => document.getElementById(id);
  const loginShell = $('login-shell'), editor = $('editor'), loginForm = $('login-form'), loginMessage = $('login-message');
  const setupNote = $('setup-note'), status = $('save-status'), pageSelect = $('page-select'), frame = $('page-frame');
  let content = { version: 1, updatedAt: null, patches: {}, gallery: [] };
  let selected = null;
  let selectedPath = '';
  let selectedLinkPath = '';
  let loaded = false;

  const setStatus = (text, error = false) => { status.textContent = text; status.style.color = error ? '#9b3f40' : ''; };
  const api = async (url, options = {}) => {
    const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
    return body;
  };
  const showLogin = (message = '') => { loginShell.hidden = false; editor.hidden = true; loginMessage.textContent = message; };
  const showEditor = () => { loginShell.hidden = true; editor.hidden = false; };

  async function start() {
    try {
      const session = await api('/api/cms/session');
      if (!session.configured) { setupNote.hidden = false; $('password-label').hidden = true; loginForm.querySelector('.button').hidden = true; loginMessage.textContent = 'Complete the one-time Vercel setup below to activate the editor.'; return; }
      if (session.authenticated) await openEditor();
    } catch (error) {
      showLogin(error.message);
      if (/Request failed \(404\)/.test(error.message)) {
        setupNote.hidden = false; $('password-label').hidden = true; loginForm.querySelector('.button').hidden = true;
        loginMessage.textContent = 'The local static preview does not run the CMS API. Open this page on the Vercel deployment after completing the setup below.';
      }
    }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); loginMessage.textContent = 'Signing in…';
    try {
      await api('/api/cms/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('admin-password').value }) });
      $('admin-password').value = ''; await openEditor();
    } catch (error) { loginMessage.textContent = error.message; }
  });

  async function openEditor() {
    try {
      content = await api('/api/cms/content');
      if (!content.patches) content.patches = {};
      if (!Array.isArray(content.gallery)) content.gallery = [];
      loaded = true;
      showEditor();
      fillPages();
      renderPhotos();
      loadPreview();
      setStatus(content.updatedAt ? `Last saved ${new Date(content.updatedAt).toLocaleString()}` : 'Ready. Select an item in the page preview to edit it.');
    } catch (error) { showLogin(error.message); }
  }

  function fillPages() {
    pageSelect.replaceChildren(...pages.map(([file, label]) => {
      const option = document.createElement('option'); option.value = file; option.textContent = label; return option;
    }));
  }
  function loadPreview() { selected = null; selectedPath = ''; clearInspector(); frame.src = `/${pageSelect.value}`; }
  pageSelect.addEventListener('change', loadPreview);
  $('reload-preview').addEventListener('click', loadPreview);
  $('preview-site').addEventListener('click', () => window.open(`/${pageSelect.value}`, '_blank', 'noopener'));
  $('sign-out').addEventListener('click', async () => { try { await api('/api/cms/session', { method: 'DELETE' }); } finally { showLogin('You have signed out.'); } });

  function clearInspector() {
    $('inspector').querySelector('.inspector-empty').hidden = false;
    $('inspector-fields').hidden = true;
    $('text-field-wrap').hidden = true; $('link-field-wrap').hidden = true;
    $('image-field-wrap').hidden = true; $('alt-field-wrap').hidden = true;
    selected = null; selectedPath = ''; selectedLinkPath = '';
  }

  frame.addEventListener('load', () => {
    try {
      const doc = frame.contentDocument;
      const style = doc.createElement('style');
      style.textContent = `body{cursor:crosshair!important}body *:hover{outline:2px solid #dcb16b!important;outline-offset:2px!important} .cms-editor-selected{outline:3px solid #694472!important;outline-offset:3px!important}`;
      doc.head.append(style);
      doc.addEventListener('click', (event) => {
        const target = event.target;
        if (target.closest('#legacy-blog-grid button, #story-dialog .story-dialog-close')) return;
        const element = target.closest('img') || target.closest('h1,h2,h3,h4,h5,p,li,figcaption,b,strong,em,span') || target.closest('a,button');
        if (!element || element.closest('script,style') || element.tagName === 'SCRIPT') return;
        event.preventDefault(); event.stopPropagation();
        selectElement(element);
      }, true);
    } catch { setStatus('This page could not be opened in the editor preview.', true); }
  });

  function selectElement(element) {
    frame.contentDocument.querySelectorAll('.cms-editor-selected').forEach((node) => node.classList.remove('cms-editor-selected'));
    element.classList.add('cms-editor-selected');
    selected = element;
    selectedPath = frame.contentWindow.CTYBC_CMS?.cssPath(element) || cssPath(element);
    const link = element.matches('a') ? element : element.closest('a');
    selectedLinkPath = link ? (frame.contentWindow.CTYBC_CMS?.cssPath(link) || cssPath(link)) : '';
    const isImage = element.tagName === 'IMG';
    const isLink = Boolean(link);
    const inspector = $('inspector');
    inspector.querySelector('.inspector-empty').hidden = true;
    $('inspector-fields').hidden = false;
    $('selected-kind').textContent = isImage ? 'Image' : isLink ? 'Text and link' : element.tagName.toLowerCase();
    $('text-field-wrap').hidden = isImage;
    $('link-field-wrap').hidden = !isLink;
    $('image-field-wrap').hidden = !isImage;
    $('alt-field-wrap').hidden = !isImage;
    if (!isImage) $('text-value').value = element.textContent.trim();
    if (isLink) $('link-value').value = link.getAttribute('href') || '';
    if (!isLink) $('link-value').value = '';
    if (isImage) $('alt-value').value = element.getAttribute('alt') || '';
  }

  function cssPath(element) {
    const parts = []; let node = element;
    while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
      const tag = node.tagName.toLowerCase();
      if (tag === 'body') { parts.unshift('body'); break; }
      const siblings = [...node.parentElement.children].filter((item) => item.tagName === node.tagName);
      parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(node) + 1})`); node = node.parentElement;
    }
    return parts.join(' > ');
  }

  function pendingPatch() {
    const page = pageSelect.value;
    content.patches[page] ||= {};
    content.patches[page][selectedPath] ||= { attrs: {} };
    return content.patches[page][selectedPath];
  }
  $('text-value').addEventListener('input', (event) => {
    if (!selected || selected.tagName === 'IMG') return;
    selected.textContent = event.target.value; pendingPatch().text = event.target.value;
  });
  $('link-value').addEventListener('input', (event) => {
    if (!selected || !selectedLinkPath) return;
    const value = event.target.value;
    if (/^(javascript:|data:)/i.test(value)) return;
    const link = selected.matches('a') ? selected : selected.closest('a');
    link?.setAttribute('href', value);
    const page = pageSelect.value; content.patches[page] ||= {}; content.patches[page][selectedLinkPath] ||= { attrs: {} };
    content.patches[page][selectedLinkPath].attrs.href = value;
  });
  $('alt-value').addEventListener('input', (event) => {
    if (!selected || selected.tagName !== 'IMG') return;
    selected.alt = event.target.value; pendingPatch().attrs.alt = event.target.value;
  });
  $('image-file').addEventListener('change', async (event) => {
    if (!selected || selected.tagName !== 'IMG' || !event.target.files[0]) return;
    try {
      setStatus('Uploading image…'); const uploaded = await upload(event.target.files[0]);
      selected.src = uploaded.url; pendingPatch().attrs.src = uploaded.url;
      setStatus('Image ready. Save page edits to publish it.');
    } catch (error) { setStatus(error.message, true); }
  });
  $('save-page').addEventListener('click', async () => {
    if (!loaded) return;
    const patch = pendingPatch();
    if (selected && selected.tagName !== 'IMG' && $('text-value').value !== '') patch.text = $('text-value').value;
    if (selectedLinkPath && $('link-value').value) {
      const page = pageSelect.value; content.patches[page] ||= {}; content.patches[page][selectedLinkPath] ||= { attrs: {} };
      content.patches[page][selectedLinkPath].attrs.href = $('link-value').value;
    }
    if (selected?.tagName === 'IMG') patch.attrs.alt = $('alt-value').value;
    await saveContent('Saving page changes…');
  });

  async function upload(file) {
    const optimized = await optimizePhoto(file);
    const extension = optimized.type === 'image/jpeg' ? '.jpg' : (file.name.match(/\.[^.]+$/)?.[0] || '.img');
    const form = new FormData(); form.append('file', optimized, file.name.replace(/\.[^.]+$/, extension));
    return api('/api/cms/upload', { method: 'POST', body: form });
  }

  async function optimizePhoto(file) {
    if (file.size <= 3 * 1024 * 1024) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d', { alpha: false }); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    let quality = .84; let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    while (blob && blob.size > 3 * 1024 * 1024 && quality > .55) { quality -= .08; blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality)); }
    if (!blob) throw new Error('This image could not be optimized.');
    return blob;
  }
  async function saveContent(label = 'Saving…') {
    setStatus(label);
    try {
      const saved = await api('/api/cms/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(content) });
      content = saved; renderPhotos(); setStatus(`Saved ${new Date(saved.updatedAt).toLocaleString()}. The live site is updating.`);
      return true;
    } catch (error) { setStatus(error.message, true); return false; }
  }

  document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('is-active', item === tab));
    const photos = tab.dataset.tab === 'photos'; $('page-workspace').hidden = photos; $('photo-workspace').hidden = !photos;
  }));

  $('save-gallery').addEventListener('click', () => saveContent('Saving photo archive changes…'));

  $('photo-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const message = $('photo-message'); const files = [...$('gallery-file').files];
    if (!files.length) return; message.textContent = `Uploading ${files.length} photo${files.length === 1 ? '' : 's'}…`;
    try {
      const uploaded = await Promise.all(files.map(upload));
      const caption = $('gallery-caption').value;
      const yearValue = $('gallery-year').value.trim();
      const year = /^\d{4}$/.test(yearValue) ? yearValue : '';
      uploaded.forEach((photo) => content.gallery.push({ id: crypto.randomUUID(), src: photo.url, title: caption, description: $('gallery-description').value.trim() || 'A moment from the CTYBC photo archive.', year }));
      if (await saveContent('Saving photos to the archive…')) {
        message.style.color = '#246a48'; message.textContent = `${uploaded.length} photo${uploaded.length === 1 ? '' : 's'} added to the public archive.`;
        $('photo-form').reset();
      }
    } catch (error) { message.style.color = '#9b3f40'; message.textContent = error.message; }
  });

  function renderPhotos() {
    const list = $('photo-list'); if (!list) return; list.replaceChildren();
    if (!content.gallery.length) { const empty = document.createElement('p'); empty.className = 'photo-empty'; empty.textContent = 'No editor-added photos yet.'; list.append(empty); return; }
    content.gallery.forEach((photo, index) => {
      const card = document.createElement('article'); card.className = 'photo-item';
      const image = document.createElement('img'); image.src = photo.src; image.alt = photo.title || 'CTYBC photo';
      const details = document.createElement('div'); const title = document.createElement('b'); title.textContent = photo.title || 'CTYBC'; const caption = document.createElement('span'); caption.textContent = [photo.year, photo.description].filter(Boolean).join(' · '); details.append(title, caption);
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove from archive'; remove.addEventListener('click', async () => {
        if (!window.confirm('Remove this photo from the public archive? The uploaded image file will remain in storage.')) return;
        const [removed] = content.gallery.splice(index, 1);
        if (!await saveContent('Saving photo removal…')) { content.gallery.splice(index, 0, removed); renderPhotos(); }
      });
      card.append(image, details, remove); list.append(card);
    });
  }
  start();
})();
