export const PERMISSIONS = {
    DASHBOARD_VIEW: 'dashboard.view',

    PROMOTIONS_VIEW: 'promotions.view',
    PROMOTIONS_CREATE: 'promotions.create',
    PROMOTIONS_UPDATE: 'promotions.update',
    PROMOTIONS_DELETE: 'promotions.delete',

    REDEMPTIONS_VIEW: 'redemptions.view',
    REDEMPTIONS_VALIDATE: 'redemptions.validate',

    CUSTOMERS_VIEW: 'customers.view',
    CUSTOMERS_EXPORT: 'customers.export',

    ANALYTICS_VIEW: 'analytics.view',

    TEAM_VIEW: 'team.view',
    TEAM_MANAGE: 'team.manage',

    ROLES_MANAGE: 'roles.manage',

    SETTINGS_VIEW: 'settings.view',
    SETTINGS_MANAGE: 'settings.manage',
} as const;

export type PermissionCode =
    (typeof PERMISSIONS)[keyof typeof PERMISSIONS];