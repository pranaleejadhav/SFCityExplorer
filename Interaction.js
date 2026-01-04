const isMobile = /Mobi|Android/i.test(navigator.userAgent);

function buildInfoParts(properties, keys) {
    let infoParts = [];

    keys.forEach(key => {
        if (properties[key] !== undefined && properties[key] !== null && properties[key] !== '') {
            const label = key.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase());
            infoParts.push(`<strong>${label}:</strong> ${properties[key]}`);
        }
    });

    return infoParts;
}

function showFeatureInfo(layer, properties, keys, label, geoAddress = null) {
    const infoParts = () => buildInfoParts(properties, keys).join('<br/>');
    const htmlTemplate = () => `
        <div>
            <strong>${label}</strong><br/>
            ${infoParts()} <br/>
            <button onclick="copyToClipboard('${infoParts()}')">Copy</button>
            ${geoAddress ? `<br/><button onclick="copyToClipboard('${geoAddress}')">Copy Address</button>` : ''}
        </div>
    `;

    if (isMobile) {
        layer.on('click', () => {
            const html = htmlTemplate();
            layer.bindPopup(html).openPopup();
            results.innerHTML = html; // update sidebar or results div dynamically
        });
    } else {
        const center = layer.getBounds().getCenter(); //
        // Desktop: tooltip on hover
        layer.bindTooltip(infoParts(), { direction: 'center', permanent: false})
        layer.openTooltip(center);

        // if (layer instanceof L.Polygon) {
        //     layer.on('click', () => {
        //         layer.closeTooltip();
        //     });
        // }
    //     layer.on('click', () => {
    //             layer.closeTooltip();
    //             layer.setStyle({
    //     color: layer.options.color,       // outline
    //     fillColor: layer.options.fillColor, // fill
    //     weight: layer.options.weight,
    //     opacity: layer.options.opacity,
    //     fillOpacity: layer.options.fillOpacity
    // });
    //         });


        // on click
        if (!(layer instanceof L.Polygon)) {
            layer.on('click', () => {
                const html = htmlTemplate();
                layer.bindPopup(html).openPopup();
                results.innerHTML = html;
            });
        }

    }
}



