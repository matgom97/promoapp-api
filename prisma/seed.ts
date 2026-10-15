import { PrismaClient } from '@prisma/client';

import {
  SYSTEM_ROLE_PERMISSIONS,
} from '../src/common/authorization/constants/role-permissions.constant.js';

import type {
  PermissionCode,
} from '../src/common/authorization/constants/permissions.constant.js';

const prisma = new PrismaClient();

// ============================================================
// CUISINES
// ============================================================

async function seedCuisines() {
  const cuisines = [
    { code: 'colombian', name: 'Colombiana', sortOrder: 1 },
    { code: 'parrilla', name: 'Parrilla', sortOrder: 2 },
    { code: 'italian', name: 'Italiana', sortOrder: 3 },
    { code: 'mexican', name: 'Mexicana', sortOrder: 4 },
    { code: 'asian', name: 'Asiática', sortOrder: 5 },
    { code: 'seafood', name: 'Mariscos', sortOrder: 6 },
    { code: 'fast-food', name: 'Comida rápida', sortOrder: 7 },
    { code: 'cafe', name: 'Café', sortOrder: 8 },
    { code: 'other', name: 'Otra', sortOrder: 9 },
  ];

  for (const cuisine of cuisines) {
    await prisma.cuisine.upsert({
      where: { code: cuisine.code },
      update: {
        name: cuisine.name,
        sortOrder: cuisine.sortOrder,
        isActive: true,
      },
      create: {
        ...cuisine,
        isActive: true,
      },
    });
  }

  console.log(`✓ ${cuisines.length} cuisines seeded`);
}

// ============================================================
// PRICE RANGES
// ============================================================

async function seedPriceRanges() {
  const priceRanges = [
    {
      code: 'economic',
      symbol: '$',
      name: 'Económico',
      sortOrder: 1,
    },
    {
      code: 'moderate',
      symbol: '$$',
      name: 'Moderado',
      sortOrder: 2,
    },
    {
      code: 'premium',
      symbol: '$$$',
      name: 'Premium',
      sortOrder: 3,
    },
    {
      code: 'fine-dining',
      symbol: '$$$$',
      name: 'Alta cocina',
      sortOrder: 4,
    },
  ];

  for (const priceRange of priceRanges) {
    await prisma.priceRange.upsert({
      where: { code: priceRange.code },
      update: {
        symbol: priceRange.symbol,
        name: priceRange.name,
        sortOrder: priceRange.sortOrder,
        isActive: true,
      },
      create: {
        ...priceRange,
        isActive: true,
      },
    });
  }

  console.log(`✓ ${priceRanges.length} price ranges seeded`);
}

// ============================================================
// PLAN FEATURES CATALOG
// ============================================================

async function seedFeatures() {
  const features = [
    {
      code: 'PROMOTIONS',
      name: 'Promociones',
      description: 'Creación y administración de promociones.',
    },
    {
      code: 'QR_CODES',
      name: 'Códigos QR',
      description: 'Generación de códigos QR para promociones.',
    },
    {
      code: 'VERIFIED_REDEMPTIONS',
      name: 'Canjes verificados',
      description: 'Validación y registro de canjes de promociones.',
    },
    {
      code: 'BASIC_ANALYTICS',
      name: 'Analíticas básicas',
      description: 'Métricas básicas de promociones y canjes.',
    },
    {
      code: 'CUSTOM_QR',
      name: 'Códigos QR personalizados',
      description: 'Personalización de códigos QR.',
    },
    {
      code: 'ADVANCED_ANALYTICS',
      name: 'Analíticas avanzadas',
      description: 'Métricas y análisis avanzados.',
    },
    {
      code: 'CUSTOMER_SEGMENTATION',
      name: 'Segmentación de clientes',
      description: 'Segmentación de clientes según comportamiento.',
    },
    {
      code: 'USER_ROLES',
      name: 'Usuarios y roles',
      description: 'Gestión de usuarios y permisos.',
    },
    {
      code: 'MULTIPLE_RESTAURANTS',
      name: 'Múltiples restaurantes',
      description: 'Gestión de múltiples restaurantes.',
    },
    {
      code: 'ADVANCED_REPORTS',
      name: 'Reportes avanzados',
      description: 'Generación de reportes avanzados.',
    },
    {
      code: 'TEAM_MANAGEMENT',
      name: 'Gestión de equipos',
      description: 'Administración de equipos de trabajo.',
    },
    {
      code: 'PRIORITY_SUPPORT',
      name: 'Soporte prioritario',
      description: 'Atención prioritaria para clientes Business.',
    },
  ];

  for (const feature of features) {
    await prisma.feature.upsert({
      where: { code: feature.code },
      update: {
        name: feature.name,
        description: feature.description,
        isActive: true,
      },
      create: {
        ...feature,
        isActive: true,
      },
    });
  }

  console.log(`✓ ${features.length} features seeded`);
}

