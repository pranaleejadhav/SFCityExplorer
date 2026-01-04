// Geocoding function
async function geocodeLocation(query) {
   try {
       const response = await fetch(
           `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, San Francisco, CA&limit=1`
       );
       const data = await response.json();
       if (data && data.length > 0) {
           return {
               lat: parseFloat(data[0].lat),
               lng: parseFloat(data[0].lon)
           };
       }
       return null;
   } catch (error) {
       console.error('Geocoding error:', error);
       return null;
   }
}

// Show search result
function showSearchResult(lat, lng, radius) {
   if (searchMarker) {
       map.removeLayer(searchMarker);
   }
   console.log(lat)
   searchMarker = L.marker([lat, lng], {
       icon: L.divIcon({
           className: 'search-marker',
           html: '<div style="background-color: #FF0000; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5);"></div>',
           iconSize: [18, 18],
           iconAnchor: [9, 9]
       })
   }).addTo(map);

   // Calculate zoom level based on radius
   let zoomLevel;
   if (radius <= 0.5) zoomLevel = 15;
   else if (radius <= 1) zoomLevel = 14;
   else if (radius <= 2) zoomLevel = 13;
   else if (radius <= 3) zoomLevel = 12;
   else zoomLevel = 11;

   map.setView([lat, lng], zoomLevel);
}

// Search by address
document.getElementById('search-address-btn').addEventListener('click', async () => {
   // 1. If user selected from autocomplete
   if (selectedLocation) {
       showSearchResult(
           selectedLocation.lat,
           selectedLocation.lng,
           0.5
       );
       return;
   }

   // 2. Fallback: manual text search
   const address = document.getElementById('address-input').value.trim();

   if (!address) {
       alert('Please enter an address');
       return;
   }

   const location = await geocodeLocation(address);
   if (location) {
       showSearchResult(location.lat, location.lng, 0.5);
   } else {
       alert('Address not found. Please try a different search.');
   }
});