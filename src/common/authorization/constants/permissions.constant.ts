export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',

  // Promotions
  PROMOTIONS_VIEW: 'promotions.view',
  PROMOTIONS_CREATE: 'promotions.create',
  PROMOTIONS_UPDATE: 'promotions.update',
  PROMOTIONS_DELETE: 'promotions.delete',

  // Redemptions
  REDEMPTIONS_VIEW: 'redemptions.view',
  REDEMPTIONS_VALIDATE: 'redemptions.validate',

  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_EXPORT: 'customers.export',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',

  // Team
  TEAM_VIEW: 'team.view',
  TEAM_MANAGE: 'team.manage',

  // Roles
  ROLES_MANAGE: 'roles.manage',
  ROLES_VIEW: 'roles.view',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',

  // Billing
  BILLING_VIEW: 'billing.view',
  BILLING_MANAGE: 'billing.manage',

  // Restaurants and branches
  RESTAURANT_VIEW: 'restaurant.view',
  RESTAURANT_CREATE: 'restaurant.create',
  RESTAURANT_UPDATE: 'restaurant.update',
  RESTAURANT_BRANCH_VIEW: 'restaurant.branch.view',
  RESTAURANT_BRANCH_UPDATE: 'restaurant.branch.update',
  RESTAURANT_BRANCH_STATUS_UPDATE: 'restaurant.branch.status.update',
} as const;

export type PermissionCode =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];