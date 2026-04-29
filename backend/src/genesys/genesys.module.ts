import { Module } from '@nestjs/common';
import { GenesysAuthService } from './genesys-auth.service';
import { GenesysApiService } from './genesys-api.service';
import { GenesysService } from './genesys.service';
import { GenesysController } from './genesys.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [GenesysAuthService, GenesysApiService, GenesysService],
  controllers: [GenesysController],
  exports: [GenesysApiService, GenesysAuthService],
})
export class GenesysModule {}
