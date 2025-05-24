import { Module } from '@nestjs/common';
import { SuiService } from './sui.service';
import { SuiController } from './sui.controller';

@Module({
  controllers: [SuiController],
  providers: [SuiService],
})
export class SuiModule {}
