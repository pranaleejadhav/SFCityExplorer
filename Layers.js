const results = document.getElementById("results");

const LayerTypes = Object.freeze({
   NEIGHBORHOOD: {
       name: 'neighborhoods',
       controlId: 'show-neighborhoods',
       resource: 'Resources/sf-neighborhoods.geojson'
   },
   STREETCLEANINGMAP: {
       name: 'streetcleaningmap',
       controlId: '',
       resource: 'Resources/sf-street-cleaning'
   },
   METERPARKINGMAP: {
       name: 'meterParking',
       controlId: 'show-meter-parking',
       resource: 'Resources/sf-meter-parking'
   },
   TIMELIMITEDPARKING: {
       name: 'timelimitedparking',
       controlId: 'show-limited-parking-zones',
       resource: 'Resources/sf-time-limited_parking.geojson'
   },
   BICYCLEPARKING: {
       name: 'bicycleparking',
       controlId: 'show-bicycle-parking',
       resource: 'Resources/sf-bicycle-parking.geojson'
   },
   GARAGELOTS: {
       name: 'garagelots',
       controlId: 'show-garages-lots',
       resource: 'Resources/garages.geojson'
   },
   PUBLICRESTROOMS: {
       name: 'publicrestrooms',
       controlId: 'show-public-restrooms',
       resource: 'Resources/sf-public-bathrooms_and_water-fountains.geojson'
   },
   FILMLOCATIONS: {
       name: 'filmlocations',
       controlId: 'show-film-locations',
       resource: 'Resources/sf-film_locations.geojson'
   }
});

const timeLimitedParkingCheckbox = document.getElementById(LayerTypes.TIMELIMITEDPARKING.controlId);
const layers = Object.fromEntries(
   Object.values(LayerTypes).map(layer => [layer.name, L.layerGroup()])
);

const defaultLayer = LayerTypes.NEIGHBORHOOD;
const defaultCheckbox = document.getElementById(defaultLayer.controlId);
layers[defaultLayer.name].addTo(map);

Object.values(LayerTypes).forEach(layer => {
   const checkboxId = layer.controlId;
   const layerName = layer.name;
   document.getElementById(checkboxId)?.addEventListener('change', (e) => {
       if (e.target.checked) {
           if (checkboxId == LayerTypes.TIMELIMITEDPARKING.controlId) {
               map.removeLayer(layers[LayerTypes.STREETCLEANINGMAP.name]);
           }
           addLayerToMap(layerName);
           map.addLayer(layers[layerName]);
       } else {
           map.removeLayer(layers[layerName]);
       }
   });
});

