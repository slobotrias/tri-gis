import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { first } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MarkerService {
  capitals: string = '../../assets/data/air_strip_data_western_province.json';

  constructor(
    private http: HttpClient,
  ) {
  }

  static scaledRadius(val: number, maxVal: number): number {
    return 20 * (val / maxVal);
  }

  makeMarkers(map?: L.Map, boundary?: any) {
   return this.http.get(this.capitals).pipe(first());
  }

  makeCircleMarkers(map: L.Map): void {
    this.http.get(this.capitals).subscribe((res: any) => {
      const maxVal = Math.max(
        ...res.features.map(
          (x: { properties: { population: any } }) => x.properties.population
        ),
        0
      );

      for (const c of res.features) {
        const lat = c.geometry.coordinates[0];
        const lon = c.geometry.coordinates[1];
        const circle = L.circleMarker([lon, lat], {
          radius: MarkerService.scaledRadius(c.properties.population, maxVal),
        });

        // circle.bindPopup(this.popupService.makeMarkerPopup(c.properties));

        circle.addTo(map);
      }
    });
  }
}
