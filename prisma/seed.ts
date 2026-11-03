import {
  PrismaClient,
  BillingInterval,
} from '@prisma/client';

import {
  SYSTEM_ROLE_PERMISSIONS,
} from '../src/common/authorization/constants/role-permissions.constant.js';

import type {
  PermissionCode,
  SystemRoleCode,
} from '../src/common/authorization/constants/permissions.constant.js';

const prisma = new PrismaClient();

// ======================================================
// CUISINES
// ======================================================

const cuisines = [
  { code: 'colombian', name: 'Colombiana', sortOrder: 1 },
  { code: 'grill', name: 'Parrilla', sortOrder: 2 },
  { code: 'italian', name: 'Italiana', sortOrder: 3 },
  { code: 'mexican', name: 'Mexicana', sortOrder: 4 },
  { code: 'asian', name: 'Asiática', sortOrder: 5 },
  { code: 'seafood', name: 'Mariscos', sortOrder: 6 },
  { code: 'fast-food', name: 'Comida rápida', sortOrder: 7 },
  { code: 'cafe', name: 'Café', sortOrder: 8 },
  { code: 'other', name: 'Otra', sortOrder: 9 },
];

// ======================================================
// PRICE RANGES
// ======================================================

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

// ======================================================
// FEATURES
// ======================================================

const features = [
  // Promociones
  {
    code: 'PROMOTIONS_BASIC',
    name: 'Promociones básicas',
    description: 'Crear y administrar promociones.',
  },
  {
    code: 'PROMOTIONS_UNLIMITED',
    name: 'Promociones ilimitadas',
    description: 'Crear promociones sin límite de cantidad activa.',
  },

  // Sedes
  {
    code: 'MULTI_RESTAURANT',
    name: 'Múltiples restaurantes',
    description: 'Administrar varias sedes desde una organización.',
  },

  // Canjes
  {
    code: 'QR_REDEMPTIONS',
    name: 'Canjes con código QR',
    description: 'Validar y confirmar canjes mediante QR.',
  },
  {
    code: 'REDEMPTION_HISTORY',
    name: 'Historial de canjes',
    description: 'Consultar el historial de canjes.',
  },

  // Analíticas
  {
    code: 'PROMOTION_ANALYTICS',
    name: 'Analíticas de promociones',
    description: 'Consultar métricas de rendimiento de promociones.',
  },

  // Equipo
  {
    code: 'TEAM_MANAGEMENT',
    name: 'Gestión de equipo',
    description: 'Administrar miembros y accesos del equipo.',
  },

  // Clientes
  {
    code: 'CUSTOMER_DATABASE',
    name: 'Base de clientes',
    description: 'Administrar y consultar clientes de la organización.',
  },

  // Segmentación
  {
    code: 'CUSTOMER_SEGMENTATION',
    name: 'Segmentación de clientes',
    description: 'Crear y administrar segmentos de clientes.',
  },
  {
    code: 'TARGETED_PROMOTIONS',
    name: 'Promociones dirigidas',
    description: 'Crear promociones dirigidas a segmentos específicos.',
  },

  // Fidelización
  {
    code: 'LOYALTY_PROGRAM',
    name: 'Programas de fidelización',
    description: 'Crear programas de fidelización.',
  },
  {
    code: 'LOYALTY_POINTS',
    name: 'Sistema de puntos',
    description: 'Administrar puntos de fidelización.',
  },
  {
    code: 'LOYALTY_REWARDS',
    name: 'Recompensas',
    description: 'Configurar recompensas y beneficios.',
  },

  // Automatización
  {
    code: 'AUTOMATED_CAMPAIGNS',
    name: 'Campañas automatizadas',
    description: 'Automatizar campañas para clientes.',
  },

  // Analíticas avanzadas
  {
    code: 'ADVANCED_ANALYTICS',
    name: 'Analíticas avanzadas',
    description: 'Consultar métricas avanzadas.',
  },

  // Exportación
  {
    code: 'PROMOTION_EXPORT',
    name: 'Exportación de reportes',
    description: 'Exportar reportes de promociones y canjes.',
  },
];

