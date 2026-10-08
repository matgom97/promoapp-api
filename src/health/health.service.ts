import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
    getHealth(){
        return {
            status: 'ok',
            service: 'PromoApp-API',
            timestamp: new Date().toISOString(),
        };
    } 
}
