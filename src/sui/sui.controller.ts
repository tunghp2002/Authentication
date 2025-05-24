import { Controller, Param } from '@nestjs/common';
import { SuiService } from './sui.service';
import { Get } from '@nestjs/common';
@Controller('sui')
export class SuiController {
  constructor(private readonly suiService: SuiService) {}

  @Get('balance/:address')
  async getBalance(@Param('address') address: string) {
    return this.suiService.getBalance(address);
  }

  @Get('history/:address')
  async getTxHistory(@Param('address') address: string) {
    return this.suiService.getTxHistory(address);
  }
}
