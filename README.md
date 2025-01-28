# Itzling_Street_Network

The goal of this web map was to show the connectedness of streets of similar types and their relative importance. Under the assumption that streets can be categorised by their importance, this map should reveal the stress lying on the street in question.  
This map also shows the connectivity of streets.
## Data

### Source

[OpenStreetMap](https://www.openstreetmap.org/#map=12/47.8017/13.1469), extracted via [Overpass Turbo](https://overpass-turbo.eu)  

![Overpass turbo](/images/overpass_turbo.png)

### Pre-Processing

1. **Dissolve** streets on their name and ID: OSM (poly-) lines may splice streets into parts between intersections. For this map, this was not intended as streetnetworks were to show every street connected to other complete streets.

   ![Dissolve](/images/dissolve.png)
2. **Assign ID to streets** to handle each (complete) street as a whole and access them programmatically by adding a column to the data table containing the rows index.  
3.  **Line intersections**: as the website treats the streets as a network's edges, nodes had to be calculated on street intersections.
   ![Intersect](/images/intersect.png)

As OSM provides a wide range of different types of roads, a "hierarchy" was defined, trying to classify the streets by their importance to overall traffic. For this, the following weights were created for calculations:

   `"motorway": 13,  
    "primary": 12,  
    "secondary": 11,  
    "tertiary": 10,  
    "residential": 9,  
    "living_street": 8,  
    "service": 7,  
    "motorway_link": 6,  
    "track": 5,  
    "cycleway": 4,  
    "footway": 3,  
    "path": 2,  
    "unclassified": 1`  

## How it works

![stepbystep.jpeg](/images/stepsbystep.jpeg)

I) get weight of the clicked on street  
II) identify all nodes and iterate over them  
III) check if connected street's weight is smaller than the initial street's weight  
IV) identify all nodes in connceted street and iterate over them  
V) & VI)  check if lower connected street's weight is smaller than the street's weight  
VII) continue to next initial node  
VIII) done

