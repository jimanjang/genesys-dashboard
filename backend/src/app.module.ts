import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { GenesysModule } from './genesys/genesys.module';
import { CsatBannerModule } from './csat-banner/csat-banner.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    GenesysModule,
    CsatBannerModule,
    EventsModule,
  ],
})
export class AppModule {}
