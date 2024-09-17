import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PopupService {

  constructor() { }

  makeMarkerPopup(data: any): string {
    return data.STRIP_NAME
   }

}
