const isMobile = /Mobi|Android/i.test(navigator.userAgent);

function buildInfoParts(properties, keys) {
    // keys may be:
    // - string: 'propName'
    // - array: ['propA','propB'] -> merged values
    // - object: { key: 'prop', label: 'Custom Label' } or { keys: ['a','b'], label: 'Custom Label' }
    let infoParts = [];

    if (!keys || !Array.isArray(keys)) return infoParts;

    keys.forEach(entry => {
        let keyList = [];
        let labelRaw = null;

        if (typeof entry === 'string') {
            keyList = [entry];
            labelRaw = entry;
        } else if (Array.isArray(entry)) {
            keyList = entry;
            labelRaw = entry[0];
        } else if (entry && typeof entry === 'object') {
            if (entry.keys) keyList = Array.isArray(entry.keys) ? entry.keys : [entry.keys];
            else if (entry.key) keyList = [entry.key];
            labelRaw = entry.label !== undefined ? entry.label : (entry.name || keyList[0]);
        } else {
            return; // unsupported entry
        }

        // collect values for all keys (merge where present)
        const values = keyList
            .map(k => properties && properties[k])
            .filter(v => v !== undefined && v !== null && v !== '');

        if (values.length) {
            const displayLabel = (typeof labelRaw === 'string')
                ? labelRaw.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                : '';
            const displayValue = values.join(' / ');
            if (displayLabel == '') {
                infoParts.push(`<strong>${displayValue}</strong>`);
            } else {
            infoParts.push(`<strong>${displayLabel}:</strong> ${displayValue}`);
            }
        }
    });

    return infoParts;
}

function showFeatureInfo(layer, properties, keys, label, options = {}) {
    const skipTooltip = Boolean(options.skipTooltip);
    const skipHumanAddress = Boolean(options.skipHumanAddress);
    const infoParts = () => buildInfoParts(properties, keys).join('<br/>');
    const htmlTemplate = () => {
        const parts = infoParts();
        return (label && parts) ? `
            <div>
                <strong>${label}</strong><br/>
                ${parts} <br/>
                <button onclick="copyToClipboard('${parts}')">Copy</button>
            </div>
        ` : '';
    }; 

    if (isMobile) {
        layer.on('click', async () => {
            let html = htmlTemplate();

            // show initial popup (link only)
            layer.bindPopup(html).openPopup();
            results.innerHTML = html; // update sidebar or results div dynamically
  
            if (!(layer instanceof L.Polygon) && !skipHumanAddress) {
                try {
                    const latlng = layer.getLatLng ? layer.getLatLng() : (layer.getCenter ? layer.getCenter() : null);
                    if (latlng) {
                        const humanAddr = await reverseGeocode(latlng.lat, latlng.lng);
                        if (humanAddr) {
                            const htmlWithAddr = html ? `${html}<br/>${humanAddr}` : `${humanAddr}`;
                            layer.bindPopup(htmlWithAddr).openPopup();
                            results.innerHTML = htmlWithAddr;
                        }
                    }
                } catch (e) {
                    console.warn('Reverse geocode failed', e);
                }
            }
        });
    } else { 
        if (layer instanceof L.Polygon) {
            const center = layer.getBounds().getCenter(); //
            // Desktop: tooltip on hover
            if (!skipTooltip) {
                layer.bindTooltip(infoParts(), { direction: 'center', permanent: false })
                layer.openTooltip(center);
            }
        } else {
            if (!skipTooltip) {
                layer.bindTooltip(infoParts(), { direction: 'top', permanent: false });
            }
        }

        // on click
        if (!(layer instanceof L.Polygon)) {
            layer.on('click', async () => {
                if (!skipTooltip) layer.closeTooltip();
                let html = htmlTemplate();
                layer.bindPopup(html).openPopup();
                results.innerHTML = html;

                try {
                    const latlng = layer.getLatLng ? layer.getLatLng() : (layer.getCenter ? layer.getCenter() : null);
                    if (latlng && !skipHumanAddress) {
                        const humanAddr = await reverseGeocode(latlng.lat, latlng.lng);
                        if (humanAddr) {
                            const htmlWithAddr = html ? `${html}<br/>${humanAddr}<br/><button onclick="copyToClipboard('${humanAddr}')">Copy Address</button>` : `${humanAddr}<br/><button onclick="copyToClipboard('${humanAddr}')">Copy Address</button>`;
                            layer.bindPopup(htmlWithAddr).openPopup();
                            results.innerHTML = htmlWithAddr;
                        }
                    }
                } catch (e) {
                    console.warn('Reverse geocode failed', e);
                }
            });
        }

    }
}

function stripHtml(html) {
    if (!html && html !== 0) return '';
    // Insert comma before every <strong> opening tag except the first one
    let s = String(html);
    let seen = 0;
    s = s.replace(/<\s*strong\b/gi, (m) => {
        seen += 1;
        return seen > 1 ? ', ' + m : m;
    });

    const div = document.createElement('div');
    div.innerHTML = s;
    return div.textContent || div.innerText || '';
}

function copyToClipboard(text) {
    const plain = stripHtml(text);
    navigator.clipboard.writeText(plain).catch(err => {
        console.error('Failed to copy: ', err);
    });
}
