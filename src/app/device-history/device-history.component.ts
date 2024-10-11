import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ApicallService } from '../services/requests/apicall.service';
import { HistoryData } from '../classes/HistoryData';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-device-history',
  templateUrl: './device-history.component.html',
  styleUrls: ['./device-history.component.scss'],
})
export class DeviceHistoryComponent implements OnInit {
  dataSource: MatTableDataSource<HistoryData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  displayedColumns: string[] = [
    'name',
    'date',
    'status',
    'seuil',
    'deviceNumber',
    'icon',
    'limiteHG',
    'limiteBD',
  ];
  constructor(private service: ApicallService, private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = +params.get('id');
      if (id) this.getHistoryDeviceData(id);
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private getHistoryDeviceData(id: number) {
    this.service.getHistoryDataByDeviceId(id).subscribe((res) => {
      this.addChangedProperty(res);
      console.log(res);
      this.dataSource = new MatTableDataSource(res);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  private addChangedProperty(data: HistoryData[]): void {
    for (let i = 1; i < data.length; i++) {
      const prevObj = data[i - 1] as any;
      const currentObj = data[i] as any;
      const changes: string[] = [];

      for (const key in currentObj) {
        if (
          key !== 'date' &&
          key !== 'id' &&
          prevObj[key] !== currentObj[key]
        ) {
          changes.push(key);
        }
      }

      prevObj['changes'] = changes;
    }
  }

  updatedColumn(columnName: string, changes: string[]): boolean {
    if (changes) if (changes.includes(columnName)) return true;
    return false;
  }
}
