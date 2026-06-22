import { Pipe, PipeTransform } from '@angular/core';
import { resolveMediaUrl } from '../../core/utils/image-url.util';

@Pipe({ name: 'mediaUrl' })
export class MediaUrlPipe implements PipeTransform {
  transform(value?: string | null, folder = ''): string {
    return resolveMediaUrl(value, folder);
  }
}
