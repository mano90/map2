import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ApicallService } from '../services/requests/apicall.service';
import { HistoryData } from '../classes/HistoryData';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../services/notification/notification.service';

@Component({
  selector: 'app-device-history',
  templateUrl: './device-history.component.html',
  styleUrls: ['./device-history.component.scss'],
})
export class DeviceHistoryComponent implements OnInit {
  dataSource: MatTableDataSource<HistoryData>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  filterType: string = '';
  displayedColumns: string[] = [
    'name',
    'date',
    'seuil',
    'deviceNumber',
    'limiteHG',
    'limiteBD',
    'blinkLimites',
    'blinkSeuil',
    'blinkCredit',
  ];
  displayedColumnsTwo: string[] = [
    'name',
    'date',
    'seuil',
    'status',
    'deviceNumber',
    'icon',
    'courant',
  ];
  constructor(
    private service: ApicallService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = +params.get('id');
      const filter = params.get('filter');
      this.filterType = filter;
      if (id) this.getHistoryDeviceData(id, filter);
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private getHistoryDeviceData(id: number, filter: string) {
    this.service.getHistoryDataByDeviceId(id).subscribe((res) => {
      const toShow = this.addChangedProperty(res, filter);
      console.log(toShow);
      this.dataSource = new MatTableDataSource(toShow);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  private addChangedProperty(
    data: HistoryData[],
    filter: string
  ): HistoryData[] {
    if (data.length === 1) return data;
    const historyToReturn: HistoryData[] = [];
    for (let i = 1; i < data.length; i++) {
      const prevObj = data[i - 1] as any;
      const currentObj = data[i] as any;

      for (const key in currentObj) {
        if (
          key !== 'date' &&
          key !== 'id' &&
          prevObj[key] !== currentObj[key]
        ) {
          if (filter === 'alerte') {
            if (['blinkLimites', 'blinkSeuil', 'blinkCredit'].includes(key)) {
              historyToReturn.push(prevObj);
              historyToReturn.push(currentObj);
            }
          } else {
            if (
              [
                'name',
                'date',
                'status',
                'seuil',
                'deviceNumber',
                'icon',
                'activated',
              ].includes(key)
            ) {
              historyToReturn.push(prevObj);
              historyToReturn.push(currentObj);
            }
          }
        }
      }
    }
    return historyToReturn.filter(
      (obj, index, self) =>
        index ===
        self.findIndex((o) => JSON.stringify(o) === JSON.stringify(obj))
    );
  }

  updatedColumn(columnName: string, changes: string[]): boolean {
    if (changes) if (changes.includes(columnName)) return true;
    return false;
  }
  redirectMap() {
    this.router.navigate(['/']);
  }
  deconnexion() {
    this.notificationService
      .confirm('Etes vous sur de vouloir vous déconnecter')
      .then((response) => {
        if (response.isConfirmed) {
          localStorage.clear();
          this.router.navigate(['/']);
        }
      });
  }
}
