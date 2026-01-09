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
   },
    FARMERSMARKETS: {
        name: 'farmersmarkets',
        controlId: 'show-farmers-markets',
        resource: 'Resources/sf-farmers-market.geojson'
    },
    LIBRARIES: {
        name: 'libraries',
        controlId: 'show-libraries',
        resource: 'Resources/sf-libraries.geojson'
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
           if (!map.hasLayer(layers[layerName])) {
               map.addLayer(layers[layerName]);
           }
       } else {
           map.removeLayer(layers[layerName]);
           layers[layerName].clearLayers();
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
           showFeatureInfo(layer, feature.properties, [{key: 'nhood', label: ''}], 'Neighborhood Info');

           layer.on('mouseover', () => {
               layer.setStyle({ weight: 3 })
           });
           layer.on('mouseout', () => layer.setStyle({ weight: 1 }));

           layer.on('click', () => {
               selectedNeighborhood = feature.properties.nhood;

               subCheckboxes.forEach(cb => cb.disabled = false);
               map.removeLayer(layers[LayerTypes.TIMELIMITEDPARKING.name]);
               timeLimitedParkingCheckbox.checked = false;
               timeLimitedParkingCheckbox.dispatchEvent(new Event('change'));

               map.removeLayer(layers[LayerTypes.STREETCLEANINGMAP.name]);

               // Zoom to the selected neighborhood bounds (with a max zoom)
               if (typeof layer.getBounds === 'function') {
                   try {
                       const bounds = layer.getBounds();
                       if (bounds && bounds.isValid && bounds.isValid()) {
                           map.fitBounds(bounds.pad ? bounds.pad(0.1) : bounds, { padding: [20, 20], maxZoom: 15 });
                       } else {
                           map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
                       }
                   } catch (e) {
                       console.warn('Could not fit bounds for selected neighborhood', e);
                   }
               }

               addLayerToMap(LayerTypes.STREETCLEANINGMAP.name);
               if (!map.hasLayer(layers[LayerTypes.STREETCLEANINGMAP.name])) {
                   map.addLayer(layers[LayerTypes.STREETCLEANINGMAP.name]);
               }
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
           showFeatureInfo(layer, feature.properties, [{key: ['weekday', 'fullname'], label: 'Cleaning Schedule'}, {key: 'hoursRange', label: 'Time'}, {key: 'limits', label: 'Street Limits'}, {key: 'week_info', label: 'Weeks'}], '🧹 Street Cleaning Info');
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
            showFeatureInfo(layer, feature.properties, [], 'Parking Meter Info', { skipTooltip: true });
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
           showFeatureInfo(layer, feature.properties, [{key: 'rpparea1', label: 'Parking Zone'}, 'regulation', {key: 'hrlimit', label: 'Hour Limit'}, 'days', {key: ['from_time', 'to_time'], label: 'Time'}, 'exceptions'], 'Street Info');
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
           showFeatureInfo(layer, feature.properties, [], 'Bicycle Parking Info', { skipTooltip: true });
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
           const name = props.facility_name;
           const address = props.street_address || '';
           const location = props.location || '';
           const service = props.SERVICES || '';
           const owner = props.owner || '';
           const phone = props.phone || '';
           const info = address ? `${name}<br>${address}<br>${service}` : name;
           layer.bindTooltip(info, { permanent: false, direction: "top" });
           layer.on('click', () => {
               results.innerHTML = `Garages/Lots: ${info}`
           });
            showFeatureInfo(layer, feature.properties, ['facility_name', 'street_address', 'location', 'SERVICES', 'owner', 'phone'], 'Garages/Lots');
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
            showFeatureInfo(layer, feature.properties, ['name'], 'Public Restroom/Water Fountain Info');
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
           showFeatureInfo(layer, feature.properties, ['locations', 'title'], 'Film Location Info');
       }
   },

    [LayerTypes.FARMERSMARKETS.name]: {
        url: LayerTypes.FARMERSMARKETS.resource,

        pointToLayer: (feature, latlng) => {
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: 'garage-icon',
                    html: `<div style="font-size: 24px; line-height: 1;">🧺</div>`,
                    iconSize: [24, 24]
                })
            });
        },

        onEachFeature: (feature, layer) => {
            showFeatureInfo(layer, feature.properties, ['name', 'days', 'hours', 'seasonal', 'year_round'], 'Farmers Market Info');
        }
    },
    [LayerTypes.LIBRARIES.name]: {
        url: LayerTypes.LIBRARIES.resource,

        pointToLayer: (feature, latlng) => {
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: 'library-icon',
                    html: `<div style="font-size: 24px; line-height: 1;">📚</div>`,
                    iconSize: [24, 24]
                })
            });
        },

        onEachFeature: (feature, layer) => {
            showFeatureInfo(layer, feature.properties, ['name', 'address', 'phone', 'hours'], 'Library Info', { skipHumanAddress: true });
        }
    }
};

addLayerToMap(LayerTypes.NEIGHBORHOOD.name);


