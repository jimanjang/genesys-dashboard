import { Controller, Get, Param } from '@nestjs/common';
import { GenesysService } from './genesys.service';

@Controller('api/genesys')
export class GenesysController {
  constructor(private genesys: GenesysService) {}

  @Get('teams/:teamId/dashboard')
  async getTeamDashboard(@Param('teamId') teamId: string) {
    const cached = this.genesys.getLatestData(teamId);
    if (cached) return cached;
    return this.genesys.buildTeamData(teamId);
  }
}
