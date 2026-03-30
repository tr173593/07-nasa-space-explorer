// Get references to HTML elements
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesBtn = document.getElementById('getImagesBtn');
const gallery = document.getElementById('gallery');
const loadingMessage = document.getElementById('loadingMessage');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModal');

// Setup the date inputs
setupDateInputs(startInput, endInput);

// NASA API
const API_KEY = 'P4VWvgF97WkMtaIsUQfss7mpeGojKb91k5kR9m8e'; 
const API_URL = 'https://api.nasa.gov/planetary/apod';

// Button click
getImagesBtn.addEventListener('click', getAndDisplayImages);

// When page loads, auto-fill dates and fetch 9 APOD items
window.addEventListener('load', function() {
  const today = new Date();
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - 8);

  const endDate = today.toISOString().split('T')[0];
  const startDate = startDay.toISOString().split('T')[0];

  // Set the date inputs to the 9-day range
  startInput.value = startDate;
  endInput.value = endDate;

  // Allow today's date in the inputs for this auto-load feature
  startInput.max = endDate;
  endInput.max = endDate;

  // Use existing fetch/display logic
  getAndDisplayImages();
});

// Modal close button
closeModalBtn.addEventListener('click', closeTheModal);

// Close modal when clicking outside of it
modal.addEventListener('click', function(event) {
  if (event.target === modal) {
    closeTheModal();
  }
});

// Main function to fetch and display images
async function getAndDisplayImages() {
  const start = startInput.value;
  const end = endInput.value;

  // Validate dates
  if (!start || !end) {
    alert('Please select both dates');
    return;
  }

  // Always use a 9-day range ending on the selected end date
  const selectedEnd = new Date(end);
  const adjustedStart = new Date(selectedEnd);
  adjustedStart.setDate(selectedEnd.getDate() - 8);

  const finalStart = adjustedStart.toISOString().split('T')[0];
  const finalEnd = selectedEnd.toISOString().split('T')[0];

  // Update inputs so users can see the final 9-day range being used
  startInput.value = finalStart;
  endInput.value = finalEnd;

  // Show loading
  loadingMessage.classList.remove('hidden');

  try {
    // Fetch all APOD items for the date range in one request
    // thumbs=true gives a thumbnail when the APOD item is a video
    const url = `${API_URL}?start_date=${finalStart}&end_date=${finalEnd}&thumbs=true&api_key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch APOD data. Check your API key.');
    }

    const data = await response.json();

    // NASA may return fewer than 9 items for recent dates.
    // If that happens, fetch older days one-by-one until we have 9.
    let allItems = Array.isArray(data) ? data : [];

    if (allItems.length < 9) {
      const extraItems = await backfillOlderDays(finalStart, allItems, 9);
      allItems = allItems.concat(extraItems);
    }

    displayImages(allItems);
    loadingMessage.classList.add('hidden');

  } catch (err) {
    loadingMessage.classList.add('hidden');
    alert('Error: ' + err.message);
  }
}

// Fetch older APOD entries until we reach the target count
async function backfillOlderDays(startDate, existingItems, targetCount) {
  const extras = [];
  const usedDates = {};

  // Remember dates we already have so we don't add duplicates
  existingItems.forEach(function(item) {
    usedDates[item.date] = true;
  });

  let day = new Date(startDate);
  day.setDate(day.getDate() - 1);
  let attempts = 0;

  while (existingItems.length + extras.length < targetCount && attempts < 30) {
    const dayStr = day.toISOString().split('T')[0];

    if (!usedDates[dayStr]) {
      const dayUrl = `${API_URL}?date=${dayStr}&thumbs=true&api_key=${API_KEY}`;
      const dayResponse = await fetch(dayUrl);

      if (dayResponse.ok) {
        const dayData = await dayResponse.json();
        extras.push(dayData);
        usedDates[dayStr] = true;
      }
    }

    day.setDate(day.getDate() - 1);
    attempts++;
  }

  return extras;
}

// Show images in gallery
function displayImages(imageList) {
  gallery.innerHTML = '';

  if (imageList.length === 0) {
    gallery.innerHTML = '<div class="placeholder"><div class="placeholder-icon">🔭</div><p>No images found</p></div>';
    return;
  }

  // Sort by date (oldest to newest), then keep exactly 9 cards
  imageList.sort(function(a, b) {
    return new Date(a.date) - new Date(b.date);
  });
  const nineItems = imageList.slice(-9);

  nineItems.forEach(function(image) {
    const imageSrc = image.media_type === 'image' ? image.url : image.thumbnail_url;

    const card = document.createElement('div');
    card.className = 'gallery-item';
    card.innerHTML = `
      <img src="${imageSrc || ''}" alt="${image.title || 'NASA APOD image'}" />
      <p><strong>${image.title || 'Untitled'}</strong></p>
      <p class="gallery-date">📅 ${image.date}</p>
    `;

    card.addEventListener('click', function() {
      showModal(image);
    });

    gallery.appendChild(card);
  });
}

// Open modal with image details
function showModal(image) {
  const imageSrc = image.media_type === 'image' ? image.url : image.thumbnail_url;
  document.getElementById('modalImage').src = imageSrc;
  document.getElementById('modalTitle').textContent = image.title;
  document.getElementById('modalDate').textContent = '📅 Date: ' + image.date;
  document.getElementById('modalExplanation').textContent = image.explanation || 'No explanation available.';

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// Close modal
function closeTheModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}
