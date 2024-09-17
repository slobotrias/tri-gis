//  // Example markers
//     const marker1 = L.marker([-6.75298, 141.99373]).addTo(this.map).bindPopup('Marker 1');
//     const marker2 = L.marker([-6.10444, 142.27833]).addTo(this.map).bindPopup('Marker 2');

//     // Get LatLng of the two markers
//     const latlng1 = marker1.getLatLng();
//     const latlng2 = marker2.getLatLng();

//     // Calculate the distance between the two markers
//     const distance = latlng1.distanceTo(latlng2); // distance in meters

//     console.log(`Distance between Marker 1 and Marker 2: ${distance.toFixed(2)} meters`);

//     // Optionally, display the distance in a popup or as an alert
//     marker1.bindPopup(`Distance to Marker 2: ${distance.toFixed(2)} meters`).openPopup();