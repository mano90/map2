import { DeviceStatus } from './DeviceStatus';

export interface HistoryDataFilter {
  status: DeviceStatus[];
  end: Date;
  begin?: Date;
}
