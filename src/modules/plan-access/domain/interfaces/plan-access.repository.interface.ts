export interface OrganizationPlanAccess {
  subscriptionId: string;
  planId: string;
  planCode: string;
  planName: string;

  features: string[];

  limits: {
    maxUsers: number | null;
    maxActivePromotions: number | null;
    maxRestaurants: number | null;
  };
}

export interface PlanAccessRepository {
  findActiveOrganizationPlan(
    organizationId: string,
  ): Promise<OrganizationPlanAccess | null>;
}