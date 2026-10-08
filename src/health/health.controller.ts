import { Controller, Get, Version} from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    @Version('1')
    getHealth() {
        return this.healthService.getHealth();
    }
}