import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { PermissionsService } from '../services/permissions.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  findAll(@Query('module') module?: string) {
    return this.permissionsService.findAll(module);
  }

  @Get('modules')
  findModules() {
    return this.permissionsService.findModules();
  }
}