// ============================================================
// PLANS
// ============================================================

async function seedPlans() {
  const plans = [
    {
      code: 'starter',
      name: 'Starter',
      description: 'Para restaurantes que están comenzando.',
      priceAmount: BigInt(0),
      currency: 'COP',
      billingInterval: 'MONTH' as const,
      trialDays: 0,
      maxUsers: null,
      maxActivePromotions: 3,
      maxRestaurants: 1,
      requiresPayment: false,
      isFeatured: false,
      sortOrder: 1,
    },
    {
      code: 'pro',
      name: 'Pro',
      description: 'Para restaurantes que quieren crecer.',
      priceAmount: BigInt(39000),
      currency: 'COP',
      billingInterval: 'MONTH' as const,
      trialDays: 14,
      maxUsers: null,
      maxActivePromotions: null,
      maxRestaurants: 1,
      requiresPayment: true,
      isFeatured: true,
      sortOrder: 2,
    },
    {
      code: 'business',
      name: 'Business',
      description: 'Para equipos y operaciones más grandes.',
      priceAmount: BigInt(89000),
      currency: 'COP',
      billingInterval: 'MONTH' as const,
      trialDays: 0,
      maxUsers: null,
      maxActivePromotions: null,
      maxRestaurants: null,
      requiresPayment: true,
      isFeatured: false,
      sortOrder: 3,
    },
  ];

  const result: Record<string, { id: string; code: string }> = {};

  for (const plan of plans) {
    const savedPlan = await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        priceAmount: plan.priceAmount,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        trialDays: plan.trialDays,
        maxUsers: plan.maxUsers,
        maxActivePromotions: plan.maxActivePromotions,
        maxRestaurants: plan.maxRestaurants,
        requiresPayment: plan.requiresPayment,
        isFeatured: plan.isFeatured,
        isActive: true,
        sortOrder: plan.sortOrder,
      },
      create: {
        ...plan,
        isActive: true,
      },
    });

    result[savedPlan.code] = {
      id: savedPlan.id,
      code: savedPlan.code,
    };
  }

  console.log(
    `✓ Plans seeded: ${Object.keys(result).join(', ')}`,
  );

  return result;
}

// ============================================================
// PLAN ↔ FEATURES
// ============================================================

async function seedPlanFeatures() {
  const plans = await prisma.plan.findMany({
    where: {
      code: {
        in: ['starter', 'pro', 'business'],
      },
    },
  });

  const features = await prisma.feature.findMany({
    where: {
      code: {
        in: [
          'PROMOTIONS',
          'QR_CODES',
          'VERIFIED_REDEMPTIONS',
          'BASIC_ANALYTICS',
          'CUSTOM_QR',
          'ADVANCED_ANALYTICS',
          'CUSTOMER_SEGMENTATION',
          'USER_ROLES',
          'MULTIPLE_RESTAURANTS',
          'ADVANCED_REPORTS',
          'TEAM_MANAGEMENT',
          'PRIORITY_SUPPORT',
        ],
      },
    },
  });

  const planMap = new Map(
    plans.map((plan) => [plan.code, plan]),
  );

  const featureMap = new Map(
    features.map((feature) => [feature.code, feature]),
  );

  const planFeatureMap: Record<string, string[]> = {
    starter: [
      'PROMOTIONS',
      'QR_CODES',
      'VERIFIED_REDEMPTIONS',
      'BASIC_ANALYTICS',
    ],

    pro: [
      'PROMOTIONS',
      'QR_CODES',
      'VERIFIED_REDEMPTIONS',
      'BASIC_ANALYTICS',
      'CUSTOM_QR',
      'ADVANCED_ANALYTICS',
      'CUSTOMER_SEGMENTATION',
      'USER_ROLES',
    ],

    business: [
      'PROMOTIONS',
      'QR_CODES',
      'VERIFIED_REDEMPTIONS',
      'BASIC_ANALYTICS',
      'CUSTOM_QR',
      'ADVANCED_ANALYTICS',
      'CUSTOMER_SEGMENTATION',
      'USER_ROLES',
      'MULTIPLE_RESTAURANTS',
      'ADVANCED_REPORTS',
      'TEAM_MANAGEMENT',
      'PRIORITY_SUPPORT',
    ],
  };

  for (const [planCode, featureCodes] of Object.entries(
    planFeatureMap,
  )) {
    const plan = planMap.get(planCode);

    if (!plan) {
      throw new Error(`Plan not found: ${planCode}`);
    }

    for (const featureCode of featureCodes) {
      const feature = featureMap.get(featureCode);

      if (!feature) {
        throw new Error(`Feature not found: ${featureCode}`);
      }

      await prisma.planFeature.upsert({
        where: {
          planId_featureId: {
            planId: plan.id,
            featureId: feature.id,
          },
        },
        update: {},
        create: {
          planId: plan.id,
          featureId: feature.id,
        },
      });
    }
  }

  console.log('✓ Plan features seeded');
}

