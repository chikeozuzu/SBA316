// Cache elements by id and selector
const gallery = document.getElementById('gallery'); // cached by id
const addForm = document.querySelector('#addForm'); // cached by querySelector
const imgUrlInput = document.getElementById('imgUrl');
const imgCaptionInput = document.getElementById('imgCaption');
const template = document.getElementById('figTemplate');
const shuffleBtn = document.getElementById('shuffleBtn');
const themeToggle = document.getElementById('themeToggle');
const info = document.getElementById('sysInfo');
const resetBtn = document.getElementById('resetBtn');
const undoBtn = document.getElementById('undoBtn');
const undoTimer = document.getElementById('undoTimer');

// Sample images (Pexels) — creative commons-friendly placeholders
const samples = [
    { url: 'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg', caption: 'Calm lake' },
    { url: 'https://images.pexels.com/photos/34950/pexels-photo.jpg', caption: 'Forest path' },
    { url: 'https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg', caption: 'Cute fox' }
];

// Persisted gallery items (kept in memory and saved to localStorage)
let galleryItems = [];
// last removed item for undo
let lastRemoved = null;
let lastRemovedTimer = null;
let undoRemaining = 0;
let undoCountdown = null;

function clearLastRemoved() {
    lastRemoved = null;
    if (lastRemovedTimer) {
        clearTimeout(lastRemovedTimer);
        lastRemovedTimer = null;
    }
    if (undoBtn) undoBtn.disabled = true;
    if (undoCountdown) {
        clearInterval(undoCountdown);
        undoCountdown = null;
    }
    if (undoTimer) undoTimer.textContent = '';
}

function getStoredItems() {
    try {
        const raw = localStorage.getItem('galleryItems');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function saveStoredItems(items) {
    try {
        localStorage.setItem('galleryItems', JSON.stringify(items));
    } catch (e) {
        // ignore storage errors
    }
}

// Build gallery using DocumentFragment and template.cloneNode
function buildGallery(items) {
    galleryItems = items.slice();
    gallery.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach((it, i) => {
        const li = template.content.firstElementChild.cloneNode(true);
        const img = li.querySelector('img');
        const cap = li.querySelector('figcaption');
        img.setAttribute('src', it.url);
        img.setAttribute('alt', it.caption || `Picture ${i + 1}`);
        img.dataset.index = i;
        li.dataset.url = it.url;
        cap.textContent = it.caption || '';
        frag.appendChild(li);
    });
    gallery.appendChild(frag);
    updateInfo();
}

// Modal elements and handlers
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const modalCaption = document.getElementById('modalCaption');
const modalClose = document.getElementById('modalClose');
let lastFocused = null;
let currentModalIndex = null;

function openModal(src, caption, index) {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    modalImg.src = src;
    modalImg.alt = caption || '';
    modalCaption.textContent = caption || '';
    modalClose.focus();
    currentModalIndex = (typeof index === 'number') ? index : null;
}

function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    modalImg.src = '';
    modalCaption.textContent = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
}

// open modal on double-click of an image
gallery.addEventListener('dblclick', function (e) {
    const t = e.target;
    if (t && t.tagName === 'IMG') {
        const src = t.src;
        const cap = t.closest('li') && t.closest('li').querySelector('figcaption') ? t.closest('li').querySelector('figcaption').textContent : '';
        const idx = t.dataset.index ? Number(t.dataset.index) : null;
        openModal(src, cap, idx);
    }
});

// close via close button
if (modalClose) modalClose.addEventListener('click', closeModal);
// close via clicking outside content
if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
// keyboard handling for modal: Escape, Arrow navigation, and Tab focus trap
document.addEventListener('keydown', function (e) {
    if (!modal || modal.classList.contains('hidden')) return;
    // Escape closes
    if (e.key === 'Escape') {
        closeModal();
        return;
    }
    // Arrow navigation inside modal
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentModalIndex !== null && galleryItems.length > 0) {
            const next = (currentModalIndex + 1) % galleryItems.length;
            showModalImage(next);
        }
        return;
    }
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentModalIndex !== null && galleryItems.length > 0) {
            const prev = (currentModalIndex - 1 + galleryItems.length) % galleryItems.length;
            showModalImage(prev);
        }
        return;
    }
    // Focus trap: keep Tab within modal
    if (e.key === 'Tab') {
        const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
        const focusArray = Array.prototype.slice.call(focusable);
        if (focusArray.length === 0) {
            e.preventDefault();
            return;
        }
        const idx = focusArray.indexOf(document.activeElement);
        if (e.shiftKey) {
            const prev = (idx <= 0) ? focusArray.length - 1 : idx - 1;
            focusArray[prev].focus();
            e.preventDefault();
        } else {
            const next = (idx === focusArray.length - 1) ? 0 : idx + 1;
            focusArray[next].focus();
            e.preventDefault();
        }
    }
});

// helper to show image by index inside modal
function showModalImage(index) {
    if (!modal || index == null || !galleryItems[index]) return;
    const item = galleryItems[index];
    modalImg.src = item.url;
    modalImg.alt = item.caption || '';
    modalCaption.textContent = item.caption || '';
    currentModalIndex = index;
}

// Update footer info using BOM navigator and first/last child navigation
function updateInfo() {
    const ua = navigator.userAgent; // BOM usage
    const first = gallery.firstElementChild;
    const last = gallery.lastElementChild;
    const firstText = first ? first.querySelector('figcaption').textContent : '—';
    const lastText = last ? last.querySelector('figcaption').textContent : '—';
    info.textContent = `UserAgent: ${ua} · First: ${firstText} · Last: ${lastText}`;
}

// HTML attribute validation is present on the form inputs (required, pattern)
// Additional DOM-based validation (event-based)
imgUrlInput.addEventListener('input', () => {
    const ok = imgUrlInput.validity.valid;
    if (!ok) {
        imgUrlInput.setCustomValidity('Please enter a valid http(s) URL');
    } else {
        imgUrlInput.setCustomValidity('');
    }
});

// Handle form submission — create element via cloneNode and prepend to gallery
addForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!addForm.checkValidity()) {
        addForm.reportValidity();
        return;
    }
    const url = imgUrlInput.value.trim();
    const caption = imgCaptionInput.value.trim();
    // create new item from template
    const newItem = template.content.firstElementChild.cloneNode(true);
    const img = newItem.querySelector('img');
    const cap = newItem.querySelector('figcaption');
    img.src = url;
    img.alt = caption || 'User added image';
    cap.textContent = caption;
    // prepend to show newest first (demonstrates prepend)
    // set dataset so removal can find the item
    newItem.dataset.url = url;
    gallery.prepend(newItem);
    // update in-memory and persisted list
    galleryItems.unshift({ url, caption });
    saveStoredItems(galleryItems);
    // save last added in localStorage (BOM)
    try { localStorage.setItem('lastAdded', url); } catch (e) { /* ignore */ }
    // clear inputs
    imgUrlInput.value = '';
    imgCaptionInput.value = '';
    updateInfo();
    // adding a new item clears the undo state
    clearLastRemoved();
});

