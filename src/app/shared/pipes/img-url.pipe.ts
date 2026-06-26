import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({ name: 'imgUrl' })
export class ImgUrlPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) return 'assets/images/no-img.png';
    if (valor.startsWith('http') || valor.startsWith('data:')) return valor;
    const tipo = valor.split('_')[0]; // productos | servicios | barberos | clientes
    return `${environment.imageUrl}/${tipo}/${valor}`;
  }
}
