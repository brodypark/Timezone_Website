const timezoneSelect = document.getElementById('timezone-select');
const cityInput = document.getElementById('city-input');
const timeDisplay = document.getElementById('time-display');
const dstStatus = document.getElementById('dst-status');

const allTimezones = Intl.supportedValuesOf('timeZone');

// 1. Populate Dropdown Options
function populateTimezones() {
  const userLocalZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  allTimezones.forEach(zone => {
    const option = document.createElement('option');
    option.value = zone;

    const parts = zone.split('/');
    if (parts.length > 1) {
      const region = parts[0];
      const city = parts.slice(1).join(' / ').replace(/_/g, ' ');
      option.textContent = `${city} (${region})`;
    } else {
      option.textContent = zone;
    }

    if (zone === userLocalZone) {
      option.selected = true;
    }

    timezoneSelect.appendChild(option);
  });
}

// 2. DST Detection Logic
function isDaylightSavingsTime(timeZoneName) {
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);

  // Helper to get time offset in minutes for a specific date/zone
  const getOffset = (date) => {
    const format = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneName,
      timeZoneName: 'shortOffset'
    }).format(date);
    
    // Extract GMT offset string like GMT-5 or GMT+1
    const match = format.match(/GMT([+-]\d+)?(:(\d+))?/);
    if (!match || !match[1]) return 0;
    
    const hours = parseInt(match[1], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    return hours * 60 + (hours < 0 ? -minutes : minutes);
  };

  const currentOffset = getOffset(now);
  const janOffset = getOffset(jan);
  const julOffset = getOffset(jul);

  // If offsets differ across seasons, the region observes DST
  const observesDST = janOffset !== julOffset;
  const isDSTActive = observesDST && currentOffset === Math.max(janOffset, julOffset);

  return { observesDST, isDSTActive };
}

// 3. Update Clock & DST Indicator
function updateTime() {
  const selectedZone = timezoneSelect.value;
  if (!selectedZone) return;

  const now = new Date();

  // Format Time Display
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: selectedZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });

  timeDisplay.textContent = formatter.format(now);

  // Update DST Status Indicator
  const { observesDST, isDSTActive } = isDaylightSavingsTime(selectedZone);
  
  if (!observesDST) {
    dstStatus.textContent = "☀️ Standard Time (No DST Observed)";
    dstStatus.className = "dst-badge dst-inactive";
  } else if (isDSTActive) {
    dstStatus.textContent = "⚡ Daylight Saving Time ACTIVE (Daylight Time)";
    dstStatus.className = "dst-badge dst-active";
  } else {
    dstStatus.textContent = "❄️ Daylight Saving Time INACTIVE (Standard Time)";
    dstStatus.className = "dst-badge dst-inactive";
  }
}

// 4. City Search Feature
cityInput.addEventListener('input', (e) => {
  const searchCity = e.target.value.toLowerCase().trim().replace(/\s+/g, '_');
  if (!searchCity) return;

  // Search for matching city in the IANA timezones list
  const match = allTimezones.find(zone => {
    const cityPart = zone.split('/').slice(1).join('_').toLowerCase();
    return cityPart.includes(searchCity);
  });

  if (match) {
    timezoneSelect.value = match;
    updateTime();
  }
});

// Initialize
populateTimezones();
updateTime();

timezoneSelect.addEventListener('change', updateTime);
setInterval(updateTime, 1000);