// ======================================================
// PLANS
// ======================================================

const plans = [
  {
    code: 'STARTER',
    name: 'Starter',
    description: 'Plan inicial para comenzar a utilizar PromoApp.',

    priceAmount: 0n,
    currency: 'COP',
    billingInterval: BillingInterval.MONTH,

    trialDays: 0,

    maxUsers: null,
    maxActivePromotions: 3,
    maxRestaurants: 1,

    requiresPayment: false,
    isFeatured: false,
    isActive: true,
    sortOrder: 1,

    featureCodes: [
      'PROMOTIONS_BASIC',
      'QR_REDEMPTIONS',
      'REDEMPTION_HISTORY',
    ],
  },
  {
    code: 'PRO',
    name: 'Pro',
    description: 'Para restaurantes que buscan ampliar sus campañas promocionales.',

    priceAmount: 39000n,
    currency: 'COP',
    billingInterval: BillingInterval.MONTH,

    trialDays: 14,

    maxUsers: null,
    maxActivePromotions: null,
    maxRestaurants: 1,

    requiresPayment: true,
    isFeatured: true,
    isActive: true,
    sortOrder: 2,

    featureCodes: [
      'PROMOTIONS_BASIC',
      'PROMOTIONS_UNLIMITED',
      'QR_REDEMPTIONS',
      'REDEMPTION_HISTORY',
      'PROMOTION_ANALYTICS',
      'TEAM_MANAGEMENT',
    ],
  },
  {
    code: 'BUSINESS',
    name: 'Business',
    description: 'Para organizaciones que administran múltiples restaurantes.',

    priceAmount: 89000n,
    currency: 'COP',
    billingInterval: BillingInterval.MONTH,

    trialDays: 0,

    maxUsers: null,
    maxActivePromotions: null,
    maxRestaurants: null,

    requiresPayment: true,
    isFeatured: false,
    isActive: true,
    sortOrder: 3,

    featureCodes: [
      'PROMOTIONS_BASIC',
      'PROMOTIONS_UNLIMITED',
      'MULTI_RESTAURANT',
      'QR_REDEMPTIONS',
      'REDEMPTION_HISTORY',
      'PROMOTION_ANALYTICS',
      'TEAM_MANAGEMENT',
    ],
  },
];

// ======================================================
// PROMOTION CATEGORIES
// ======================================================

const promotionCategories = [
  {
    code: 'FOOD',
    name: 'Comidas',
    description: 'Promociones relacionadas con comidas.',
    sortOrder: 1,
  },
  {
    code: 'DRINKS',
    name: 'Bebidas',
    description: 'Promociones relacionadas con bebidas.',
    sortOrder: 2,
  },
  {
    code: 'DESSERTS',
    name: 'Postres',
    description: 'Promociones relacionadas con postres.',
    sortOrder: 3,
  },
  {
    code: 'COMBOS',
    name: 'Combos',
    description: 'Promociones de combos y paquetes.',
    sortOrder: 4,
  },
  {
    code: 'DISCOUNTS',
    name: 'Descuentos',
    description: 'Descuentos generales.',
    sortOrder: 5,
  },
  {
    code: 'SPECIAL_BENEFITS',
    name: 'Beneficios especiales',
    description: 'Beneficios exclusivos para clientes.',
    sortOrder: 6,
  },
  {
    code: 'OTHER',
    name: 'Otros',
    description: 'Otras categorías de promociones.',
    sortOrder: 7,
  },
];

// ======================================================
// PERMISSIONS
// ======================================================

