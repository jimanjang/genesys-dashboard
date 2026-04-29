import { Controller, Get } from '@nestjs/common';
import { CsatBannerService } from './csat-banner.service';

@Controller('api/banner')
export class CsatBannerController {
  constructor(private service: CsatBannerService) {}

  @Get('current')
  getCurrent() {
    return this.service.getCurrentBanner();
  }
}
