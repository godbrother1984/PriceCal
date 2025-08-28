import { Controller, Get } from '@nestjs/common';
import { MockDataService } from './mock-data.service';

@Controller('mock-data')
export class MockDataController {
  constructor(private readonly mockDataService: MockDataService) {}

  @Get('requests')
  getAllRequests() {
    return this.mockDataService.findAllRequests();
  }
}