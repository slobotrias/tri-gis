import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ShapeService {

  constructor(private http: HttpClient) { }

  getCONTShapes(contShapes: string) {
    return this.http.get(`${contShapes}`);
  }
  getPROVShapes(provShapes: string) {
    return this.http.get(`${provShapes}`);
  }

  getDISTShapes(distShapes: string) {
    return this.http.get(`${distShapes}`);
  }
}