// ============================================================
// PERMISSIONS CATALOG
// ============================================================

async function seedPermissions() {
  const permissions = [
    {
      code: 'dashboard.view',
      name: 'Ver dashboard',
      description: 'Consultar el panel principal.',
      module: 'dashboard',
    },
    {
      code: 'promotions.view',
      name: 'Ver promociones',
      description: 'Consultar promociones.',
      module: 'promotions',
    },
    {
      code: 'promotions.create',
      name: 'Crear promociones',
      description: 'Crear promociones.',
      module: 'promotions',
    },
    {
      code: 'promotions.update',
      name: 'Editar promociones',
      description: 'Modificar promociones.',
      module: 'promotions',
    },
    {
      code: 'promotions.delete',
      name: 'Eliminar promociones',
      description: 'Eliminar promociones.',
      module: 'promotions',
    },
    {
      code: 'redemptions.view',
      name: 'Ver canjes',
      description: 'Consultar los canjes registrados.',
      module: 'redemptions',
    },
    {
      code: 'redemptions.validate',
      name: 'Validar canjes',
      description: 'Validar el canje de promociones.',
      module: 'redemptions',
    },
    {
      code: 'customers.view',
      name: 'Ver clientes',
      description: 'Consultar clientes.',
      module: 'customers',
    },
    {
      code: 'customers.export',
      name: 'Exportar clientes',
      description: 'Exportar información de clientes.',
      module: 'customers',
    },
    {
      code: 'analytics.view',
      name: 'Ver analíticas',
      description: 'Consultar estadísticas.',
      module: 'analytics',
    },
    {
      code: 'team.view',
      name: 'Ver equipo',
      description: 'Consultar miembros del equipo.',
      module: 'team',
    },
    {
      code: 'team.manage',
      name: 'Administrar equipo',
      description: 'Administrar miembros del equipo.',
      module: 'team',
    },
    {
      code: 'roles.manage',
      name: 'Administrar roles',
      description: 'Gestionar roles y sus permisos.',
      module: 'roles',
    },
    {
      code: 'settings.view',
      name: 'Ver configuración',
      description: 'Consultar configuración del restaurante.',
      module: 'settings',
    },
    {
      code: 'settings.manage',
      name: 'Administrar configuración',
      description: 'Modificar configuración del restaurante.',
      module: 'settings',
    },
  ] satisfies Array<{
    code: PermissionCode;
    name: string;
    description: string;
    module: string;
  }>;

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        code: permission.code,
      },
      update: {
        name: permission.name,
        description: permission.description,
        module: permission.module,
        isActive: true,
      },
      create: {
        ...permission,
        isActive: true,
      },
    });
  }

  console.log(`✓ ${permissions.length} permissions seeded`);
}

// ============================================================
// SYSTEM ROLE ↔ PERMISSIONS
// ============================================================

async function seedRolePermissions() {
  const systemRoleIds = {
    OWNER: 'system_role_owner',
    ADMIN: 'system_role_admin',
    MANAGER: 'system_role_manager',
    STAFF: 'system_role_staff',
  } as const;

  for (const [roleCode, permissionCodes] of Object.entries(
    SYSTEM_ROLE_PERMISSIONS,
  )) {
    const roleId =
      systemRoleIds[roleCode as keyof typeof systemRoleIds];

    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        code: roleCode,
        restaurantId: null,
        isSystem: true,
        isActive: true,
      },
    });

    if (!role) {
      throw new Error(
        `System role not found or inactive: ${roleCode}`,
      );
    }

    for (const permissionCode of permissionCodes) {
      const permission = await prisma.permission.findUnique({
        where: {
          code: permissionCode,
        },
      });

      if (!permission || !permission.isActive) {
        throw new Error(
          `Active permission not found: ${permissionCode}`,
        );
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('✓ System role permissions seeded');
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('🌱 Starting PromoTable database seed...\n');

  await seedCuisines();
  await seedPriceRanges();
  await seedFeatures();

  await seedPlans();
  await seedPlanFeatures();

  await seedPermissions();
  await seedRolePermissions();

  console.log(
    '\n✅ PromoTable database seed completed successfully.',
  );
}

main()
  .catch((error: unknown) => {
    console.error('\n❌ Seed failed:');
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });