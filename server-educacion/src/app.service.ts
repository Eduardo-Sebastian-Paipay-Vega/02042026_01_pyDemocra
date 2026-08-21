import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getPing() {
    return { status: 'ok', service: 'educacion-api' };
  }
}