// Handle clicks in gallery (delegation): highlight image or remove item
gallery.addEventListener('click', function (e) {
    const target = e.target;
    // if remove button clicked
    if (target.classList.contains('removeBtn')) {
        // use parent-child navigation to find the <li>
        const li = target.closest('li');
        if (!li) return;
        // confirm removal (BOM confirm)
        if (window.confirm('Remove this image?')) {
            // remove from persisted data if possible
            const url = li.dataset.url || (li.querySelector('img') && li.querySelector('img').src);
            if (url) {
                const idx = galleryItems.findIndex(it => it.url === url);
                if (idx !== -1) {
                    // capture removed for undo
                    const removed = galleryItems[idx];
                    lastRemoved = { item: removed, index: idx };
                    galleryItems.splice(idx, 1);
                    saveStoredItems(galleryItems);
                    // enable undo for a limited time (start 30s countdown)
                    if (undoBtn) undoBtn.disabled = false;
                    if (lastRemovedTimer) clearTimeout(lastRemovedTimer);
                    // initialize countdown
                    undoRemaining = 30;
                    if (undoTimer) undoTimer.textContent = `${undoRemaining}s`;
                    if (undoCountdown) clearInterval(undoCountdown);
                    undoCountdown = setInterval(() => {
                        undoRemaining -= 1;
                        if (undoTimer) undoTimer.textContent = undoRemaining > 0 ? `${undoRemaining}s` : '';
                    }, 1000);
                    lastRemovedTimer = setTimeout(() => {
                        clearLastRemoved();
                    }, 30000);
                }
            }
            // demonstrate sibling navigation: move highlight to next sibling if exists
            const next = li.nextElementSibling;
            li.remove();
            if (next) {
                const img = next.querySelector('img');
                if (img) img.classList.add('highlight');
            }
            updateInfo();
        }
        return;
    }

    // clicking an image toggles its highlight and updates location.hash (BOM)
    if (target.tagName === 'IMG') {
        // iterate over all images to remove highlight (demonstrates iteration)
        const imgs = gallery.querySelectorAll('img');
        imgs.forEach(i => i.classList.remove('highlight'));
        target.classList.toggle('highlight');
        // set location hash to the image index if present
        if (target.dataset.index) window.location.hash = `img-${target.dataset.index}`;
    }
});

// Shuffle highlights: pick a random image and add highlight
shuffleBtn.addEventListener('click', function () {
    const imgs = Array.from(gallery.querySelectorAll('img'));
    if (imgs.length === 0) return;
    imgs.forEach(i => i.classList.remove('highlight'));
    const idx = Math.floor(Math.random() * imgs.length);
    imgs[idx].classList.add('highlight');
    // demonstrate parent/child relations: focus its caption
    const caption = imgs[idx].closest('li').querySelector('figcaption');
    if (caption) caption.style.fontWeight = '700';
});

// Theme toggle changes document class (modify classList)
themeToggle.addEventListener('click', function () {
    document.documentElement.classList.toggle('dark-theme');
    const pressed = document.documentElement.classList.contains('dark-theme');
    themeToggle.setAttribute('aria-pressed', pressed);
});

// Reset gallery to initial samples (confirmation + persist)
if (resetBtn) {
    resetBtn.addEventListener('click', function () {
        if (!window.confirm('Reset the gallery to the original sample images? This will overwrite your saved gallery.')) return;
        // reset in-memory and persisted items
        galleryItems = samples.slice();
        saveStoredItems(galleryItems);
        // clear lastAdded marker
        try { localStorage.removeItem('lastAdded'); } catch (e) { }
        buildGallery(galleryItems);
        // clear undo state when resetting
        clearLastRemoved();
    });
}

// Undo handler: restore last removed item (if any)
if (undoBtn) {
    undoBtn.addEventListener('click', function () {
        if (!lastRemoved || !lastRemoved.item) return;
        const idx = Math.min(Math.max(0, lastRemoved.index), galleryItems.length);
        galleryItems.splice(idx, 0, lastRemoved.item);
        saveStoredItems(galleryItems);
        buildGallery(galleryItems);
        clearLastRemoved();
    });
}

// If there's a saved lastAdded image, add it to top (demonstrate BOM localStorage read)
window.addEventListener('load', function () {
    const stored = getStoredItems();
    const last = localStorage.getItem('lastAdded');
    let items = [];
    if (stored && Array.isArray(stored)) {
        items = stored.slice();
    } else {
        items = [...samples];
        if (last) items.unshift({ url: last, caption: '(Last added)' });
    }
    buildGallery(items);
    // ensure persisted list exists (first run)
    if (!stored) saveStoredItems(items);
});

// Respond to hash changes (demonstrate BOM location.hash and event)
window.addEventListener('hashchange', function () {
    const h = window.location.hash;
    // highlight the image referenced by hash if found
    if (!h) return;
    const match = h.match(/^#img-(\d+)$/);
    if (match) {
        const idx = Number(match[1]);
        const imgs = gallery.querySelectorAll('img');
        if (imgs[idx]) {
            imgs.forEach(i => i.classList.remove('highlight'));
            imgs[idx].classList.add('highlight');
            // scroll into view
            imgs[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
});

// Ensure no runtime errors: wrap risky operations in try/catch where appropriate