const permissions = [
  // --------------------------------------------------
  // LEGACY RESTAURANT PERMISSIONS
  // Se conservan para compatibilidad con servicios existentes.
  // --------------------------------------------------

  {
    code: 'restaurant.view',
    name: 'Ver restaurante',
    description: 'Consultar la información del restaurante.',
    module: 'restaurants',
  },
  {
    code: 'restaurant.create',
    name: 'Crear restaurante',
    description: 'Crear un restaurante.',
    module: 'restaurants',
  },
  {
    code: 'restaurant.branch.view',
    name: 'Ver sedes',
    description: 'Consultar las sedes del restaurante.',
    module: 'restaurants',
  },
  {
    code: 'restaurant.branch.update',
    name: 'Editar sedes',
    description: 'Modificar información de las sedes.',
    module: 'restaurants',
  },
  {
    code: 'restaurant.branch.status.update',
    name: 'Actualizar estado de sedes',
    description: 'Activar o desactivar sedes.',
    module: 'restaurants',
  },

  // --------------------------------------------------
  // ORGANIZATION
  // --------------------------------------------------

  {
    code: 'organization.read',
    name: 'Ver organización',
    description: 'Consultar la información de la organización.',
    module: 'organization',
  },
  {
    code: 'organization.update',
    name: 'Editar organización',
    description: 'Modificar la información de la organización.',
    module: 'organization',
  },

  // --------------------------------------------------
  // RESTAURANTS
  // --------------------------------------------------

  {
    code: 'restaurants.read',
    name: 'Ver sedes',
    description: 'Consultar las sedes de la organización.',
    module: 'restaurants',
  },
  {
    code: 'restaurants.create',
    name: 'Crear sedes',
    description: 'Registrar nuevas sedes.',
    module: 'restaurants',
  },
  {
    code: 'restaurants.update',
    name: 'Editar sedes',
    description: 'Modificar información de las sedes.',
    module: 'restaurants',
  },
  {
    code: 'restaurants.manage_status',
    name: 'Cambiar estado de sedes',
    description: 'Activar o desactivar sedes.',
    module: 'restaurants',
  },

  // --------------------------------------------------
  // TEAM
  // --------------------------------------------------

  {
    code: 'team.read',
    name: 'Ver equipo',
    description: 'Consultar miembros y sus asignaciones.',
    module: 'team',
  },
  {
    code: 'team.invite',
    name: 'Invitar miembros',
    description: 'Invitar usuarios a la organización o sede.',
    module: 'team',
  },
  {
    code: 'team.update',
    name: 'Editar miembros',
    description: 'Modificar roles y alcance de miembros.',
    module: 'team',
  },
  {
    code: 'team.remove',
    name: 'Retirar miembros',
    description: 'Retirar miembros de la organización o sede.',
    module: 'team',
  },
  {
    code: 'roles.manage',
    name: 'Gestionar roles',
    description: 'Crear y administrar roles y permisos.',
    module: 'team',
  },

  // --------------------------------------------------
  // PROMOTIONS
  // --------------------------------------------------

  {
    code: 'promotions.read',
    name: 'Ver promociones',
    description: 'Consultar promociones según el alcance asignado.',
    module: 'promotions',
  },
  {
    code: 'promotions.create',
    name: 'Crear promociones',
    description: 'Crear promociones para la organización.',
    module: 'promotions',
  },
  {
    code: 'promotions.update',
    name: 'Editar promociones',
    description: 'Editar promociones existentes.',
    module: 'promotions',
  },
  {
    code: 'promotions.publish',
    name: 'Publicar promociones',
    description: 'Publicar o programar promociones.',
    module: 'promotions',
  },
  {
    code: 'promotions.pause',
    name: 'Pausar promociones',
    description: 'Pausar y reanudar promociones.',
    module: 'promotions',
  },
  {
    code: 'promotions.archive',
    name: 'Archivar promociones',
    description: 'Archivar promociones sin eliminar su historial.',
    module: 'promotions',
  },
  {
    code: 'promotions.manage_locations',
    name: 'Asignar sedes a promociones',
    description: 'Configurar sedes participantes.',
    module: 'promotions',
  },

  // --------------------------------------------------
  // REDEMPTIONS
  // --------------------------------------------------

  {
    code: 'redemptions.validate',
    name: 'Validar QR',
    description: 'Validar la intención o token de canje.',
    module: 'redemptions',
  },
  {
    code: 'redemptions.confirm',
    name: 'Confirmar canjes',
    description: 'Confirmar y registrar un canje validado.',
    module: 'redemptions',
  },
  {
    code: 'redemptions.read',
    name: 'Consultar canjes',
    description: 'Consultar canjes dentro del alcance autorizado.',
    module: 'redemptions',
  },
  {
    code: 'redemptions.reverse',
    name: 'Anular canjes',
    description: 'Anular canjes con motivo y trazabilidad.',
    module: 'redemptions',
  },

  // --------------------------------------------------
  // CUSTOMERS
  // --------------------------------------------------

  {
    code: 'customers.read',
    name: 'Consultar clientes',
    description: 'Consultar clientes de la organización.',
    module: 'customers',
  },
  {
    code: 'customers.update',
    name: 'Editar clientes',
    description: 'Modificar información permitida de clientes.',
    module: 'customers',
  },
  {
    code: 'customers.export',
    name: 'Exportar clientes',
    description: 'Exportar información autorizada de clientes.',
    module: 'customers',
  },

  // --------------------------------------------------
  // SEGMENTATION
  // --------------------------------------------------

  {
    code: 'segments.read',
    name: 'Consultar segmentos',
    description: 'Consultar segmentos de clientes.',
    module: 'segmentation',
  },
  {
    code: 'segments.create',
    name: 'Crear segmentos',
    description: 'Crear segmentos de clientes.',
    module: 'segmentation',
  },
  {
    code: 'segments.update',
    name: 'Editar segmentos',
    description: 'Modificar reglas y miembros de segmentos.',
    module: 'segmentation',
  },
  {
    code: 'segments.delete',
    name: 'Eliminar segmentos',
    description: 'Eliminar segmentos.',
    module: 'segmentation',
  },

  // --------------------------------------------------
  // LOYALTY
  // --------------------------------------------------

  {
    code: 'loyalty.read',
    name: 'Consultar fidelización',
    description: 'Consultar programas y movimientos.',
    module: 'loyalty',
  },
  {
    code: 'loyalty.manage',
    name: 'Administrar fidelización',
    description: 'Crear y configurar programas.',
    module: 'loyalty',
  },
  {
    code: 'loyalty.rewards.manage',
    name: 'Administrar recompensas',
    description: 'Crear y administrar recompensas.',
    module: 'loyalty',
  },
  {
    code: 'loyalty.points.adjust',
    name: 'Ajustar puntos',
    description: 'Realizar ajustes autorizados en puntos.',
    module: 'loyalty',
  },

  // --------------------------------------------------
  // ANALYTICS
  // --------------------------------------------------

  {
    code: 'analytics.read',
    name: 'Ver analíticas',
    description: 'Consultar métricas e indicadores.',
    module: 'analytics',
  },

  // --------------------------------------------------
  // AUDIT
  // --------------------------------------------------

  {
    code: 'audit.read',
    name: 'Consultar auditoría',
    description: 'Consultar registros de auditoría.',
    module: 'audit',
  },

  // --------------------------------------------------
  // SUBSCRIPTIONS
  // --------------------------------------------------

  {
    code: 'subscriptions.read',
    name: 'Ver suscripción',
    description: 'Consultar el plan y estado de la suscripción.',
    module: 'subscriptions',
  },
  {
    code: 'subscriptions.manage',
    name: 'Gestionar suscripción',
    description: 'Cambiar o administrar la suscripción.',
    module: 'subscriptions',
  },

  // --------------------------------------------------
  // BILLING
  // --------------------------------------------------

  {
    code: 'billing.read',
    name: 'Ver facturación',
    description: 'Consultar métodos de pago y pagos.',
    module: 'billing',
  },
  {
    code: 'billing.manage',
    name: 'Gestionar facturación',
    description: 'Administrar métodos de pago y operaciones.',
    module: 'billing',
  },
];

