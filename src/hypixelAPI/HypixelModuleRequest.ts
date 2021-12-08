import type { CleanHypixelPlayer, CleanHypixelStatus, HypixelAPIOk, RawHypixelPlayer, RawHypixelStatus } from '../@types/hypixel';
import type { HypixelModuleInstance } from './HypixelModuleInstance';
import type { UserAPIData } from '../@types/database';
import { HypixelRequest } from './HypixelRequest';

export class HypixelModuleRequest extends HypixelRequest {
  instance: HypixelModuleInstance;

  constructor(instance: HypixelModuleInstance) {
    super(instance);
    this.instance = instance;
  }

  generateURLS(user: UserAPIData) {
    const urls: string[] = [this.instance.baseURL.replace(/%{type}%/, 'player')];
    if (Number(user.lastLogin) > Number(user.lastLogout)) urls.push(this.instance.baseURL.replace(/%{type}%/, 'status'));

    return urls.map(url => url.replace(/%{uuid}%/, user.uuid));
  }

  async executeRequest(user: UserAPIData, urls: string[]): Promise<[CleanHypixelPlayer, CleanHypixelStatus | undefined]> {
    const urlPromises: Promise<HypixelAPIOk>[] = urls.map(url => this.call(url));
    const hypixelAPIOk: HypixelAPIOk[] = await Promise.all(urlPromises);

    const thisRequest = HypixelModuleRequest;

    const hypixelPlayerData: CleanHypixelPlayer = thisRequest.cleanPlayerData(hypixelAPIOk[0] as RawHypixelPlayer, user);
    const hypixelStatusData: CleanHypixelStatus | undefined = thisRequest.cleanStatusData(hypixelAPIOk[1] as RawHypixelStatus | undefined);
    return [hypixelPlayerData, hypixelStatusData];
  }

  static cleanPlayerData(rawHypixelPlayer: RawHypixelPlayer, userAPIData: UserAPIData) {
    const rawHypixelPlayerData: RawHypixelPlayer['player'] = rawHypixelPlayer.player;
    return {
      firstLogin: rawHypixelPlayerData.firstLogin ?? null,
      lastLogin: rawHypixelPlayerData.lastLogin ?? null,
      lastLogout: rawHypixelPlayerData.lastLogout ?? null,
      version: rawHypixelPlayerData.mcVersionRp ?? null,
      language: rawHypixelPlayerData.userLanguage ?? userAPIData.language ?? 'ENGLISH',
      lastClaimedReward: rawHypixelPlayerData.lastClaimedReward ?? null,
      rewardScore: rawHypixelPlayerData.rewardScore ?? null,
      rewardHighScore: rawHypixelPlayerData.rewardHighScore ?? null,
      totalDailyRewards: rawHypixelPlayerData.totalDailyRewards ?? null,
      totalRewards: rawHypixelPlayerData.totalRewards ?? null,
    } as CleanHypixelPlayer;
  }

  static cleanStatusData(rawHypixelStatus: RawHypixelStatus | undefined) {
    if (rawHypixelStatus === undefined) return undefined;
    const rawHypixelStatusData: RawHypixelStatus['session'] = rawHypixelStatus.session;
    return {
      gameType: rawHypixelStatusData.gameType ?? null,
    } as CleanHypixelStatus;
  }
}