import { Injectable } from '@nestjs/common';
import { SuiClient } from '@mysten/sui.js/client';

@Injectable()
export class SuiService {
  private readonly client: SuiClient;

  constructor() {
    this.client = new SuiClient({
      url: 'https://fullnode.mainnet.sui.io',
    });
  }

  async getBalance(address: string) {
    try {
      const balances = await this.client.getAllBalances({ owner: address });
      return balances.map((b) => ({
        coinType: b.coinType,
        balance: b.totalBalance,
        formatted: Number(b.totalBalance) / 1e9,
      }));
    } catch (e) {
      throw new Error('Failed to fetch SUI balance: ' + (e as Error).message);
    }
  }

  async getTxHistory(address: string) {
    try {
      const txs = await this.client.queryTransactionBlocks({
        filter: {
          // Gồm cả giao dịch gửi và nhận
          FromAddress: address,
        },
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showBalanceChanges: true,
        },
        limit: 20, // Tùy chỉnh số lượng giao dịch trả về
      });

      return txs.data.map((tx) => ({
        digest: tx.digest,
        timestamp: tx.timestampMs,
        success: tx.effects?.status.status === 'success',
        gasUsed: tx.effects?.gasUsed,
        balanceChanges: tx.balanceChanges,
        events: tx.events,
        explorer: `https://suiscan.xyz/mainnet/tx/${tx.digest}`,
      }));
    } catch (e) {
      throw new Error('Failed to fetch tx history: ' + (e as Error).message);
    }
  }
}
