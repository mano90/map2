import { DeviceStatus } from './DeviceStatus';
import { Locate } from './Locate';

export class Device {
  name: string;
  icon?: string;
  id?: number;
  deviceNumber: string;

  status?: DeviceStatus;
  devicePositions?: Locate[];
  seuil: number;
  limiteHG?: string;
  limiteBD?: string;
  blinkLimites?: boolean;
  blinkSeuil?: boolean;
}
