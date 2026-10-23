import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Query,
    Body,
    UseGuards,
    Req,
    UnauthorizedException,
    Version,
} from '@nestjs/common';

import type { Request } from 'express';

import { OrganizationMembersService } from '../services/organization-members.service.js';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';

import { QueryOrganizationMembersDto } from '../dto/query-organization-members.dto/query-organization-members.dto.js';
import { CreateOrganizationMemberDto } from '../dto/create-organization-member.dto/create-organization-member.dto.js';
import { UpdateOrganizationMemberDto } from '../dto/update-organization-member.dto/update-organization-member.dto.js';
import { AssignRestaurantsDto } from '../dto/assign-restaurants.dto/assign-restaurants.dto.js';

interface AuthenticatedUser {
    userId: string;
    email: string;
}

interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}

@Controller({
    path: 'organizations/:organizationId/members',
    version: '1',
})

@UseGuards(JwtAuthGuard)

export class OrganizationMembersController {
    constructor(
        private readonly organizationMembersService: OrganizationMembersService,
    ) { }

    /**
     * Obtiene el identificador del usuario autenticado.
     */
    private getAuthenticatedUserId(
        req: AuthenticatedRequest,
    ): string {
        const userId = req.user?.userId;

        if (!userId) {
            throw new UnauthorizedException(
                'Authenticated user ID not found',
            );
        }

        return userId;
    }

    /**
     * GET /api/organizations/:organizationId/members
     * Lista los miembros de una organización.
     */
    @Get()
    findAll(
        @Req() req: AuthenticatedRequest,
        @Param('organizationId') organizationId: string,
        @Query() query: QueryOrganizationMembersDto,
    ) {
        return this.organizationMembersService.findAll(
            this.getAuthenticatedUserId(req),
            organizationId,
            query,
        );
    }

    /**
     * GET /api/organizations/:organizationId/members/:memberId
     * Consulta un miembro.
     */
    @Get(':memberId')
    findOne(
        @Req() req: AuthenticatedRequest,
        @Param('organizationId') organizationId: string,
        @Param('memberId') memberId: string,
    ) {
        return this.organizationMembersService.findOne(
            this.getAuthenticatedUserId(req),
            organizationId,
            memberId,
        );
    }

    /**
     * POST /api/organizations/:organizationId/members
     * Incorpora un usuario existente.
     */
    @Post()
    create(
        @Req() req: AuthenticatedRequest,
        @Param('organizationId') organizationId: string,
        @Body() dto: CreateOrganizationMemberDto,
    ) {
        return this.organizationMembersService.create(
            this.getAuthenticatedUserId(req),
            organizationId,
            dto,
        );
    }

    /**
     * PATCH /api/organizations/:organizationId/members/:memberId
     * Actualiza el rol o los accesos.
     */
    @Patch(':memberId')
    update(
        @Req() req: AuthenticatedRequest,
        @Param('organizationId') organizationId: string,
        @Param('memberId') memberId: string,
        @Body() dto: UpdateOrganizationMemberDto,
    ) {
        return this.organizationMembersService.update(
            this.getAuthenticatedUserId(req),
            organizationId,
            memberId,
            dto,
        );
    }

    /**
     * PATCH /api/organizations/:organizationId/members/:memberId/restaurants
     * Actualiza los restaurantes asignados.
     */
    @Patch(':memberId/restaurants')
    assignRestaurants(
        @Req() req: AuthenticatedRequest,
        @Param('organizationId') organizationId: string,
        @Param('memberId') memberId: string,
        @Body() dto: AssignRestaurantsDto,
    ) {
        return this.organizationMembersService.assignRestaurants(
            this.getAuthenticatedUserId(req),
            organizationId,
            memberId,
            dto,
        );
    }

    /**
     * DELETE /api/organizations/:organizationId/members/:memberId
     * Revoca la membresía.
     */
    @Delete(':memberId')
    remove(
        @Req() req: AuthenticatedRequest,
        @Param('organizationId') organizationId: string,
        @Param('memberId') memberId: string,
    ) {
        return this.organizationMembersService.remove(
            this.getAuthenticatedUserId(req),
            organizationId,
            memberId,
        );
    }
}