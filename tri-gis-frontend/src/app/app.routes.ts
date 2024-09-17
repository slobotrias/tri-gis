import { Routes } from '@angular/router';
import { MapComponent } from './core/map/map.component';

export const routes: Routes = [
  {
    path: 'map',
    component: MapComponent,
  },
  { path: '', redirectTo: 'map', pathMatch: 'full' },
  { path: '**', redirectTo: 'map', pathMatch: 'full' }, // Wildcard route for a 404 page
];
