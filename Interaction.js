const isMobile = /Mobi|Android/i.test(navigator.userAgent);

function showInfo(properties, layer) {
    const info = properties.address || properties.name || 'No info';

    if (isMobile) {
        // Mobile: show popup with copy button
        layer.bindPopup(`
           <div>
               ${info} <br/>
               <button onclick="copyToClipboard('${info}')">Copy</button>
           </div>
       `).openPopup();
    } else {
        // Desktop: show tooltip
        const latlng = layer.getBounds().getCenter(); // polygon centroid
        layer.bindTooltip(info, { permanent: false, direction: 'top' })
            .setLatLng(latlng)
            .openTooltip();

        layer.bindTooltip(info, { permanent: false, direction: 'top' }).openTooltip();
    }

    // Update side info box for both
    results.innerHTML = info;
}


function showFeatureInfo(layer, info) {
    // Update side info box
    results.innerHTML = info;

    if (isMobile || layer instanceof L.Polygon) {
        // Mobile or polygons: show popup
        layer.bindPopup(`
           <div>
               ${info} <br/>
               <button onclick="copyToClipboard('${info}')">Copy</button>
           </div>
       `).openPopup();
    } else {
        // Desktop: tooltip on hover, popup on click
        layer.bindTooltip(info, { direction: 'top', className: 'custom-tooltip' });

        // Also show popup when clicked
        layer.on('click', () => {
            layer.bindPopup(`
               <div>
                   ${info} <br/>
                   <button onclick="copyToClipboard('${info}')">Copy</button>
               </div>
           `).openPopup();
        });
    }
}