// ======================================================
// SEED CUISINES
// ======================================================

async function seedCuisines(): Promise<void> {
  for (const item of cuisines) {
    await prisma.cuisine.upsert({
      where: {
        code: item.code,
      },
      update: {
        name: item.name,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        ...item,
        isActive: true,
      },
    });
  }
}

// ======================================================
// SEED PRICE RANGES
// ======================================================

async function seedPriceRanges(): Promise<void> {
  for (const item of priceRanges) {
    await prisma.priceRange.upsert({
      where: {
        code: item.code,
      },
      update: {
        symbol: item.symbol,
        name: item.name,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        ...item,
        isActive: true,
      },
    });
  }
}

// ======================================================
// SEED FEATURES
// ======================================================

async function seedFeatures(): Promise<Map<string, string>> {
  const featureIds = new Map<string, string>();

  for (const item of features) {
    const feature = await prisma.feature.upsert({
      where: {
        code: item.code,
      },
      update: {
        name: item.name,
        description: item.description,
        isActive: true,
      },
      create: {
        ...item,
        isActive: true,
      },
    });

    featureIds.set(feature.code, feature.id);
  }

  return featureIds;
}

// ======================================================
// SEED PLANS
// ======================================================

async function seedPlans(
  featureIds: Map<string, string>,
): Promise<void> {
  for (const plan of plans) {
    const {
      featureCodes,
      ...planData
    } = plan;

    // Los valores comerciales se establecen al crear el plan.
    // Si ya existe, no sobrescribimos precios ni límites configurados.
    const savedPlan = await prisma.plan.upsert({
      where: {
        code: plan.code,
      },
      update: {
        name: plan.name,
        description: plan.description,
        sortOrder: plan.sortOrder,
      },
      create: planData,
    });

    const relations = featureCodes.map((featureCode) => {
      const featureId = featureIds.get(featureCode);

      if (!featureId) {
        throw new Error(
          `Feature no encontrada para el plan ${plan.code}: ${featureCode}`,
        );
      }

      return {
        planId: savedPlan.id,
        featureId,
      };
    });

    // Agrega relaciones faltantes sin borrar las existentes.
    await prisma.planFeature.createMany({
      data: relations,
      skipDuplicates: true,
    });
  }
}

