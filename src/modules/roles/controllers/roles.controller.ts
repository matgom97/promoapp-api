import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';

import { RolesService } from '../services/roles.service.js';
import { CreateRoleDto } from '../dto/create-role.dto/create-role.dto.js';
import { UpdateRoleDto } from '../dto/update-role.dto/update-role.dto.js';
import { AssignRolePermissionsDto } from '../dto/assign-role-permissions.dto/assign-role-permissions.dto.js';

interface AuthenticatedRequest {
  user: {
    userId: string;
  };
}

@Controller({
  path: 'organizations/:organizationId/roles',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
  ) {}

  /**
   * GET /api/v1/organizations/:organizationId/roles
   * Lista los roles de la organización.
   */
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
  ) {
    return this.rolesService.findAll(
      organizationId,
    );
  }

  /**
   * GET /api/v1/organizations/:organizationId/roles/:roleId
   * Consulta un rol específico.
   */
  @Get(':roleId')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.findOne(
      req.user.userId,
      organizationId,
      roleId,
    );
  }

  /**
   * POST /api/v1/organizations/:organizationId/roles
   * Crea un rol personalizado.
   */
  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.create(
      req.user.userId,
      organizationId,
      dto,
    );
  }

  /**
   * PATCH /api/v1/organizations/:organizationId/roles/:roleId
   * Modifica los datos de un rol.
   */
  @Patch(':roleId')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(
      req.user.userId,
      organizationId,
      roleId,
      dto,
    );
  }

  /**
   * PUT /api/v1/organizations/:organizationId/roles/:roleId/permissions
   * Reemplaza todos los permisos de un rol.
   */
  @Put(':roleId/permissions')
  replacePermissions(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Param('roleId') roleId: string,
    @Body() dto: AssignRolePermissionsDto,
  ) {
    return this.rolesService.replacePermissions(
      req.user.userId,
      organizationId,
      roleId,
      dto,
    );
  }

  /**
   * DELETE /api/v1/organizations/:organizationId/roles/:roleId
   * Elimina un rol personalizado.
   */
  @Delete(':roleId')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('organizationId') organizationId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.remove(
      req.user.userId,
      organizationId,
      roleId,
    );
  }
}