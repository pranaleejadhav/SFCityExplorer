const input = document.getElementById("address-input");
const list = document.getElementById("suggestions");

let timer;
let index = -1;

input.addEventListener("input", () => {
   let selectedLocation = null;
   clearTimeout(timer);
   const q = input.value.trim();
   if (q.length < 3) {
       list.innerHTML = "";
       return;
   }
   timer = setTimeout(() => search(q), 400);
});

async function search(q) {
   const results = [];

   // Photon (stores + addresses)
   const photon = await fetch(
       `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=37.7749&lon=-122.4194&limit=5`
   ).then(r => r.json()).catch(() => null);

   if (photon?.features) {
       photon.features.forEach(f => {
           results.push({
               label: f.properties.name || f.properties.street,
               full: formatPhoton(f),
               lat: f.geometry.coordinates[1],
               lon: f.geometry.coordinates[0],
               type: f.properties.osm_value === "house" ? "Address" : "Store"
           });
       });
   }

   // Nominatim fallback (SF only)
   if (results.length < 5) {
       const nom = await fetch(
           `https://nominatim.openstreetmap.org/search?` +
           `format=json&addressdetails=1&namedetails=1&limit=5` +
           `&viewbox=-122.5247,37.8324,-122.3569,37.7081&bounded=1` +
           `&q=${encodeURIComponent(q)}`
       ).then(r => r.json()).catch(() => []);

       nom.forEach(p => {
           if (!results.some(r => r.full === p.display_name)) {
               results.push({
                   label: p.namedetails?.name || p.display_name,
                   full: p.display_name,
                   lat: p.lat,
                   lon: p.lon,
                   type: p.type === "house" ? "Address" : "Place"
               });
           }
       });
   }

   render(results.slice(0, 5));
}

function formatPhoton(f) {
   const p = f.properties;
   return [
       p.name,
       p.street,
       p.housenumber,
       p.city || "San Francisco"
   ].filter(Boolean).join(", ");
}

function render(items) {
   list.innerHTML = "";
   index = -1;

   items.forEach((item, i) => {
       const li = document.createElement("li");
       li.innerHTML = `
       <div>${item.full}</div>
     `;
       li.onclick = () => select(item);
       list.appendChild(li);
   });
}

function select(item) {
   input.value = item.full;
   selectedLocation = {
       lat: parseFloat(item.lat),
       lng: parseFloat(item.lon)
   };
   list.innerHTML = "";
}

// Keyboard navigation
input.addEventListener("keydown", e => {
   const items = list.querySelectorAll("li");
   if (!items.length) return;

   if (e.key === "ArrowDown") {
       index = (index + 1) % items.length;
   } else if (e.key === "ArrowUp") {
       index = (index - 1 + items.length) % items.length;
   } else if (e.key === "Enter") {
       e.preventDefault();
       items[index]?.click();
       return;
   } else {
       return;
   }

   items.forEach(el => el.classList.remove("active"));
   items[index].classList.add("active");
});

// Hide when clicking outside
document.addEventListener("click", (e) => {
   if (
       !input.contains(e.target) &&
       !suggestions.contains(e.target)
   ) {
       suggestions.innerHTML = "";
   }
});