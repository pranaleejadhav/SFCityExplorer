async function reverseGeocode(lat, lng) {
   const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
   const res = await fetch(url);
   const data = await res.json();
   return data.display_name; // full address
}

// Color generation for parking zones
function parkingZonesPalette(str) {
   if (!str) return '#999999';

   const colorPalette = {
       'A': '#FF6B6B', 'B': '#4ECDC4', 'C': '#45B7D1', 'D': '#FFA07A',
       'E': '#98D8C8', 'F': '#F7B731', 'G': '#5F27CD', 'H': '#00D2D3',
       'I': '#FF9FF3', 'J': '#54A0FF', 'K': '#48DBFB', 'L': '#1DD1A1',
       'M': '#FF6348', 'N': '#2E86DE', 'O': '#EE5A6F', 'P': '#C44569',
       'Q': '#786FA6', 'R': '#F8B500', 'S': '#EA2027', 'T': '#009432',
       'U': '#0652DD', 'V': '#9C88FF', 'W': '#FBC531', 'X': '#E17055',
       'Y': '#6C5CE7', 'Z': '#FD79A8', 'BB': '#00B894', 'AA': '#FDCB6E'
   };

   const key = str.trim().toUpperCase();
   if (colorPalette[key]) return colorPalette[key];

   const firstChar = key.charAt(0);
   if (colorPalette[firstChar]) return colorPalette[firstChar];

   let hash = 0;
   for (let i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
   }
   const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
   return "#" + "00000".substring(0, 6 - c.length) + c;
}

const streetColorPalette = [
   '#1E90FF', '#10AC84', '#EE5253', '#FF9F43', '#5F27CD',
   '#00D2D3', '#C44569', '#576574', '#F368E0', '#222F3E',
   '#7B1FA2', '#FF5722', '#009688', '#FFC107', '#3F51B5',
   '#8BC34A', '#E91E63', '#607D8B', '#FFEB3B', '#795548'
];

function stringHash(str) {
   let hash = 0;
   for (let i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
   }
   return Math.abs(hash);
}

function streetNameToColor(streetName) {
   if (!streetName) return '#999';

   const hash = stringHash(streetName.toUpperCase());
   const index = hash % streetColorPalette.length;
   const color = streetColorPalette[index];
   return color;
}



