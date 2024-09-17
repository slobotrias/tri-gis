import {
  Component,
  AfterViewInit,
  ViewContainerRef,
  ChangeDetectorRef,
} from '@angular/core';
import { ShapeService } from '../services/shape/shape.service';
import { SHAPE_DEFAULTS } from './map.constants';
import { MarkerService } from '../services/marker/marker.service';
import { environment } from '../../environments/environment';
import { PopupService } from '../services/popup/popup.service';
import { MarkerPopupComponent } from '../marker-popup/marker-popup.component';
import * as L from 'leaflet';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import axios from 'axios';


@Component({
  selector: 'apex-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
})
export class MapComponent implements AfterViewInit {
  // map
  private map!: L.Map;
  private insetMap!: L.Map | null;

  private startPoint: L.LatLng | null = null;
  private endPoint: L.LatLng | null = null;

  //default shape
  private baseShape: any;

  //current shape
  private currShapes: any;

  //shapes
  private contShapes: any;
  private provShapes: any;
  private distShapes: any;

  constructor(
    private markerService: MarkerService,
    private shapeService: ShapeService,
    private popupService: PopupService,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Initializes the main map and sets up the tile layer.
   */
  private initMap(): void {
    this.map = L.map('map', {
      center: [-6.315, 143.955], // Coordinates of Papua New Guinea
      zoom: 6,
    });

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
      }
    );

    // const tiles = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=${environment.mapbox.accessToken}`, {
    //   maxZoom: 18,
    //   minZoom: 3,
    // });
    this.map.attributionControl.setPrefix(false);

