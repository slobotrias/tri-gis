import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {MatSidenav} from '@angular/material/sidenav';

@Component({
  selector: 'apex-marker-popup',
  standalone: true,
  imports: [CommonModule, MatSidenav],
  templateUrl: './marker-popup.component.html',
  styleUrl: './marker-popup.component.scss'
})
export class MarkerPopupComponent {
  @Input() airstrip: any;  // Input property to pass airstrip data

}

