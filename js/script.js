// ==============================================
// NASA Space Explorer - Beginner Friendly Script
// ==============================================
// This script fetches data from a JSON file that contains
// many NASA Astronomy Picture of the Day (APOD) entries.
// Each entry usually has: date, title, media_type, url, etc.
// We will:
// 1. Listen for a button click.
// 2. Fetch the JSON data.
// 3. Filter for items that are images.
// 4. Create gallery cards that show the image, title, and date.
// 5. Handle loading and error states so users know what is happening.

// URL that returns an ARRAY of APOD objects (already hosted for class use)
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Grab references to important DOM elements.
const getImagesBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');

// A small flag so we know if we've already loaded images once.
let hasLoadedOnce = false;

// Helper: Clear anything currently in the gallery (including placeholder).
function clearGallery() {
	gallery.innerHTML = '';
}

// Helper: Show a simple message inside the gallery (for errors or empty results).
function showMessage(text) {
	clearGallery();
	const msgDiv = document.createElement('div');
	msgDiv.className = 'placeholder';
	msgDiv.innerHTML = `<div class="placeholder-icon">🛰️</div><p>${text}</p>`;
	gallery.appendChild(msgDiv);
}

// Helper: Show a loading state while we fetch new data.
function showLoading() {
	clearGallery();
	const loadDiv = document.createElement('div');
	loadDiv.className = 'placeholder';
	// Simple text + animated dots (CSS not required) for beginners
	loadDiv.innerHTML = `<div class="placeholder-icon">⏳</div><p>Loading space media...</p>`;
	gallery.appendChild(loadDiv);
}

// Helper: Create one gallery card (div) for an APOD item.
// We also attach a data-index so we can find the item later when opening the modal.
function createGalleryItem(item, index) {
	const card = document.createElement('div');
	card.className = 'gallery-item';
	card.setAttribute('data-index', index.toString());
	card.tabIndex = 0; // Make focusable for keyboard users

	// Normalize the media type (e.g., 'image' or 'video').
	const mediaType = (item.media_type || '').toLowerCase();

	// Decide which image source to show:
	// Images: use url (or hdurl as backup)
	// Videos: use thumbnail_url if provided (fallback to url)
	let displaySrc = '';
	if (mediaType === 'video') {
		displaySrc = item.thumbnail_url || item.url || '';
	} else {
		displaySrc = item.url || item.hdurl || '';
	}

	const img = document.createElement('img');
	img.src = displaySrc;
	img.alt = item.title ? `${item.title} - ${item.date}` : (mediaType === 'video' ? 'Space video' : 'Space image');

	const caption = document.createElement('p');
	caption.textContent = `${mediaType === 'video' ? '▶ ' : ''}${item.title || 'Untitled'} (${item.date || 'Unknown date'})`;

	card.appendChild(img);
	card.appendChild(caption);

	// Click & keyboard (Enter/Space) open modal with details.
	const open = () => openModalByIndex(index);
	card.addEventListener('click', open);
	card.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			open();
		}
	});

	return card;
}

// ================= Modal Logic =================
// We'll store the latest fetched items so modal can reference them.
let latestMediaItems = [];

// Grab modal elements (they exist after HTML loads).
const modal = document.getElementById('mediaModal');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalDescription = document.getElementById('modalDescription');
const modalMediaWrapper = document.getElementById('modalMediaWrapper');
const modalVideoLink = document.getElementById('modalVideoLink');
const modalCloseBtn = document.getElementById('modalCloseBtn');

let lastFocusedElement = null; // to restore focus when closing

// Extract a YouTube video ID from common URL formats. Returns null if not found.
function extractYouTubeId(url) {
	if (!url) return null;
	try {
		const u = new URL(url);
		if (u.hostname.includes('youtube.com')) {
			// watch?v=ID
			const v = u.searchParams.get('v');
			if (v) return v;
			// embed/ID
			const embedMatch = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
			if (embedMatch) return embedMatch[1];
		}
		if (u.hostname === 'youtu.be') {
			const id = u.pathname.replace('/', '').trim();
			if (id) return id;
		}
	} catch (e) {
		return null;
	}
	return null;
}

