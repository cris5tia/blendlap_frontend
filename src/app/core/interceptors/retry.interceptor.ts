import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isApiGet = req.method === 'GET' && req.url.startsWith(environment.apiUrl);

    if (!isApiGet) return next.handle(req);

    return next.handle(req).pipe(
      retry({ count: 3, delay: () => timer(2000) })
    );
  }
}
