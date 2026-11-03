export const PERMISSIONS = {
    // ==========================================
    // DASHBOARD (EXISTENTE)
    // ==========================================
    DASHBOARD_VIEW: 'dashboard.view',

    // ==========================================
    // RESTAURANTS (EXISTENTES)
    // ==========================================
    RESTAURANT_VIEW: 'restaurant.view',
    RESTAURANT_CREATE: 'restaurant.create',
    RESTAURANT_BRANCH_VIEW: 'restaurant.branch.view',
    RESTAURANT_BRANCH_UPDATE: 'restaurant.branch.update',
    RESTAURANT_BRANCH_STATUS_UPDATE: 'restaurant.branch.status.update',

    // ==========================================
    // PROMOTIONS (EXISTENTES)
    // ==========================================
    PROMOTIONS_VIEW: 'promotions.view',
    PROMOTIONS_CREATE: 'promotions.create',
    PROMOTIONS_UPDATE: 'promotions.update',
    PROMOTIONS_DELETE: 'promotions.delete',

    // ==========================================
    // REDEMPTIONS (EXISTENTES)
    // ==========================================
    REDEMPTIONS_VIEW: 'redemptions.view',
    REDEMPTIONS_VALIDATE: 'redemptions.validate',

    // ==========================================
    // CUSTOMERS (EXISTENTES)
    // ==========================================
    CUSTOMERS_VIEW: 'customers.view',
    CUSTOMERS_EXPORT: 'customers.export',

    // ==========================================
    // ANALYTICS (EXISTENTE)
    // ==========================================
    ANALYTICS_VIEW: 'analytics.view',

    // ==========================================
    // TEAM (EXISTENTE)
    // ==========================================
    TEAM_VIEW: 'team.view',
    TEAM_MANAGE: 'team.manage',

    // ==========================================
    // ROLES (EXISTENTE)
    // ==========================================
    ROLES_VIEW: 'roles.view',
    ROLES_MANAGE: 'roles.manage',

    // ==========================================
    // SETTINGS (EXISTENTE)
    // ==========================================
    SETTINGS_VIEW: 'settings.view',
    SETTINGS_MANAGE: 'settings.manage',

    // ==========================================
    // BILLING (EXISTENTE)
    // ==========================================
    BILLING_VIEW: 'billing.view',
    BILLING_MANAGE: 'billing.manage',

    // ==========================================
    // NUEVOS: ORGANIZATION
    // ==========================================
    ORGANIZATION_READ: 'organization.read',
    ORGANIZATION_UPDATE: 'organization.update',

    // ==========================================
    // NUEVOS: RESTAURANTS
    // ==========================================
    RESTAURANTS_READ: 'restaurants.read',
    RESTAURANTS_CREATE: 'restaurants.create',
    RESTAURANTS_UPDATE: 'restaurants.update',
    RESTAURANTS_MANAGE_STATUS: 'restaurants.manage_status',

    // ==========================================
    // NUEVOS: TEAM
    // ==========================================
    TEAM_READ: 'team.read',
    TEAM_INVITE: 'team.invite',
    TEAM_UPDATE: 'team.update',
    TEAM_REMOVE: 'team.remove',

    // ==========================================
    // NUEVOS: PROMOTIONS
    // ==========================================
    PROMOTIONS_READ: 'promotions.read',
    PROMOTIONS_PUBLISH: 'promotions.publish',
    PROMOTIONS_PAUSE: 'promotions.pause',
    PROMOTIONS_ARCHIVE: 'promotions.archive',
    PROMOTIONS_MANAGE_LOCATIONS: 'promotions.manage_locations',

    // ==========================================
    // NUEVOS: REDEMPTIONS
    // ==========================================
    REDEMPTIONS_READ: 'redemptions.read',
    REDEMPTIONS_CONFIRM: 'redemptions.confirm',
    REDEMPTIONS_REVERSE: 'redemptions.reverse',

    // ==========================================
    // NUEVOS: CUSTOMERS
    // ==========================================
    CUSTOMERS_READ: 'customers.read',
    CUSTOMERS_UPDATE: 'customers.update',

    // ==========================================
    // NUEVOS: SEGMENTS
    // ==========================================
    SEGMENTS_READ: 'segments.read',
    SEGMENTS_CREATE: 'segments.create',
    SEGMENTS_UPDATE: 'segments.update',
    SEGMENTS_DELETE: 'segments.delete',

    // ==========================================
    // NUEVOS: LOYALTY
    // ==========================================
    LOYALTY_READ: 'loyalty.read',
    LOYALTY_MANAGE: 'loyalty.manage',
    LOYALTY_REWARDS_MANAGE: 'loyalty.rewards.manage',
    LOYALTY_POINTS_ADJUST: 'loyalty.points.adjust',

    // ==========================================
    // NUEVOS: ANALYTICS / AUDIT
    // ==========================================
    ANALYTICS_READ: 'analytics.read',
    AUDIT_READ: 'audit.read',

    // ==========================================
    // NUEVOS: SUBSCRIPTIONS
    // ==========================================
    SUBSCRIPTIONS_READ: 'subscriptions.read',
    SUBSCRIPTIONS_MANAGE: 'subscriptions.manage',

} as const;

export type PermissionCode =
    (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type SystemRoleCode =
    | 'OWNER'
    | 'ADMIN'
    | 'MANAGER'
    | 'STAFF';