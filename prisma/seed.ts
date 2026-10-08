import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCuisines() {
  const cuisines = [
    {
      code: 'colombian',
      name: 'Colombiana',
      sortOrder: 1,
    },
    {
      code: 'parrilla',
      name: 'Parrilla',
      sortOrder: 2,
    },
    {
      code: 'italian',
      name: 'Italiana',
      sortOrder: 3,
    },
    {
      code: 'mexican',
      name: 'Mexicana',
      sortOrder: 4,
    },
    {
      code: 'asian',
      name: 'Asiática',
      sortOrder: 5,
    },
    {
      code: 'seafood',
      name: 'Mariscos',
      sortOrder: 6,
    },
    {
      code: 'fast-food',
      name: 'Comida rápida',
      sortOrder: 7,
    },
    {
      code: 'cafe',
      name: 'Café',
      sortOrder: 8,
    },
    {
      code: 'other',
      name: 'Otra',
      sortOrder: 9,
    },
  ];

  for (const cuisine of cuisines) {
    await prisma.cuisine.upsert({
      where: {
        code: cuisine.code,
      },
      update: {
        name: cuisine.name,
        sortOrder: cuisine.sortOrder,
        isActive: true,
      },
      create: {
        code: cuisine.code,
        name: cuisine.name,
        sortOrder: cuisine.sortOrder,
        isActive: true,
      },
    });
  }

  console.log(`✓ ${cuisines.length} cuisines seeded`);
}

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
      where: {
        code: priceRange.code,
      },
      update: {
        symbol: priceRange.symbol,
        name: priceRange.name,
        sortOrder: priceRange.sortOrder,
        isActive: true,
      },
      create: {
        code: priceRange.code,
        symbol: priceRange.symbol,
        name: priceRange.name,
        sortOrder: priceRange.sortOrder,
        isActive: true,
      },
    });
  }

  console.log(`✓ ${priceRanges.length} price ranges seeded`);
}

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
      where: {
        code: feature.code,
      },
      update: {
        name: feature.name,
        description: feature.description,
        isActive: true,
      },
      create: {
        code: feature.code,
        name: feature.name,
        description: feature.description,
        isActive: true,
      },
    });
  }

  console.log(`✓ ${features.length} features seeded`);
}

async function seedPlans() {
  const starter = await prisma.plan.upsert({
    where: {
      code: 'starter',
    },
    update: {
      name: 'Starter',
      description: 'Para restaurantes que están comenzando.',
      priceAmount: BigInt(0),
      currency: 'COP',
      billingInterval: 'MONTH',
      trialDays: 0,
      maxUsers: null,
      maxActivePromotions: 3,
      maxRestaurants: 1,
      requiresPayment: false,
      isFeatured: false,
      isActive: true,
      sortOrder: 1,
    },
    create: {
      code: 'starter',
      name: 'Starter',
      description: 'Para restaurantes que están comenzando.',
      priceAmount: BigInt(0),
      currency: 'COP',
      billingInterval: 'MONTH',
      trialDays: 0,
      maxUsers: null,
      maxActivePromotions: 3,
      maxRestaurants: 1,
      requiresPayment: false,
      isFeatured: false,
      isActive: true,
      sortOrder: 1,
    },
  });

  const pro = await prisma.plan.upsert({
    where: {
      code: 'pro',
    },
    update: {
      name: 'Pro',
      description: 'Para restaurantes que quieren crecer.',
      priceAmount: BigInt(39000),
      currency: 'COP',
      billingInterval: 'MONTH',
      trialDays: 14,
      maxUsers: null,
      maxActivePromotions: null,
      maxRestaurants: 1,
      requiresPayment: true,
      isFeatured: true,
      isActive: true,
      sortOrder: 2,
    },
    create: {
      code: 'pro',
      name: 'Pro',
      description: 'Para restaurantes que quieren crecer.',
      priceAmount: BigInt(39000),
      currency: 'COP',
      billingInterval: 'MONTH',
      trialDays: 14,
      maxUsers: null,
      maxActivePromotions: null,
      maxRestaurants: 1,
      requiresPayment: true,
      isFeatured: true,
      isActive: true,
      sortOrder: 2,
    },
  });

  const business = await prisma.plan.upsert({
    where: {
      code: 'business',
    },
    update: {
      name: 'Business',
      description: 'Para equipos y operaciones más grandes.',
      priceAmount: BigInt(89000),
      currency: 'COP',
      billingInterval: 'MONTH',
      trialDays: 0,
      maxUsers: null,
      maxActivePromotions: null,
      maxRestaurants: null,
      requiresPayment: true,
      isFeatured: false,
      isActive: true,
      sortOrder: 3,
    },
    create: {
      code: 'business',
      name: 'Business',
      description: 'Para equipos y operaciones más grandes.',
      priceAmount: BigInt(89000),
      currency: 'COP',
      billingInterval: 'MONTH',
      trialDays: 0,
      maxUsers: null,
      maxActivePromotions: null,
      maxRestaurants: null,
      requiresPayment: true,
      isFeatured: false,
      isActive: true,
      sortOrder: 3,
    },
  });

  console.log(`✓ Plans seeded: ${starter.code}, ${pro.code}, ${business.code}`);

  return {
    starter,
    pro,
    business,
  };
}

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

async function main() {
  console.log('🌱 Starting PromoTable database seed...\n');

  await seedCuisines();
  await seedPriceRanges();
  await seedFeatures();
  await seedPlans();
  await seedPlanFeatures();

  console.log('\n✅ PromoTable database seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('\n❌ Seed failed:');
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });