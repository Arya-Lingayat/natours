export const displayMap = (locations) => {
  // Initialize the Leaflet map
  const map = L.map('map', {
    zoomControl: true,
    zoomAnimation: true,
    fadeAnimation: true,
    scrollWheelZoom: false,
  }).setView([0, 0], 2);

  // Add the tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 14,
  }).addTo(map);

  const bounds = L.latLngBounds();

  // Loop through locations and add markers
  locations.forEach((loc) => {
    // Check if coordinates are valid
    if (
      loc.coordinates &&
      loc.coordinates.length === 2 &&
      !isNaN(loc.coordinates[0]) &&
      !isNaN(loc.coordinates[1])
    ) {
      // Convert [longitude, latitude] to [latitude, longitude]
      const coordinates = [loc.coordinates[1], loc.coordinates[0]];

      // Create a custom marker element
      const el = document.createElement('div');
      el.className = 'marker';

      // Create and add the marker to the map
      L.marker(coordinates, {
        icon: L.divIcon({
          className: 'marker',
          html: el,
          iconSize: [32, 40],
          iconAnchor: [16, 40],
        }),
      })
        .setLatLng(coordinates)
        .addTo(map);

      bounds.extend(coordinates);

      // console.log(bounds);

      L.popup({
        offset: [0, 30], // Set the offset (in pixels) for the popup
      })
        .setLatLng(coordinates) // Set the position of the popup
        .setContent(`<p>Day ${loc.day}: ${loc.description}</p>`) // Set the HTML content of the popup
        .addTo(map); // Add the popup to the map
      // Optional: Add popup

      // Extend bounds to include marker coordinates
    } else {
      console.warn('Invalid coordinates for location:', loc);
    }
  });

  // Fit the map to the bounds of all markers
  if (bounds.isValid()) {
    map.fitBounds(bounds, {
      padding: {
        top: 200,
        bottom: 150,
        left: 50,
        right: 50,
      },
      maxZoom: 12,
    });
  } else {
    console.warn('No valid locations to fit in bounds.');
  }

  // Adjust the map to fit the container size
  map.invalidateSize();
};
