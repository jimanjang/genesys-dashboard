import { Module } from '@nestjs/common';
import { CsatBannerService } from './csat-banner.service';
import { CsatBannerController } from './csat-banner.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [CsatBannerService],
  controllers: [CsatBannerController],
})
export class CsatBannerModule {}
