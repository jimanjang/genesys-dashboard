import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GenesysAuthService {
  private readonly logger = new Logger(GenesysAuthService.name);
  private cachedToken: string | null = null;
  private tokenExpiry = 0;

  constructor(private config: ConfigService) {}

  private getLoginUrl(): string {
    const region = this.config.get('GENESYS_REGION') || 'mypurecloud.com';
    return `https://login.${region}`;
  }

  getApiUrl(): string {
    const region = this.config.get('GENESYS_REGION') || 'mypurecloud.com';
    return `https://api.${region}`;
  }

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiry - 60000) {
      return this.cachedToken;
    }

    const clientId = this.config.get('GENESYS_CLIENT_ID');
    const clientSecret = this.config.get('GENESYS_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('GENESYS_CLIENT_ID and GENESYS_CLIENT_SECRET must be set');
    }

    const response = await axios.post(
      `${this.getLoginUrl()}/oauth/token`,
      'grant_type=client_credentials',
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        auth: { username: clientId, password: clientSecret },
      },
    );

    this.cachedToken = response.data.access_token;
    this.tokenExpiry = Date.now() + response.data.expires_in * 1000;
    this.logger.log(`Token obtained, expires in ${response.data.expires_in}s`);
    return this.cachedToken!;
  }

  clearToken() {
    this.cachedToken = null;
    this.tokenExpiry = 0;
  }
}