    tiles.addTo(this.map);
    this.loadShapes(SHAPE_DEFAULTS.PROV);
  }

  /**
   * Highlights a feature when hovered over.
   * @param e - Leaflet mouse event
   */
  private highlightFeature(e: L.LeafletMouseEvent) {
    const layer = e.target;

    layer.setStyle({
      weight: 10,
      opacity: 1.0,
      color: '#DFA612',
      fillOpacity: 0,
      fillColor: '#transparent',
    });
  }

  /**
   * Resets the style of a feature when the hover ends.
   * @param e - Leaflet mouse event
   */
  private resetFeature(e: L.LeafletMouseEvent) {
    const layer = e.target;

    layer.setStyle({
      weight: 3,
      opacity: 1,
      color: '#666666',
      fillOpacity: 0,
      fillColor: 'transparent',
    });
  }

  /**
   * Initializes the shapes layer on the map.
   */
  private initShapesLayer() {
    const stateLayer = L.geoJSON(this.currShapes, {
      style: (feature) => ({
        weight: 3,
        opacity: 1,
        color: '#666666',
        fillOpacity: 0,
        fillColor: 'transparent',
      }),
      onEachFeature: (feature, layer) => {
        const highlight =
          feature.properties.PROVNAME || feature.properties.DISTNAME;

        layer.bindPopup(`<strong>${highlight}</strong>`, {
          closeButton: false,
          autoClose: false,
        });

        layer.on({
          mouseover: (e) => {
            layer.openPopup();
            this.highlightFeature(e);
            this.showInsetMap(e.target.getBounds());
          },
          mouseout: (e) => {
            layer.closePopup();
            this.resetFeature(e);
            this.hideInsetMap();
          },
          click: (e) => this.zoomToFeature(e), // Handle click to zoom
        });
      },
    });

    this.map.addLayer(stateLayer);
  }

  /**
   * Zooms the map to the feature's bounds and loads district boundaries.
   * @param e - Leaflet mouse event
   */
  private zoomToFeature(e: L.LeafletMouseEvent) {
    const layer = e.target;
    const bounds = layer.getBounds();

    this.map.fitBounds(bounds); // Zoom to province bounds
    // After zoom, load district boundaries
    this.map.once('zoomend', () => {
      this.loadClickedBoundaries(SHAPE_DEFAULTS.DISTRICT, bounds);
    });
  }

  /**
   * Loads and displays district boundaries within the given boundary.
   * @param distShapes - District shapes data
   * @param boundary - Bounding box
   */
  private loadClickedBoundaries(distShapes: string, boundary: any) {
    // Remove province layer
    if (this.currShapes) {
      this.map.removeLayer(this.currShapes);
    }

    // Load and display district data
    this.shapeService.getDISTShapes(distShapes).subscribe((districts) => {
      this.distShapes = districts;
      this.currShapes = this.distShapes;
      this.initShapesLayer();
      this.loadMarkers(this.map, boundary);
    });
  }

  /**
   * Loads and displays the initial set of shapes (e.g., provinces) on the map.
   * @param initShapes - Identifier for the initial shape data to load
   */
  private loadShapes(initShapes: string) {
    this.shapeService.getPROVShapes(initShapes).subscribe((province) => {
      this.provShapes = province;
      this.currShapes = this.provShapes;

      this.initShapesLayer();
    });
  }

  /**
   * Loads and displays markers on the map.
   * @param map - Leaflet map instance
   * @param bound - Bounding box for marker placement
   */
  private loadMarkers(map: L.Map, bound: any) {
    this.markerService.makeMarkers(map, bound);
    this.markerService.makeMarkers().subscribe({
      next: (res: any) => {
        // this.tosterService.successToast('Success!');
        {
          for (const c of res.features) {
            // this.showLegends()
            const lon = c.geometry.coordinates[0];
            const lat = c.geometry.coordinates[1];
            if (bound.contains([lat, lon])) {
              // Bind the popup with dynamic content
              const marker = L.marker([lat, lon]);
              const airstripData = {
                STRIP_NAME: 'Dahamo Airstrip',
                LEGENDS: 'OPEN',
                LAT: -6.75298,
                LONG: 141.99373,
              };

              // Create a host div for the component
              const container = document.createElement('div');

              // Ensure to use ViewContainerRef in the right context
              const componentRef =
                this.viewContainerRef.createComponent(MarkerPopupComponent);

              // Pass airstrip data to the component
              componentRef.instance.airstrip = airstripData;
              // componentRef.changeDetectorRef.detectChanges();

              // Append the component's HTML to the popup
              container.appendChild(componentRef.location.nativeElement);

              // Bind the popup with dynamic content
              marker.bindPopup(container).openPopup();
              this.assignIcons();
              marker.addTo(map);
            }
          }
        }
      },
      // error: () => {
      //   this.tosterService.errorToast('Load Failed!');
      // },
    });
  }

  /**
   * Assigns icons to markers.
   */
  private assignIcons() {
    const iconUrl = '../../assets/icons/closed-airstrip.svg';
    const iconDefault = L.icon({
      iconUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  /**
   * Creates the inset map container in the DOM.
   */
  // Create inset map container (HTML element)
  private createInsetMapContainer() {
    const insetMapDiv = document.createElement('div');
    insetMapDiv.id = 'insetMap';

    // Apply styles directly using JavaScript
    insetMapDiv.style.position = 'absolute';
    insetMapDiv.style.top = 'var(--inset-map-top, 1rem)'; // Default to 1rem if variable is not set
    insetMapDiv.style.right = 'var(--inset-map-right, 1rem)'; // Default to 1rem if variable is not set
    insetMapDiv.style.width = 'var(--inset-map-width, 20rem)'; // Default to 20rem if variable is not set
    insetMapDiv.style.height = 'var(--inset-map-height, 15rem)'; // Default to 15rem if variable is not set
    insetMapDiv.style.border = 'var(--inset-map-border, 0.2rem solid black)'; // Default to 0.2rem solid black if variable is not set
    insetMapDiv.style.zIndex = 'var(--inset-map-zindex, 1000)'; // Default to 1000 if variable is not set

    // Append the container to the document body
    document.body.appendChild(insetMapDiv);

    // Add responsive styles directly in JavaScript
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --inset-map-width: 20rem;
        --inset-map-height: 15rem;
        --inset-map-border: 0.2rem solid black;
        --inset-map-zindex: 1000;
        --inset-map-top: 1rem;
        --inset-map-right: 1rem;
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          --inset-map-width: 80vw;
          --inset-map-height: 60vh;
          --inset-map-top: 2rem;
          --inset-map-right: 2rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Displays the inset map with a zoomed-in view of the selected feature.
   * @param bounds - Bounds of the feature
   */
  // Show the inset map
  private showInsetMap(bounds: L.LatLngBounds) {
    if (!this.insetMap) {
      this.createInsetMapContainer();
      this.insetMap = L.map('insetMap', {
        zoomControl: false, // Disable zoom control for a cleaner look
        attributionControl: false,
      });

      // Add tile layer to inset map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 3,
      }).addTo(this.insetMap);
    }

    // Set bounds and zoom of the inset map to the polygon
    this.insetMap.fitBounds(bounds);

    // Add filtered data points to inset map (airstrips, etc.)
    this.loadMarkers(this.insetMap, bounds);
  }

  /**
   * Hides and removes the inset map from the DOM.
   */
  // Hide the inset map
  private hideInsetMap() {
    if (this.insetMap) {
      this.insetMap.remove();
      const insetMapDiv = document.getElementById('insetMap');
      if (insetMapDiv) {
        insetMapDiv.remove();
      }
      this.insetMap = null;
    }
  }

  /**
   * Angular lifecycle hook for component initialization.
   */
  ngAfterViewInit(): void {
    this.initMap();
    // this.markerService.makeCapitalCircleMarkers(this.map)
  }
}