function openModalByIndex(index) {
	const item = latestMediaItems[index];
	if (!item) return;
	lastFocusedElement = document.activeElement;

	const mediaType = (item.media_type || '').toLowerCase();
	modalTitle.textContent = item.title || 'Untitled';
	modalDate.textContent = item.date || '';
	modalDescription.textContent = item.explanation || 'No explanation available.';

	// Clear previous media
	modalMediaWrapper.innerHTML = '';
	modalVideoLink.innerHTML = '';

	if (mediaType === 'video') {
			// Attempt to embed YouTube video seamlessly if URL is a YouTube link.
			// Supported patterns: https://www.youtube.com/watch?v=ID or youtu.be/ID
			const youTubeId = extractYouTubeId(item.url);
			if (youTubeId) {
				const wrapper = document.createElement('div');
				wrapper.className = 'responsive-video';
				const iframe = document.createElement('iframe');
				iframe.src = `https://www.youtube.com/embed/${youTubeId}?rel=0`; // rel=0 for cleaner related videos
				iframe.title = item.title || 'YouTube video';
				iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
				iframe.referrerPolicy = 'strict-origin-when-cross-origin';
				iframe.allowFullscreen = true;
				wrapper.appendChild(iframe);
				modalMediaWrapper.appendChild(wrapper);

				// Provide a fallback open-in-new-tab link for accessibility / if iframe blocked.
				const link = document.createElement('a');
				link.href = item.url;
				link.target = '_blank';
				link.rel = 'noopener noreferrer';
				link.textContent = 'Open on YouTube';
				modalVideoLink.appendChild(link);
			} else {
				// Fallback: show thumbnail and link (previous behavior) if not YouTube.
				const img = document.createElement('img');
				img.src = item.thumbnail_url || item.url || '';
				img.alt = item.title || 'Space video';
				modalMediaWrapper.appendChild(img);
				if (item.url) {
					const link = document.createElement('a');
					link.href = item.url;
					link.target = '_blank';
					link.rel = 'noopener noreferrer';
					link.textContent = 'Open Video in New Tab';
					modalVideoLink.appendChild(link);
				}
			}
	} else {
		// Large image
		const img = document.createElement('img');
		img.src = item.hdurl || item.url || '';
		img.alt = item.title || 'Space image';
		modalMediaWrapper.appendChild(img);
	}

	// Show modal
	modal.classList.remove('hidden');
	modal.setAttribute('aria-hidden', 'false');
	modalCloseBtn.focus();
}

function closeModal() {
	modal.classList.add('hidden');
	modal.setAttribute('aria-hidden', 'true');
	if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
		lastFocusedElement.focus();
	}
}

// Close actions: button, backdrop click, Escape key.
if (modalCloseBtn) {
	modalCloseBtn.addEventListener('click', closeModal);
}

if (modal) {
	modal.addEventListener('click', (e) => {
		if (e.target && e.target.getAttribute('data-close') === 'true') {
			closeModal();
		}
	});
}

document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
		closeModal();
	}
});

// Main function: fetch data and build the gallery.
async function fetchAndDisplayImages() {
	// Disable the button while loading so users can't spam clicks.
	getImagesBtn.disabled = true;
	const originalBtnText = getImagesBtn.textContent;
	getImagesBtn.textContent = 'Loading...';

	// Always show a loading message while we fetch new data.
	showLoading();

	try {
		const response = await fetch(apodData);
		if (!response.ok) {
			// If the network request failed (e.g. 404), throw an error to jump to catch block.
			throw new Error('Network response was not ok');
		}

		const data = await response.json();

		// Ensure we actually received an array.
		if (!Array.isArray(data)) {
			showMessage('Unexpected data format. Please try again later.');
			return;
		}

		// Keep both images AND videos (if they have at least one visual URL to display).
		const mediaItems = data.filter(item => {
			const type = (item.media_type || '').toLowerCase();
			const hasVisual = item.url || item.hdurl || item.thumbnail_url;
			return (type === 'image' || type === 'video') && hasVisual;
		});

		if (mediaItems.length === 0) {
			showMessage('No media entries found.');
			return;
		}

		// Clear whatever was there and add our new cards (images + any videos).
		clearGallery();
		latestMediaItems = mediaItems; // store for modal usage
		mediaItems.forEach((item, idx) => {
			const card = createGalleryItem(item, idx);
			gallery.appendChild(card);
		});

		hasLoadedOnce = true; // Mark that we've loaded at least once.
	} catch (error) {
		// If something went wrong (network error, JSON parse error, etc.), inform the user.
		console.error('Error fetching APOD data:', error);
		showMessage('There was a problem loading images. Please try again.');
	} finally {
		// Always re-enable the button and restore its text.
		getImagesBtn.disabled = false;
		getImagesBtn.textContent = originalBtnText;
	}
}

// Wire up the button click to trigger the fetch.
if (getImagesBtn && gallery) {
	getImagesBtn.addEventListener('click', fetchAndDisplayImages);
} else {
	// If elements are missing, log a helpful message for debugging.
	console.warn('Required DOM elements not found (button or gallery).');
}