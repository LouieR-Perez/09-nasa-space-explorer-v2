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

// Helper: Create one gallery card (div) for an APOD item.
function createGalleryItem(item) {
	const card = document.createElement('div');
	card.className = 'gallery-item';

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
	caption.textContent = `${item.title || 'Untitled'} (${item.date || 'Unknown date'})`;

	// If this is a video, wrap BOTH image and caption in an anchor so it opens new tab.
	if (mediaType === 'video' && item.url) {
		const link = document.createElement('a');
		link.href = item.url;
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		// Add a small play indicator to make it clear it's a video (simple and text-based)
		caption.textContent = `▶ ${caption.textContent}`;
		link.appendChild(img);
		link.appendChild(caption);
		card.appendChild(link);
	} else {
		card.appendChild(img);
		card.appendChild(caption);
	}

	return card;
}

// Main function: fetch data and build the gallery.
async function fetchAndDisplayImages() {
	// Disable the button while loading so users can't spam clicks.
	getImagesBtn.disabled = true;
	const originalBtnText = getImagesBtn.textContent;
	getImagesBtn.textContent = 'Loading...';

	// First time we fetch, remove the placeholder.
	if (!hasLoadedOnce) {
		clearGallery();
	}

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
		mediaItems.forEach(item => {
			const card = createGalleryItem(item);
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