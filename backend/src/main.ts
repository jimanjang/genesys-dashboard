import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(process.env.PORT || 3001, '0.0.0.0');
  console.log(`[Backend] NestJS server running on http://172.17.3.206:${process.env.PORT || 3001}`);
}
bootstrap();
