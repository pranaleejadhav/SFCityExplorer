const neighborhoodOptions = document.getElementById('neighborhood-options');
const subCheckboxes = neighborhoodOptions.querySelectorAll('input[type=checkbox]');
const togglePanelBtn = document.getElementById('toggleBtn');
const modal = document.getElementById('modal');
const arrow = togglePanelBtn.querySelector('.arrow');
const toggleButtonText = document.getElementById('toggle-span');
let searchMarker = null;
let selectedNeighborhood = null;

const map = L.map('map').setView([37.7749, -122.4194], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
 maxZoom: 19,
 attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Optionally, deselect on map click outside
map.on('click', (e) => {
 // Check if click is outside any neighborhood
 if (!e.originalEvent.target.closest('.leaflet-interactive')) {
   selectedNeighborhood = null;
   // Disable and uncheck sub-checkboxes
   subCheckboxes.forEach(cb => {
     cb.disabled = true;
     cb.checked = false;
   });
 }
});

togglePanelBtn.addEventListener('click', () => {
 const isOpen = modal.classList.toggle('show');
 arrow.textContent = isOpen ? '▲' : '▼';
 toggleButtonText.textContent = isOpen ? 'Hide panel' : 'Show panel';
});


async function addLayerToMap(layerName) {
 const config = LayerConfig[layerName];
 if (!config) return console.warn('Layer not found:', layerName);

 if (!layers[layerName]) {
   layers[layerName] = L.layerGroup().addTo(map);
 }

 const layerGroup = layers[layerName];

 const finalUrl = config.baseUrl && selectedNeighborhood ? `${config.baseUrl}/${selectedNeighborhood.replace(/\//g, '_')}.geojson` : config.url

 if (finalUrl) {

   // Show loading indicator
   results.innerHTML = "Loading Data...";

   try {
     const res = await fetch(finalUrl);
     if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
     const data = await res.json();

     // Clear previous features so re-adding the same layer doesn't duplicate
     layerGroup.clearLayers();

     L.geoJSON(data, {
       style: config.style,
       pointToLayer: config.pointToLayer,
       onEachFeature: config.onEachFeature
     }).addTo(layerGroup);

     results.innerHTML = "";
   } catch (err) {
     console.error('Failed to load layer:', err);
     results.innerHTML = "Failed to load data.";
   }
 }
}