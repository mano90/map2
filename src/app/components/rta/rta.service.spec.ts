import { TestBed } from '@angular/core/testing';

import { RtaService } from './rta.service';

describe('RtaService', () => {
  let service: RtaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RtaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
