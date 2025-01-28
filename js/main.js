
var map = L.map('map', {
    center: [47.823557, 13.039613],
    zoom: 16
});

// add open street map as base layer
var osmap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);


// add OpenTopoMap from Leaflet providers https://leaflet-extras.github.io/leaflet-providers/preview/
var otmap = L.tileLayer.provider('OpenTopoMap');


// for using the two base maps in the layer control, I defined a baseMaps variable
var baseMaps = {
    "OpenStreetMap": osmap,
    "OpenTopoMap": otmap
}

//
//---- Part 2: Adding a scale bar
//

L.control.scale({position:'topleft',imperial:true}).addTo(map);


//
//---- Part 4: adding features (polygons) from the geojson file 
//

var streetStyle = {
    "color": "#870D80",
    "weight": 2.4,
}

var highlight = {
    'color': 'orange',
    'weight': 7,
    'opacity': 0.7
};

var pickStyle = {
    'color': 'yellow',
    'weight': 10.5,
    'opacity': 1
};

var serviced = L.geoJson(serviced, {
    style: pickStyle,
    onEachFeature: function (feature, layer) {
        layer.bindPopup('Street id: ' + feature.properties.street_id + "<br>Street type: " + feature.properties.highway);
    }
});

var streetTypeWeights = {
    "motorway": 13,
    "motorway_link": 6,
    "primary": 12,
    "secondary": 11,
    "tertiary": 10,
    "residential": 9,
    "living_street": 8,
    "service": 7,
    "track": 5,
    "cycleway": 4,
    "footway": 3,
    "path": 2,
    "unclassified": 1
};

var simpleEdges = [];
var simpleNodes = [];
var streetsLayer;
var highlightedStreets = new Set();

// Function to load GeoJSON data
function loadGeoJson(url, callback) {
    fetch(url)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error('Error loading GeoJSON:', error));
}

// Process edges (streets)
function processEdges(edges) {
    edges.features.forEach(feature => {
        var weight = streetTypeWeights[feature.properties.highway];
        simpleEdges.push({
            name: feature.properties.name,
            street_id: feature.properties.street_id,
            weight: weight,
            geometry: feature.geometry
        });
    });
}

// Process nodes (intersections)
function processNodes(nodes) {
    nodes.features.forEach(feature => {
        simpleNodes.push({
            street_id: feature.properties.street_id,
            street_id_2: feature.properties.street_id_2,
            geometry: feature.geometry
        });
    });
}

// Find all connected streets via nodes
function findAllConnectedStreetsViaNodes(streetId) {
    var visited = new Set();
    var queue = [streetId];
    var allConnectedStreets = new Set();

    var initialEdge = simpleEdges.find(edge => edge.street_id === streetId);
    if (!initialEdge) {
        console.error('Street ID not found:', streetId);
        return [];
    }
    var initialWeight = initialEdge.weight;

    while (queue.length > 0) {
        var currentStreet = queue.shift();
        if (!visited.has(currentStreet)) {
            visited.add(currentStreet);
            allConnectedStreets.add(currentStreet);

            var connectedNodes = simpleNodes.filter(node =>
                node.street_id === currentStreet || node.street_id_2 === currentStreet
            );

            connectedNodes.forEach(node => {
                var nodeStreetId = node.street_id;
                var nodeStreetId2 = node.street_id_2;

                if (nodeStreetId !== currentStreet) {
                    var edge = simpleEdges.find(edge => edge.street_id === nodeStreetId);
                    if (edge && edge.weight < initialWeight && !visited.has(nodeStreetId)) {
                        queue.push(nodeStreetId);
                    }
                }

                if (nodeStreetId2 !== currentStreet) {
                    var edge = simpleEdges.find(edge => edge.street_id === nodeStreetId2);
                    if (edge && edge.weight < initialWeight && !visited.has(nodeStreetId2)) {
                        queue.push(nodeStreetId2);
                    }
                }
            });
        }
    }

    return Array.from(allConnectedStreets);
}

// Highlight connected streets on the map
function highlightConnectedStreets(streetId) {
    var initialEdge = simpleEdges.find(edge => edge.street_id === streetId);
    if (!initialEdge) {
        console.error('Street ID not found:', streetId);
        return;
    }
    var initialWeight = initialEdge.weight;

    var connectedStreets = findAllConnectedStreetsViaNodes(streetId);

    // Clear previous highlights
    highlightedStreets.forEach(function (streetId) {
        streetsLayer.eachLayer(function (layer) {
            if (layer.feature.properties.street_id === streetId) {
                layer.setStyle(streetStyle);
            }
        });
    });

    highlightedStreets.clear();

    // Highlight new connected streets
    streetsLayer.eachLayer(function (layer) {
        var layerWeight = streetTypeWeights[layer.feature.properties.highway];
        if (connectedStreets.includes(layer.feature.properties.street_id) && layerWeight <= initialWeight) {
            layer.setStyle(highlight);
            highlightedStreets.add(layer.feature.properties.street_id);
        } else {
            layer.setStyle(streetStyle);
        }
    });
}

// Initialize the map with data
function initializeMap() {
    loadGeoJson('data/intersections_indexed.geojson', processNodes);
    loadGeoJson('data/streets_sbg_indexed.geojson', function(data) {
        processEdges(data);
        streetsLayer = L.geoJson(data, {
            style: streetStyle,
            onEachFeature: function (feature, layer) {
                layer.on({

                    click: function (e) {
                        highlightConnectedStreets(feature.properties.street_id);
                        layer.setStyle(pickStyle);

                    }
                });
                layer.bindPopup('Street id: ' + feature.properties.street_id + "<br>Street type: " + feature.properties.highway);
            }
        }).addTo(map);
    });
}

initializeMap();

// Function to get color based on weight
function getColor(weight) {
    var maxWeight = 13; // Maximum weight value
    var minWeight = 1;  // Minimum weight value
    var ratio = (weight - minWeight) / (maxWeight - minWeight);
    var red = 255;
    var green = Math.floor(255 * ratio);
    var blue = 0;
    return `rgb(${red},${green},${blue})`;
}
