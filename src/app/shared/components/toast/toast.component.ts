import { Component, OnInit } from '@angular/core';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(t => { this.toasts = t; });
  }

  dismiss(id: number): void { this.toastService.dismiss(id); }

  trackById(_: number, t: Toast): number { return t.id; }

  icon(type: string): string {
    return {
      success: 'fa-check-circle',
      error:   'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info:    'fa-info-circle'
    }[type] ?? 'fa-bell';
  }
}
