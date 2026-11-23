(() => {
  const pageName = location.pathname.split('/').filter(Boolean).pop() || 'index.html';
  const cssPath = (element) => {
    const parts = [];
    let node = element;
    while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
      const tag = node.tagName.toLowerCase();
      if (tag === 'body') { parts.unshift('body'); break; }
      const siblings = [...node.parentElement.children].filter((item) => item.tagName === node.tagName);
      parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(node) + 1})`);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };
  let activePatches = null;
  const applyPatches = () => {
    if (!activePatches) return;
    for (const [path, patch] of Object.entries(activePatches)) {
      let element;
      try { element = document.querySelector(path); } catch { continue; }
      if (!element || !patch || typeof patch !== 'object') continue;
      if (typeof patch.text === 'string' && element.textContent !== patch.text) element.textContent = patch.text;
      if (patch.attrs && typeof patch.attrs === 'object') {
        for (const [name, value] of Object.entries(patch.attrs)) {
          if (!['src', 'alt', 'href', 'title', 'aria-label'].includes(name) || typeof value !== 'string') continue;
          if (name === 'src' && !/^(https?:\/\/|\/|assets\/)/i.test(value)) continue;
          if (name === 'href' && /^(javascript:|data:)/i.test(value)) continue;
          if (element.getAttribute(name) !== value) element.setAttribute(name, value);
        }
      }
    }
  };

  window.CTYBC_CMS = { cssPath, apply: applyPatches };
  fetch('/api/cms/content', { cache: 'no-store' }).then((response) => {
    if (!response.ok) return null;
    return response.json();
  }).then((content) => {
    activePatches = content?.patches?.[pageName] || null;
    applyPatches();
    if (activePatches && document.body && 'MutationObserver' in window) {
      const observer = new MutationObserver(applyPatches);
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }).catch(() => {});
})();
