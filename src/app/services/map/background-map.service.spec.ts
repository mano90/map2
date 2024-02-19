import { TestBed } from '@angular/core/testing';

import { BackgroundMapService } from './background-map.service';

describe('BackgroundMapService', () => {
  let service: BackgroundMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackgroundMapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
