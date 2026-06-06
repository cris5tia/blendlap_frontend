import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-time-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './time-select.component.html',
  styleUrls: ['./time-select.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TimeSelectComponent),
    multi: true
  }]
})
export class TimeSelectComponent implements ControlValueAccessor {

  // Estado interno en formato 12h
  h = 9;     // 1-12
  m = 0;     // 0-59
  pm = false;

  private _onChange = (_: string) => {};
  _onTouched = () => {};

  // Recibe "HH:MM" (24h) desde ngModel externo
  writeValue(v: string): void {
    if (!v || !v.includes(':')) return;
    const [hStr, mStr] = v.split(':');
    const h24 = parseInt(hStr, 10);
    this.m  = parseInt(mStr, 10) || 0;
    this.pm = h24 >= 12;
    this.h  = h24 % 12 || 12;
  }

  registerOnChange(fn: any) { this._onChange = fn; }
  registerOnTouched(fn: any) { this._onTouched = fn; }

  onHourInput(val: any) {
    let n = parseInt(val, 10);
    if (isNaN(n)) return;
    n = Math.min(12, Math.max(1, n));
    this.h = n;
    this.emit();
  }

  onMinuteInput(val: any) {
    let n = parseInt(val, 10);
    if (isNaN(n)) return;
    n = Math.min(59, Math.max(0, n));
    this.m = n;
    this.emit();
  }

  togglePeriod() {
    this.pm = !this.pm;
    this.emit();
  }

  get minDisplay(): string {
    return String(this.m).padStart(2, '0');
  }

  private emit() {
    // Convierte a 24h para el modelo
    let h24 = this.h % 12;
    if (this.pm) h24 += 12;
    const hStr = String(h24).padStart(2, '0');
    const mStr = String(this.m).padStart(2, '0');
    this._onChange(`${hStr}:${mStr}`);
    this._onTouched();
  }
}
