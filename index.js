// Cache elements by id and selector
const gallery = document.getElementById('gallery'); // cached by id
const addForm = document.querySelector('#addForm'); // cached by querySelector
const imgUrlInput = document.getElementById('imgUrl');
const imgCaptionInput = document.getElementById('imgCaption');
const template = document.getElementById('figTemplate');
const shuffleBtn = document.getElementById('shuffleBtn');
const themeToggle = document.getElementById('themeToggle');
const info = document.getElementById('info');
const resetBtn = document.getElementById('resetBtn');

// Sample images (Pexels) — creative commons-friendly placeholders
const samples = [
    { url: 'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg', caption: 'Calm lake' },
    { url: 'https://images.pexels.com/photos/34950/pexels-photo.jpg', caption: 'Forest path' },
    { url: 'https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg', caption: 'Cute fox' }
];

// Persisted gallery items (kept in memory and saved to localStorage)
let galleryItems = [];

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
                    galleryItems.splice(idx, 1);
                    saveStoredItems(galleryItems);
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

