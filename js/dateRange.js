
// NASA's APOD API only has images from June 16, 1995 onwards
const earliestDate = '1995-06-16';

// Use yesterday as the latest date to avoid missing APOD data for "today"
const latestDateObj = new Date();
latestDateObj.setDate(latestDateObj.getDate() - 1);
const today = latestDateObj.toISOString().split('T')[0];

function setupDateInputs(startInput, endInput) {
  // Set the allowed date range
  startInput.min = earliestDate;
  startInput.max = today;
  endInput.min = earliestDate;
  endInput.max = today;

  // Set default dates (show last 9 days)
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 8);
  startInput.value = lastWeek.toISOString().split('T')[0];
  endInput.value = today;

  // When start date changes, auto-set end date to 9 days later
  startInput.addEventListener('change', function() {
    const start = new Date(startInput.value);
    const end = new Date(start);
    end.setDate(start.getDate() + 8);
    endInput.value = end > new Date(today) ? today : end.toISOString().split('T')[0];
  });
}

// Check if the date range is exactly 9 days
function isValidDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return false;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end - start;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return days === 8; // 8 day difference = 9 days inclusive
}
