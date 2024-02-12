import { DeviceStatus } from './DeviceStatus';
import { Locate } from './Locate';

export class Device {
  name: string;
  id: number;
  serverAddress: string;
  status: DeviceStatus;
  devicePositions?: Locate[];
  seuil: number;
  limiteHG: string;
  limiteHD: string;
  limiteBD: string;
  limiteBG: string;
}
