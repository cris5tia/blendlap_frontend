import { Component, forwardRef, Input, OnDestroy } from '@angular/core';
import {
  ControlValueAccessor, FormControl,
  NG_VALUE_ACCESSOR, ReactiveFormsModule
} from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mat-date',
  standalone: true,
  imports: [MatDatepickerModule, ReactiveFormsModule],
  templateUrl: './mat-date-input.component.html',
  styleUrls: ['./mat-date-input.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MatDateInputComponent),
    multi: true
  }]
})
export class MatDateInputComponent implements ControlValueAccessor, OnDestroy {
  @Input() placeholder = 'dd/mm/aaaa';

  readonly ctrl = new FormControl<Date | null>(null);

  private _onChange = (_: string) => {};
  private _onTouched = () => {};
  private sub: Subscription;

  constructor() {
    // Convierte Date → 'YYYY-MM-DD' y lo propaga al ngModel externo
    this.sub = this.ctrl.valueChanges.subscribe(date => {
      this._onChange(date ? this.toISO(date) : '');
      this._onTouched();
    });
  }

  // Recibe 'YYYY-MM-DD' desde el ngModel externo → lo pasa al FormControl interno
  writeValue(iso: string): void {
    this.ctrl.setValue(iso ? this.fromISO(iso) : null, { emitEvent: false });
  }

  registerOnChange(fn: any) { this._onChange = fn; }
  registerOnTouched(fn: any) { this._onTouched = fn; }

  private fromISO(iso: string): Date | null {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return isNaN(y) ? null : new Date(y, m - 1, d);
  }

  private toISO(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  ngOnDestroy() { this.sub.unsubscribe(); }
}
