import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, timer } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WakeUpService {
  private healthUrl = environment.apiUrl.replace(/\/api\/?$/, '/health');

  constructor(private http: HttpClient) {}

  wake(): Promise<void> {
    return firstValueFrom(
      this.http.get(this.healthUrl).pipe(
        retry({ count: 3, delay: () => timer(2000) }),
        catchError(() => of(null))
      )
    ).then(() => undefined);
  }
}
