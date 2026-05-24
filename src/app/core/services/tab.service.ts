import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TabService {
  private tabSubject = new BehaviorSubject<string>('actuales');
  tab$ = this.tabSubject.asObservable();

  cambiarTab(tab: string): void {
    this.tabSubject.next(tab);
  }
}