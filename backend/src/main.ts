import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log(
    `Connecting to uri: ${process.env.uri} with username: ${process.env.user} and dbName: ${process.env.dbName}`,
  );

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(4200);
}
bootstrap();
