import { Device } from './Device';
import { DeviceStatus } from './DeviceStatus';

export interface HistoryData {
  id?: number;

  date?: Date;

  name?: string;

  deviceNumber?: string;

  icon?: string;

  status?: DeviceStatus;

  seuil?: number;

  limiteHG?: string;

  limiteBD?: string;

  device?: Device;
  changes?: string[];

  blinkLimites?: boolean;

  blinkSeuil?: boolean;

  blinkCredit?: boolean;
}

export interface HistoryDataFilter {
  status: DeviceStatus[];
  end: Date;
  begin?: Date;
}
