import {
    Controller,
    Get,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { WorkspaceService } from '../services/workspace.service.js';

import {
    WorkspaceContextGuard,
} from '../../../common/authorization/guards/workspace-context.guard.js';

interface AuthenticatedUser {
    userId: string;
    email: string;
}

interface WorkspaceAuthorization {
    restaurantId: string;
    permissions: string[];
}

interface AuthorizedRequest extends Request {
    user?: AuthenticatedUser;
    workspaceAuthorization?: WorkspaceAuthorization;
}

@UseGuards(
    JwtAuthGuard,
    WorkspaceContextGuard,
)
@Controller({
    path: 'me/workspace',
    version: '1',
})
export class WorkspaceController {
    constructor(
        private readonly workspaceService: WorkspaceService,
    ) {}

    @Get()
    async getWorkspace(
        @Req() request: AuthorizedRequest,
    ) {
        const user = request.user;
        const authorization = request.workspaceAuthorization;

        if (!user?.userId) {
            throw new UnauthorizedException(
                'User is not authenticated',
            );
        }

        if (!authorization?.restaurantId) {
            throw new UnauthorizedException(
                'Workspace authorization context is missing',
            );
        }

        return {
            message: 'Workspace retrieved successfully',

            data: await this.workspaceService.getWorkspace(
                user.userId,
                authorization.restaurantId,
            ),
        };
    }
}