const LayerConfig = {
   [LayerTypes.NEIGHBORHOOD.name]: {
       url: LayerTypes.NEIGHBORHOOD.resource,
       style: feature => ({
           color: 'black',
           weight: 1,
           fillColor: '#999',
           fillOpacity: 0.5,
           interactive: true
       }),
       onEachFeature: (feature, layer) => {

           // layer.bindTooltip(feature.properties.nhood, {
           //   permanent: false,
           //   direction: "top"
           // });

           // hover effect for desktop
           layer.on('mouseover', () => {
               layer.setStyle({ weight: 3 })
           });
           layer.on('mouseout', () => layer.setStyle({ weight: 1 }));

           // tap/click effect for mobile
           layer.on('click', () => {
               selectedNeighborhood = feature.properties.nhood;
               results.innerHTML = `Neighborhood: ${feature.properties.nhood}`

               subCheckboxes.forEach(cb => cb.disabled = false);
               map.removeLayer(layers[LayerTypes.TIMELIMITEDPARKING.name]);
               timeLimitedParkingCheckbox.checked = false;
               timeLimitedParkingCheckbox.dispatchEvent(new Event('change'));

               map.removeLayer(layers[LayerTypes.STREETCLEANINGMAP.name]);

               addLayerToMap(LayerTypes.STREETCLEANINGMAP.name);
               map.addLayer(layers[LayerTypes.STREETCLEANINGMAP.name]);
               // layer.openTooltip(); // show the tooltip on tap
               // // optionally close it after 2 seconds
               // setTimeout(() => layer.closeTooltip(), 2000);
           });
       }
   },
   [LayerTypes.STREETCLEANINGMAP.name]: {
       baseUrl: LayerTypes.STREETCLEANINGMAP.resource,
       style: feature => ({
           color: streetNameToColor(feature.properties.corridor),
           weight: 2,
           fillColor: '#999',
           fillOpacity: 0.3
       }),
       onEachFeature: (feature, layer) => {
           const props = feature.properties;

           // Build info dynamically, only include fields that exist
           let infoParts = [];

           // Weekdays / schedule
           if (props.weekday && props.fullname) {
               infoParts.push(`<strong>Cleaning Schedule:</strong> ${props.fullname} (${props.weekday})`);
           }

           // Time
           if (props.hoursRange) {
               infoParts.push(`<strong>Time:</strong> ${props.hoursRange}`);
           }

           // Limits / range of the block
           if (props.limits) infoParts.push(`<strong>Street Limits:</strong> ${props.limits}`);

           // Holidays note
           if (props.holidays && props.holidays !== "0") infoParts.push(`<strong>Holidays:</strong> Yes`);

           if (props.week_info.length) infoParts.push(`<strong>Weeks:</strong> ${props.week_info}`);

           if (infoParts.length > 0) {
               infoParts.unshift('🧹 Street Cleaning Info:');

               // Join all parts with <br>
               const info = infoParts.join('<br>');
               // console.log(info)

               layer.bindTooltip(info, { permanent: false, direction: "top" });

               layer.on('click', () => {
                   results.innerHTML = `${info}`
               });
           }
       }
   },
   [LayerTypes.METERPARKINGMAP.name]: {
       baseUrl: LayerTypes.METERPARKINGMAP.resource,
       pointToLayer: (feature, latlng) => {
           return L.marker(latlng, {
               icon: L.divIcon({
                   className: 'bicycle-icon',
                   html: '<div style="font-size: 20px; line-height: 1;">🅿</div>',
                   iconSize: [24, 24],
                   iconAnchor: [12, 12]
               })
           });
       },
       onEachFeature: (feature, layer) => {

           layer.on('click', async () => {
               const { lat, lng } = layer.getLatLng();
               const address = await reverseGeocode(lat, lng);
               layer.bindPopup(address).openPopup();

               results.innerHTML = `Parking Meter: <br/>${address}`
           });
       }
   },
   [LayerTypes.TIMELIMITEDPARKING.name]: {
       url: LayerTypes.TIMELIMITEDPARKING.resource,
       style: feature => ({
           color: parkingZonesPalette(feature.properties.rpparea1),
           weight: 2,
           fillColor: '#999',
           fillOpacity: 0.3
       }),
       onEachFeature: (feature, layer) => {
           const props = feature.properties;
           const rpparea1 = props.rpparea1;
           const regulation = props.regulation;
           const hrlimit = props.hrlimit;
           const days = props.days;
           const from_time = props.from_time || props.hrs_begin;
           const to_time = props.to_time || props.hrs_end;
           const exceptions = props.exceptions;

           // Build info dynamically, only include fields that exist
           let infoParts = [];

           if (rpparea1) infoParts.push(`<strong>Parking Zone:</strong> ${rpparea1}`);
           if (regulation) infoParts.push(`<strong>Regulation:</strong> ${regulation}`);
           if (hrlimit) infoParts.push(`<strong>Hour Limit:</strong> ${hrlimit}`);
           if (days) infoParts.push(`<strong>Days:</strong> ${days}`);
           if (from_time || to_time) {
               const timeStr = [from_time, to_time].filter(Boolean).join(' - ');
               infoParts.push(`<strong>Time:</strong> ${timeStr}`);
           }
           if (exceptions) infoParts.push(`<strong>Exceptions:</strong> ${exceptions}`);

           // Join all parts with <br>
           const info = infoParts.join('<br>');
           layer.bindTooltip(info, { permanent: false, direction: "top" });
           layer.on('click', () => {
               results.innerHTML = `Street Info: ${info}`
           });
       }
   },
   [LayerTypes.BICYCLEPARKING.name]: {
       url: LayerTypes.BICYCLEPARKING.resource,

       pointToLayer: (feature, latlng) => {
           return L.marker(latlng, {
               icon: L.divIcon({
                   className: 'bicycle-icon',
                   html: '<div style="font-size: 20px; line-height: 1;">🚴‍♂️</div>',
                   iconSize: [24, 24],
                   iconAnchor: [12, 12]
               })
           });
       },

       onEachFeature: (feature, layer) => {
           const info = feature.properties.address || feature.properties.location || '';
           layer.bindTooltip(info, { permanent: false, direction: "top" });
           layer.on('click', () => {
               results.innerHTML = `Bicycle Parking: ${info}`;
           });
       }
   },

   [LayerTypes.GARAGELOTS.name]: {
       url: LayerTypes.GARAGELOTS.resource,

       pointToLayer: (feature, latlng) => {
           return L.marker(latlng, {
               icon: L.divIcon({
                   className: 'garage-icon',
                   html: '<div style="font-size: 24px; line-height: 1;">🅿️</div>',
                   iconSize: [24, 24]
               })
           });
       },

       onEachFeature: (feature, layer) => {
           const props = feature.properties;
           const name = props.FACILITY_NAME || 'Parking Garage/Lot';
           const address = props.STREET_ADDRESS || '';
           const service = props.SERVICES || '';
           const info = address ? `${name}<br>${address}<br>${service}` : name;
           layer.bindTooltip(info, { permanent: false, direction: "top" });
           layer.on('click', () => {
               results.innerHTML = `Garages/Lots: ${info}`
           });
       }
   },


   [LayerTypes.PUBLICRESTROOMS.name]: {
       url: LayerTypes.PUBLICRESTROOMS.resource,

       pointToLayer: (feature, latlng) => {
           // Decide icon based on resource_type
           let emoji = '❓'; // fallback
           if (feature.properties.resource_type === 'drinking_water') {
               emoji = '💧';
           } else if (feature.properties.resource_type === 'restroom') {
               emoji = '🚻';
           }
           return L.marker(latlng, {
               icon: L.divIcon({
                   className: 'garage-icon',
                   html: `<div style="font-size: 24px; line-height: 1;">${emoji}</div>`,
                   iconSize: [24, 24]
               })
           });
       },

       onEachFeature: (feature, layer) => {
           const info = feature.properties.name || '';
           layer.bindTooltip(info, { permanent: false, direction: "top" });
           const resource_type = feature.properties.resource_type == 'drinking_water' ? 'Drinking water' : 'Restroom'
           layer.on('click', async () => {
               const { lat, lng } = layer.getLatLng();
               const address = await reverseGeocode(lat, lng);
               results.innerHTML = `${resource_type}: ${info}<br/>${address}`
           });
       }
   },

   [LayerTypes.FILMLOCATIONS.name]: {
       url: LayerTypes.FILMLOCATIONS.resource,

       pointToLayer: (feature, latlng) => {
           return L.marker(latlng, {
               icon: L.divIcon({
                   className: 'garage-icon',
                   html: `<div style="font-size: 24px; line-height: 1;">🎬</div>`,
                   iconSize: [24, 24]
               })
           });
       },

       onEachFeature: (feature, layer) => {
           const props = feature.properties;
           const address = props.locations || '';
           const title = props.title || '';
           const info = `${title}<br>${address}`;
           layer.bindTooltip(info, { permanent: false, direction: "top" });
           layer.on('click', async () => {
               const { lat, lng } = layer.getLatLng();
               const address = await reverseGeocode(lat, lng);
               results.innerHTML = `Film Location: ${info}<br/>${address}`
           });
       }
   }
};

addLayerToMap(LayerTypes.NEIGHBORHOOD.name);


