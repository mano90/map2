import { DeviceStatus } from './DeviceStatus';
import { Locate } from './Locate';

export class Device {
  name: string;
  id: number;
  serverAddress: string;
  status: DeviceStatus;
  devicePositions?: Locate[];
}