// ======================================================
// SEED PERMISSIONS
// ======================================================

async function seedPermissions(): Promise<void> {
  console.info('🔐 Sincronizando permisos...');

  // Catálogo explícito del seed.
  const permissionDefinitions = new Map(
    permissions.map((permission) => [
      permission.code,
      permission,
    ]),
  );

  // También incorporamos cualquier permiso asignado en la matriz
  // de roles, evitando que una referencia quede sin registro en DB.
  const rolePermissionCodes = Object.values(
    SYSTEM_ROLE_PERMISSIONS,
  ).flat() as PermissionCode[];

  for (const code of rolePermissionCodes) {
    if (!permissionDefinitions.has(code)) {
      const module = code.split('.')[0];

      const name = code
        .split('.')
        .join(' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

      permissionDefinitions.set(code, {
        code,
        name,
        description: `Permiso para ${name.toLowerCase()}.`,
        module,
      });
    }
  }

  for (const item of permissionDefinitions.values()) {
    await prisma.permission.upsert({
      where: {
        code: item.code,
      },
      update: {
        name: item.name,
        description: item.description,
        module: item.module,
        isActive: true,
      },
      create: {
        ...item,
        isActive: true,
      },
    });
  }

  console.info(
    `✓ ${permissionDefinitions.size} permisos procesados`,
  );
}

// ======================================================
// SEED ROLE PERMISSIONS
// ======================================================

async function seedRolePermissions(): Promise<void> {
  console.info('🔐 Sincronizando permisos de roles...');

  const roleCodes: SystemRoleCode[] = [
    'OWNER',
    'ADMIN',
    'MANAGER',
    'STAFF',
  ];

  for (const roleCode of roleCodes) {
    // Busca el rol de sistema existente.
    // No crea roles ni modifica roles personalizados.
    const role = await prisma.role.findFirst({
      where: {
        code: roleCode,
        restaurantId: null,
        organizationId: null,
        isSystem: true,
        isActive: true,
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (!role) {
      throw new Error(
        `No se encontró el rol de sistema ${roleCode}. No se pueden sincronizar sus permisos.`,
      );
    }

    const assignedCodes = [
      ...new Set(SYSTEM_ROLE_PERMISSIONS[roleCode]),
    ];

    const permissionRecords =
      await prisma.permission.findMany({
        where: {
          code: {
            in: [...assignedCodes],
          },
          isActive: true,
        },
        select: {
          id: true,
          code: true,
        },
      });

    const permissionsByCode = new Map(
      permissionRecords.map((permission) => [
        permission.code,
        permission.id,
      ]),
    );

    // Comprueba que todos los permisos asignados existan.
    const missingPermissions = assignedCodes.filter(
      (code) => !permissionsByCode.has(code),
    );

    if (missingPermissions.length > 0) {
      throw new Error(
        `Faltan permisos para el rol ${roleCode}: ${missingPermissions.join(', ')}`,
      );
    }

    const rolePermissionRelations = assignedCodes.map(
      (permissionCode) => {
        const permissionId =
          permissionsByCode.get(permissionCode);

        if (!permissionId) {
          throw new Error(
            `No se encontró el ID del permiso ${permissionCode}.`,
          );
        }

        return {
          roleId: role.id,
          permissionId,
        };
      },
    );

    // Crea únicamente relaciones faltantes.
    // No elimina ni reemplaza asignaciones existentes.
    await prisma.rolePermission.createMany({
      data: rolePermissionRelations,
      skipDuplicates: true,
    });

    console.info(
      `✓ ${roleCode}: ${assignedCodes.length} permisos procesados`,
    );
  }
}

// ======================================================
// SEED PROMOTION CATEGORIES
// ======================================================

async function seedPromotionCategories(): Promise<void> {
  for (const item of promotionCategories) {
    await prisma.promotionCategory.upsert({
      where: {
        code: item.code,
      },
      update: {
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        ...item,
        isActive: true,
      },
    });
  }
}

// ======================================================
// MAIN
// ======================================================

async function main(): Promise<void> {
  console.info('🌱 Iniciando seed de PromoApp...');

  await seedCuisines();

  console.info(
    `✓ ${cuisines.length} tipos de cocina`,
  );

  await seedPriceRanges();

  console.info(
    `✓ ${priceRanges.length} rangos de precios`,
  );

  const featureIds = await seedFeatures();

  console.info(
    `✓ ${features.length} funcionalidades`,
  );

  await seedPlans(featureIds);

  console.info(
    `✓ ${plans.length} planes`,
  );

  await seedPermissions();

  console.info(
    `✓ ${permissions.length} permisos del catálogo procesados`,
  );

  await seedRolePermissions();

  console.info(
    '✓ Permisos de roles sincronizados',
  );

  await seedPromotionCategories();

  console.info(
    `✓ ${promotionCategories.length} categorías de promociones`,
  );

  console.info('✅ Seed de PromoApp completado.');
}

// ======================================================
// EXECUTION
// ======================================================

main()
  .catch((error: unknown) => {
    console.error('❌ Error ejecutando el seed:', error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });