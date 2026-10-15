-- MySQL dump 10.13  Distrib 9.7.1, for macos26.4 (arm64)
--
-- Host: localhost    Database: promoapp
-- ------------------------------------------------------
-- Server version	9.7.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '75a93d86-8888-11f1-b11e-4b9b29f861fd:1-816';

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('04335eb1-d06a-4090-9d54-2b276c9be64b','82184c85bf1c469194e77f48d11504ef1b0ff1e18cc0dc1b4968e36711a9f18e','2026-10-02 23:08:49.850','20261002230849_add_refresh_tokens',NULL,NULL,'2026-10-02 23:08:49.796',1),('4ac97baa-fe1a-462a-bdbe-0cbc432fae84','660c8792453041201024ca9404153ba14de079292ab5f177145148b66d364874','2026-09-29 20:11:40.093','20260929201140_improve_money_fields',NULL,NULL,'2026-09-29 20:11:40.057',1),('7ebf3018-abd9-448c-828e-bc8171c8daf5','ccebfe5b4543b43ac47fae1099b9cbe17f239031b463737f4adc8329baeadebd','2026-10-13 20:52:38.787','20261013204020_add_roles_and_permissions',NULL,NULL,'2026-10-13 20:52:38.633',1),('ab658456-5d5d-458f-ad6f-ed31a40c2796','96f3a46547838d8dddad32ecbd34f7af448d47e44f960d0250baaf50bbdec03b','2026-09-29 20:54:29.351','20260929205429_add_pending_subscription_status',NULL,NULL,'2026-09-29 20:54:29.329',1),('d95368b4-308d-4fa8-a84a-98645ce9258b','d2dc6e172e3770540e8dc47336af5c377af3c040ebc7caf9852497f4ccb53f37','2026-09-29 20:06:27.739','20260929200626_initial_core',NULL,NULL,'2026-09-29 20:06:26.690',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuisines`
--

DROP TABLE IF EXISTS `cuisines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuisines` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `sortOrder` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cuisines_code_key` (`code`),
  KEY `cuisines_isActive_sortOrder_idx` (`isActive`,`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuisines`
--

LOCK TABLES `cuisines` WRITE;
/*!40000 ALTER TABLE `cuisines` DISABLE KEYS */;
INSERT INTO `cuisines` VALUES ('cmun4e5js0000w5uyzv8gdb8r','colombian','Colombiana',1,1,'2026-09-29 20:19:41.080','2026-10-13 22:07:09.084'),('cmun4e5l60001w5uyoyvt5j4j','parrilla','Parrilla',1,2,'2026-09-29 20:19:41.130','2026-10-13 22:07:09.185'),('cmun4e5le0002w5uyo3rxby41','italian','Italiana',1,3,'2026-09-29 20:19:41.138','2026-10-13 22:07:09.187'),('cmun4e5lh0003w5uydni4mn6a','mexican','Mexicana',1,4,'2026-09-29 20:19:41.141','2026-10-13 22:07:09.192'),('cmun4e5lj0004w5uyfot8xi5y','asian','Asiática',1,5,'2026-09-29 20:19:41.143','2026-10-13 22:07:09.193'),('cmun4e5lk0005w5uyein9t5f8','seafood','Mariscos',1,6,'2026-09-29 20:19:41.145','2026-10-13 22:07:09.195'),('cmun4e5lm0006w5uyk3v7qp1o','fast-food','Comida rápida',1,7,'2026-09-29 20:19:41.147','2026-10-13 22:07:09.198'),('cmun4e5lo0007w5uy7ec45e9i','cafe','Café',1,8,'2026-09-29 20:19:41.148','2026-10-13 22:07:09.199'),('cmun4e5lp0008w5uyotg7wc95','other','Otra',1,9,'2026-09-29 20:19:41.150','2026-10-13 22:07:09.201');
/*!40000 ALTER TABLE `cuisines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `features`
--

DROP TABLE IF EXISTS `features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `features` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `features_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `features`
--

LOCK TABLES `features` WRITE;
/*!40000 ALTER TABLE `features` DISABLE KEYS */;
INSERT INTO `features` VALUES ('cmun4e5m9000dw5uyuz98u5al','PROMOTIONS','Promociones','Creación y administración de promociones.',1,'2026-09-29 20:19:41.169','2026-10-13 22:07:09.215'),('cmun4e5ml000ew5uy412zd19u','QR_CODES','Códigos QR','Generación de códigos QR para promociones.',1,'2026-09-29 20:19:41.181','2026-10-13 22:07:09.230'),('cmun4e5mn000fw5uyy4x6tsrd','VERIFIED_REDEMPTIONS','Canjes verificados','Validación y registro de canjes de promociones.',1,'2026-09-29 20:19:41.184','2026-10-13 22:07:09.232'),('cmun4e5mq000gw5uyn4dn57e6','BASIC_ANALYTICS','Analíticas básicas','Métricas básicas de promociones y canjes.',1,'2026-09-29 20:19:41.186','2026-10-13 22:07:09.233'),('cmun4e5mr000hw5uyhgxl2dem','CUSTOM_QR','Códigos QR personalizados','Personalización de códigos QR.',1,'2026-09-29 20:19:41.188','2026-10-13 22:07:09.235'),('cmun4e5mt000iw5uyvqd8pdmd','ADVANCED_ANALYTICS','Analíticas avanzadas','Métricas y análisis avanzados.',1,'2026-09-29 20:19:41.189','2026-10-13 22:07:09.237'),('cmun4e5mv000jw5uybgay38jy','CUSTOMER_SEGMENTATION','Segmentación de clientes','Segmentación de clientes según comportamiento.',1,'2026-09-29 20:19:41.191','2026-10-13 22:07:09.239'),('cmun4e5mw000kw5uybydr2hbj','USER_ROLES','Usuarios y roles','Gestión de usuarios y permisos.',1,'2026-09-29 20:19:41.193','2026-10-13 22:07:09.239'),('cmun4e5my000lw5uywwc1nyow','MULTIPLE_RESTAURANTS','Múltiples restaurantes','Gestión de múltiples restaurantes.',1,'2026-09-29 20:19:41.194','2026-10-13 22:07:09.241'),('cmun4e5mz000mw5uyr9oh7xzw','ADVANCED_REPORTS','Reportes avanzados','Generación de reportes avanzados.',1,'2026-09-29 20:19:41.196','2026-10-13 22:07:09.243'),('cmun4e5n0000nw5uyyg6nuka7','TEAM_MANAGEMENT','Gestión de equipos','Administración de equipos de trabajo.',1,'2026-09-29 20:19:41.197','2026-10-13 22:07:09.244'),('cmun4e5n2000ow5uyu884n2gg','PRIORITY_SUPPORT','Soporte prioritario','Atención prioritaria para clientes Business.',1,'2026-09-29 20:19:41.199','2026-10-13 22:07:09.245');
/*!40000 ALTER TABLE `features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `restaurantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` enum('WOMPI') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WOMPI',
  `type` enum('CARD','NEQUI') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `providerPaymentSourceId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastFour` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_methods_providerPaymentSourceId_key` (`providerPaymentSourceId`),
  KEY `payment_methods_restaurantId_status_idx` (`restaurantId`,`status`),
  CONSTRAINT `payment_methods_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES ('cmurg9aw20008w5ccgo6dvdw5','cmurg7udf0002w5cc3s1x033n','WOMPI','CARD','ACTIVE','384876',NULL,'4242','2026-10-02 21:02:54.818','2026-10-02 21:02:54.818'),('cmurjlzz70008w5oo8by0u8ka','cmurjlfvu0002w5oo56f1jvau','WOMPI','CARD','ACTIVE','384960',NULL,'4242','2026-10-02 22:36:46.050','2026-10-02 22:36:46.050'),('cmurjuq90000jw5ooat7n4hp6','cmurju4s5000dw5ooagv1r2lr','WOMPI','CARD','ACTIVE','384962',NULL,'4242','2026-10-02 22:43:33.347','2026-10-02 22:43:33.347'),('cmurk83ee0008w5toa3r8sz48','cmurk7d3y0002w5to5fddmo57','WOMPI','CARD','ACTIVE','384964',NULL,'4242','2026-10-02 22:53:56.917','2026-10-02 22:53:56.917'),('cmuspgewt000vw5hy39tun2ek','cmuspex75000nw5hy0w5xvaxt','WOMPI','CARD','ACTIVE','385258',NULL,'4242','2026-10-03 18:08:09.341','2026-10-03 18:08:09.341'),('cmuspzik4000aw58ee4m84ddi','cmuspyo970002w58elzoj8tg3','WOMPI','CARD','ACTIVE','385259',NULL,'4242','2026-10-03 18:23:00.531','2026-10-03 18:23:00.531'),('cmuszjror000ew5kz36310paw','cmusziwma0006w5kznbvme8e0','WOMPI','CARD','ACTIVE','385320',NULL,'4242','2026-10-03 22:50:42.024','2026-10-03 22:50:42.024');
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subscriptionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `paymentMethodId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` enum('WOMPI') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WOMPI',
  `providerTransactionId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COP',
  `status` enum('PENDING','APPROVED','DECLINED','VOIDED','ERROR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paidAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `amount` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_reference_key` (`reference`),
  UNIQUE KEY `payments_providerTransactionId_key` (`providerTransactionId`),
  KEY `payments_subscriptionId_status_idx` (`subscriptionId`,`status`),
  KEY `payments_status_idx` (`status`),
  KEY `payments_paymentMethodId_fkey` (`paymentMethodId`),
  CONSTRAINT `payments_paymentMethodId_fkey` FOREIGN KEY (`paymentMethodId`) REFERENCES `payment_methods` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `payments_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES ('cmurg9awt000aw5ccu0zpyulc','cmurg7udu0006w5cco1n1vuky','cmurg9aw20008w5ccgo6dvdw5','WOMPI','11992233-1790974975-38468','PROMO-cmurg7udu0006w5cco1n1vuky-1790974974842','COP','PENDING',NULL,'2026-10-02 21:02:54.844','2026-10-02 21:02:56.148',39000),('cmurjm00l000aw5oo4xs91uix','cmurjlfw60006w5oozdlct5yg','cmurjlzz70008w5oo8by0u8ka','WOMPI','11992233-1790980606-70963','PROMO-cmurjlfw60006w5oozdlct5yg-1790980606100','COP','APPROVED','2026-10-02 22:36:49.502','2026-10-02 22:36:46.102','2026-10-02 22:36:49.504',39000),('cmurjuq9y000lw5oolatj8c07','cmurju4sf000hw5oocats1zsl','cmurjuq90000jw5ooat7n4hp6','WOMPI','11992233-1790981013-31311','PROMO-cmurju4sf000hw5oocats1zsl-1790981013380','COP','APPROVED','2026-10-02 22:43:35.047','2026-10-02 22:43:33.382','2026-10-02 22:43:35.048',89000),('cmurk83ik000aw5to2t684sv2','cmurk7d4b0006w5tomick00l7','cmurk83ee0008w5toa3r8sz48','WOMPI','11992233-1790981637-18129','PROMO-cmurk7d4b0006w5tomick00l7-1790981637067','COP','APPROVED','2026-10-02 22:53:59.688','2026-10-02 22:53:57.068','2026-10-02 22:53:59.689',89000),('cmuspgey3000xw5hylq2tmfay','cmuspex7n000rw5hy2jezbonk','cmuspgewt000vw5hy39tun2ek','WOMPI','11992233-1791050889-45382','PROMO-cmuspex7n000rw5hy2jezbonk-1791050889384','COP','APPROVED','2026-10-03 18:08:11.331','2026-10-03 18:08:09.388','2026-10-03 18:08:11.332',89000),('cmuspzil3000cw58e5r5lhyss','cmuspyo9l0006w58eq8ae7ygg','cmuspzik4000aw58ee4m84ddi','WOMPI','11992233-1791051781-92341','PROMO-cmuspyo9l0006w58eq8ae7ygg-1791051780565','COP','APPROVED','2026-10-03 18:23:02.628','2026-10-03 18:23:00.567','2026-10-03 18:23:02.629',89000),('cmuszjrq3000gw5kzlz1ku8tj','cmusziwnk000aw5kz8n6uaz39','cmuszjror000ew5kz36310paw','WOMPI','11992233-1791067842-69618','PROMO-cmusziwnk000aw5kz8n6uaz39-1791067842072','COP','APPROVED','2026-10-03 22:50:44.656','2026-10-03 22:50:42.075','2026-10-03 22:50:44.657',39000);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_code_key` (`code`),
  KEY `permissions_module_isActive_idx` (`module`,`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES ('cmv78eada000sw5nhnwirfwsn','dashboard.view','Ver dashboard','Consultar el panel principal.','dashboard',1,'2026-10-13 22:07:09.311','2026-10-13 22:07:09.311'),('cmv78eadh000tw5nh5dfnql99','promotions.view','Ver promociones','Consultar promociones.','promotions',1,'2026-10-13 22:07:09.318','2026-10-13 22:07:09.318'),('cmv78eadj000uw5nhl372rj6m','promotions.create','Crear promociones','Crear promociones.','promotions',1,'2026-10-13 22:07:09.320','2026-10-13 22:07:09.320'),('cmv78eadl000vw5nhxge9fty1','promotions.update','Editar promociones','Modificar promociones.','promotions',1,'2026-10-13 22:07:09.322','2026-10-13 22:07:09.322'),('cmv78eadn000ww5nh4qvbaxbw','promotions.delete','Eliminar promociones','Eliminar promociones.','promotions',1,'2026-10-13 22:07:09.323','2026-10-13 22:07:09.323'),('cmv78eado000xw5nhtnlgf6q4','redemptions.view','Ver canjes','Consultar los canjes registrados.','redemptions',1,'2026-10-13 22:07:09.325','2026-10-13 22:07:09.325'),('cmv78eadq000yw5nh5kb1qepk','redemptions.validate','Validar canjes','Validar el canje de promociones.','redemptions',1,'2026-10-13 22:07:09.327','2026-10-13 22:07:09.327'),('cmv78eadr000zw5nh3r7ditov','customers.view','Ver clientes','Consultar clientes.','customers',1,'2026-10-13 22:07:09.328','2026-10-13 22:07:09.328'),('cmv78eadt0010w5nhkssu9kxw','customers.export','Exportar clientes','Exportar información de clientes.','customers',1,'2026-10-13 22:07:09.329','2026-10-13 22:07:09.329'),('cmv78eadu0011w5nhe1hmijgf','analytics.view','Ver analíticas','Consultar estadísticas.','analytics',1,'2026-10-13 22:07:09.331','2026-10-13 22:07:09.331'),('cmv78eadw0012w5nh5m8syma1','team.view','Ver equipo','Consultar miembros del equipo.','team',1,'2026-10-13 22:07:09.332','2026-10-13 22:07:09.332'),('cmv78eadx0013w5nhnpff82rk','team.manage','Administrar equipo','Administrar miembros del equipo.','team',1,'2026-10-13 22:07:09.334','2026-10-13 22:07:09.334'),('cmv78eady0014w5nhr6z0j80k','roles.manage','Administrar roles','Gestionar roles y sus permisos.','roles',1,'2026-10-13 22:07:09.335','2026-10-13 22:07:09.335'),('cmv78eae30015w5nhpwdb8tza','settings.view','Ver configuración','Consultar configuración del restaurante.','settings',1,'2026-10-13 22:07:09.339','2026-10-13 22:07:09.339'),('cmv78eae40016w5nhld6zj2f4','settings.manage','Administrar configuración','Modificar configuración del restaurante.','settings',1,'2026-10-13 22:07:09.341','2026-10-13 22:07:09.341');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plan_features`
--

DROP TABLE IF EXISTS `plan_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plan_features` (
  `planId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `featureId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`planId`,`featureId`),
  KEY `plan_features_featureId_fkey` (`featureId`),
  CONSTRAINT `plan_features_featureId_fkey` FOREIGN KEY (`featureId`) REFERENCES `features` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `plan_features_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plan_features`
--

LOCK TABLES `plan_features` WRITE;
/*!40000 ALTER TABLE `plan_features` DISABLE KEYS */;
INSERT INTO `plan_features` VALUES ('cmun4e5n4000pw5uyw2v2a6bo','cmun4e5m9000dw5uyuz98u5al'),('cmun4e5n7000qw5uy5vk14uss','cmun4e5m9000dw5uyuz98u5al'),('cmun4e5na000rw5uy2l3ljzsb','cmun4e5m9000dw5uyuz98u5al'),('cmun4e5n4000pw5uyw2v2a6bo','cmun4e5ml000ew5uy412zd19u'),('cmun4e5n7000qw5uy5vk14uss','cmun4e5ml000ew5uy412zd19u'),('cmun4e5na000rw5uy2l3ljzsb','cmun4e5ml000ew5uy412zd19u'),('cmun4e5n4000pw5uyw2v2a6bo','cmun4e5mn000fw5uyy4x6tsrd'),('cmun4e5n7000qw5uy5vk14uss','cmun4e5mn000fw5uyy4x6tsrd'),('cmun4e5na000rw5uy2l3ljzsb','cmun4e5mn000fw5uyy4x6tsrd'),('cmun4e5n4000pw5uyw2v2a6bo','cmun4e5mq000gw5uyn4dn57e6'),('cmun4e5n7000qw5uy5vk14uss','cmun4e5mq000gw5uyn4dn57e6'),('cmun4e5na000rw5uy2l3ljzsb','cmun4e5mq000gw5uyn4dn57e6'),('cmun4e5n7000qw5uy5vk14uss','cmun4e5mr000hw5uyhgxl2dem'),('cmun4e5na000rw5uy2l3ljzsb','cmun4e5mr000hw5uyhgxl2dem'),('cmun4e5n7000qw5uy5vk14uss','cmun4e5mt000iw5uyvqd8pdmd'),('cmun4e5na000rw5uy2l3ljzsb','cmun4e5mt000iw5uyvqd8pdmd'),('cmun4e5n7000qw5uy5vk14uss','cmun4e5mv000jw5uybgay38jy'),('cmun4e5na000rw5uy2l3ljzsb','cmun4e5mv000jw5uybgay38jy'),('cmun4e5n7000qw5uy5vk14uss','cmun4e5mw000kw5uybydr2hbj'),('cmun4e5na000rw5uy2l3ljzsb','cmun4e5mw000kw5uybydr2hbj'),('cmun4e5na000rw5uy2l3ljzsb','cmun4e5my000lw5uywwc1nyow'),('cmun4e5na000rw5uy2l3ljzsb','cmun4e5mz000mw5uyr9oh7xzw'),('cmun4e5na000rw5uy2l3ljzsb','cmun4e5n0000nw5uyyg6nuka7'),('cmun4e5na000rw5uy2l3ljzsb','cmun4e5n2000ow5uyu884n2gg');
/*!40000 ALTER TABLE `plan_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plans` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COP',
  `billingInterval` enum('MONTH','YEAR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MONTH',
  `trialDays` int NOT NULL DEFAULT '0',
  `maxUsers` int DEFAULT NULL,
  `maxActivePromotions` int DEFAULT NULL,
  `maxRestaurants` int DEFAULT NULL,
  `requiresPayment` tinyint(1) NOT NULL DEFAULT '0',
  `isFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `sortOrder` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `priceAmount` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plans_code_key` (`code`),
  KEY `plans_isActive_sortOrder_idx` (`isActive`,`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plans`
--

LOCK TABLES `plans` WRITE;
/*!40000 ALTER TABLE `plans` DISABLE KEYS */;
INSERT INTO `plans` VALUES ('cmun4e5n4000pw5uyw2v2a6bo','starter','Starter','Para restaurantes que están comenzando.','COP','MONTH',0,1,3,1,0,0,1,1,'2026-09-29 20:19:41.201','2026-10-13 22:07:09.247',0),('cmun4e5n7000qw5uy5vk14uss','pro','Pro','Para restaurantes que quieren crecer.','COP','MONTH',14,3,5,1,1,1,1,2,'2026-09-29 20:19:41.204','2026-10-13 22:07:09.279',39000),('cmun4e5na000rw5uy2l3ljzsb','business','Business','Para equipos y operaciones más grandes.','COP','MONTH',0,10,100,100,1,0,1,3,'2026-09-29 20:19:41.206','2026-10-13 22:07:09.282',89000);
/*!40000 ALTER TABLE `plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_ranges`
--

DROP TABLE IF EXISTS `price_ranges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_ranges` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `price_ranges_code_key` (`code`),
  KEY `price_ranges_isActive_sortOrder_idx` (`isActive`,`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_ranges`
--

LOCK TABLES `price_ranges` WRITE;
/*!40000 ALTER TABLE `price_ranges` DISABLE KEYS */;
INSERT INTO `price_ranges` VALUES ('cmun4e5ls0009w5uytj7c4qvq','economic','$','Económico',1,1),('cmun4e5lv000aw5uy6efu4pfn','moderate','$$','Moderado',2,1),('cmun4e5lw000bw5uygguy641h','premium','$$$','Premium',3,1),('cmun4e5lz000cw5uybeqfnfis','fine-dining','$$$$','Alta cocina',4,1);
/*!40000 ALTER TABLE `price_ranges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `revokedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_tokens_tokenHash_key` (`tokenHash`),
  KEY `refresh_tokens_userId_idx` (`userId`),
  KEY `refresh_tokens_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES ('cmurscwu20008w5hykyksb745','cmurscwrx0000w5hy145pl3pi','cd3659f3dcd8e3534fac3bdf35301f5d3d5dc09dac73307daa87d8cd8ac02f53','2026-10-10 02:41:38.617',NULL,'2026-10-03 02:41:38.618'),('cmursd5vr000aw5hy85y29li9','cmurscwrx0000w5hy145pl3pi','d787c03be2257e65b785b11673fb6064a19b312e8d1aa19ab09e2496f0a6b077','2026-10-10 02:41:50.340',NULL,'2026-10-03 02:41:50.343'),('cmurska41000cw5hy7br3n5s6','cmurscwrx0000w5hy145pl3pi','ad195caa0d54c1088e68338ceee453f85610a74443ca1a1a080604724bbb6f46','2026-10-10 02:47:22.416',NULL,'2026-10-03 02:47:22.417'),('cmusox7p0000ew5hyuk9guo1x','cmurscwrx0000w5hy145pl3pi','73fa32effb850dc5164399e2da8a58b65f3ba576dbcb96155624f50a89d5aaf5','2026-10-10 17:53:13.520',NULL,'2026-10-03 17:53:13.524'),('cmusoxl94000gw5hymx41pfnc','cmurscwrx0000w5hy145pl3pi','61fad02b495280d7c217a01ee59a0abed7b367f09ed866562928b03334f559a0','2026-10-10 17:53:31.093','2026-10-03 17:53:38.221','2026-10-03 17:53:31.096'),('cmusoywc4000iw5hy3q6ak8hs','cmurscwrx0000w5hy145pl3pi','6e8c2b6d45f6b406b05ea76df0fb56a4810a2df313f3304b4cb4be5eb1693a49','2026-10-10 17:54:32.113',NULL,'2026-10-03 17:54:32.116'),('cmuspa0p5000kw5hy7x9skvu1','cmurscwrx0000w5hy145pl3pi','f8777911db8b51c0ef90cb2068d870d57088701d29d7c8aa4814fcbf0c90b8ab','2026-10-10 18:03:10.982',NULL,'2026-10-03 18:03:10.983'),('cmuspex8d000tw5hyz53auwvl','cmuspex6a000lw5hyg8i5ca4m','4e26308e5a9cab7600109f4a659bbac414fcb47908b19173c9607e13213f5e10','2026-10-10 18:06:59.772',NULL,'2026-10-03 18:06:59.773'),('cmuspyoae0008w58eccvjdh9g','cmuspyo8b0000w58etpmbcs7j','4bb954a98bd4c6db9df65b61164348c6c887a642ae71f7ee73961c196c87c102','2026-10-10 18:22:21.301',NULL,'2026-10-03 18:22:21.302'),('cmusr52jj0001w5kz9xedesn5','cmurscwrx0000w5hy145pl3pi','972843ad2884b9f76ed29067872b2a722deda1603b7ca6f104f1ec5d73521f46','2026-10-10 18:55:19.326',NULL,'2026-10-03 18:55:19.327'),('cmusr7qzu0003w5kz448vmk7w','cmurscwrx0000w5hy145pl3pi','2dd5565be1475a4d240572250f067e8d2f5987147bce39179d1a922f4e78b225','2026-10-10 18:57:24.329',NULL,'2026-10-03 18:57:24.330'),('cmusziwor000cw5kztbbkc4pg','cmusziwkm0004w5kzpq2rvbjv','e5c1da2d576768230565d9c37890cdb753b2db949c00261d7b2ea85d7c85c0c8','2026-10-10 22:50:01.850','2026-10-04 20:32:32.711','2026-10-03 22:50:01.851'),('cmuua1yb5000iw5kzeisnrseh','cmusziwkm0004w5kzpq2rvbjv','e1b361da0b13ca01bb52e778a1d26e86c15681eaf0f9dee91a3b16ab9acc10ac','2026-10-11 20:32:32.752',NULL,'2026-10-04 20:32:32.753'),('cmv774b3w0001w5n3j5c0jfa3','cmurscwrx0000w5hy145pl3pi','6bf1c00afba8b16e54f87d5be6b3446f7cea3071a279f6035570a51d3be529cf','2026-10-20 21:31:24.090',NULL,'2026-10-13 21:31:24.092'),('cmv77s8d90001w5odda3vp444','cmurscwrx0000w5hy145pl3pi','f40cf3427c114b5d428f3ff9d2b2c843e89c567a8adc159bc1f9a2392a59d7e8','2026-10-20 21:50:00.282',NULL,'2026-10-13 21:50:00.285'),('cmv78eyki0001w5sn41p0387b','cmurscwrx0000w5hy145pl3pi','3295d26d6294017b1649469fad00c8aec46e68a34991617aea81e46247d40d5d','2026-10-20 22:07:40.673',NULL,'2026-10-13 22:07:40.674');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_members`
--

DROP TABLE IF EXISTS `restaurant_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_members` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `restaurantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('OWNER','ADMIN','MANAGER','STAFF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STAFF',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `roleId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `restaurant_members_userId_restaurantId_key` (`userId`,`restaurantId`),
  KEY `restaurant_members_restaurantId_role_idx` (`restaurantId`,`role`),
  KEY `restaurant_members_roleId_idx` (`roleId`),
  CONSTRAINT `restaurant_members_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `restaurant_members_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `restaurant_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_members`
--

LOCK TABLES `restaurant_members` WRITE;
/*!40000 ALTER TABLE `restaurant_members` DISABLE KEYS */;
INSERT INTO `restaurant_members` VALUES ('cmun5xm4h0004w51trgftjuj9','cmun5xm3m0000w51t4owtjbm1','cmun5xm470002w51tvvzje8ha','OWNER','2026-09-29 21:02:48.641','2026-09-29 21:02:48.641','system_role_owner'),('cmupzghvj0004w5dtu9b4gy08','cmupzghti0000w5dta79abaxq','cmupzghux0002w5dt65yh7eqj','OWNER','2026-10-01 20:24:50.815','2026-10-01 20:24:50.815','system_role_owner'),('cmupzxkc1000bw5dtz8a6547g','cmupzxkbf0007w5dtct4rjhy8','cmupzxkbw0009w5dt3nnpwipe','OWNER','2026-10-01 20:38:07.154','2026-10-01 20:38:07.154','system_role_owner'),('cmuq7atwt000iw5dtffdcem58','cmuq7atqp000ew5dtxuc1wg2t','cmuq7atvg000gw5dtsgcx77be','OWNER','2026-10-02 00:04:23.403','2026-10-02 00:04:23.403','system_role_owner'),('cmuq829fs0004w51wrzjseg7b','cmuq829ef0000w51wtokxx4qu','cmuq829fb0002w51wdxiq1oql','OWNER','2026-10-02 00:25:43.239','2026-10-02 00:25:43.239','system_role_owner'),('cmuqacpcl0004w5sctdyjgji4','cmuqacpbq0000w5sclu1zjslj','cmuqacpce0002w5sc3lpla696','OWNER','2026-10-02 01:29:49.653','2026-10-02 01:29:49.653','system_role_owner'),('cmuqatq180004w5whwpbsgmyd','cmuqatq010000w5whqmclc28e','cmuqatq0v0002w5whhvboaxmo','OWNER','2026-10-02 01:43:03.693','2026-10-02 01:43:03.693','system_role_owner'),('cmurf4n3p000bw5whdw64edve','cmurf4mz80007w5wh8153vb0k','cmurf4n2j0009w5whzireb8p9','OWNER','2026-10-02 20:31:17.748','2026-10-02 20:31:17.748','system_role_owner'),('cmurfco910004w5ahwt234jlx','cmurfco7y0000w5ah3nz8f51y','cmurfco8q0002w5ahdg45qvur','OWNER','2026-10-02 20:37:32.485','2026-10-02 20:37:32.485','system_role_owner'),('cmurfkii40004w5dd1pjmygcj','cmurfkih20000w5ddm0385c08','cmurfkihr0002w5dd5vg0chdi','OWNER','2026-10-02 20:43:38.284','2026-10-02 20:43:38.284','system_role_owner'),('cmurg7udo0004w5cckohmk21v','cmurg7uch0000w5ccidgsvep4','cmurg7udf0002w5cc3s1x033n','OWNER','2026-10-02 21:01:46.765','2026-10-02 21:01:46.765','system_role_owner'),('cmuri822g0004w5fvr9qsc180','cmuri821f0000w5fveonar2f1','cmuri82270002w5fvnl5e0i4w','OWNER','2026-10-02 21:57:55.961','2026-10-02 21:57:55.961','system_role_owner'),('cmurichyl000bw5fvpcy2bg37','cmurichxl0007w5fv4ogx4kwj','cmurichyc0009w5fv2f1i55ed','OWNER','2026-10-02 22:01:23.181','2026-10-02 22:01:23.181','system_role_owner'),('cmuriej1g000iw5fv26ukkh4p','cmuriej0m000ew5fvk4bqf8jc','cmuriej1a000gw5fv1r16xoqc','OWNER','2026-10-02 22:02:57.892','2026-10-02 22:02:57.892','system_role_owner'),('cmuriq8ot000pw5fvhham6xzg','cmuriq8o2000lw5fv27iao7e2','cmuriq8op000nw5fvgjw88uz3','OWNER','2026-10-02 22:12:04.349','2026-10-02 22:12:04.349','system_role_owner'),('cmuriu445000ww5fvlvnr1qc7','cmuriu437000sw5fvreizi6i8','cmuriu43w000uw5fvwj30e5ki','OWNER','2026-10-02 22:15:05.045','2026-10-02 22:15:05.045','system_role_owner'),('cmuriyjzq0013w5fv7craydee','cmuriyjyp000zw5fvexrvnwah','cmuriyjzc0011w5fvgzosh9sd','OWNER','2026-10-02 22:18:32.246','2026-10-02 22:18:32.246','system_role_owner'),('cmurj4l39001aw5fvztt8353r','cmurj4l2m0016w5fv079v76fr','cmurj4l320018w5fv7i8ktqgp','OWNER','2026-10-02 22:23:13.606','2026-10-02 22:23:13.606','system_role_owner'),('cmurja3sa001hw5fvtibibswl','cmurja3r7001dw5fv6xuuafuc','cmurja3s1001fw5fvmdh0qdse','OWNER','2026-10-02 22:27:31.114','2026-10-02 22:27:31.114','system_role_owner'),('cmurjd0iz001ow5fvjhlzhghr','cmurjd0i9001kw5fv0q61seet','cmurjd0ir001mw5fvws4guqc7','OWNER','2026-10-02 22:29:46.860','2026-10-02 22:29:46.860','system_role_owner'),('cmurjiqri001vw5fvpo6ja5i8','cmurjiqq7001rw5fvrezvpi3g','cmurjiqr2001tw5fvcgfj1bht','OWNER','2026-10-02 22:34:14.142','2026-10-02 22:34:14.142','system_role_owner'),('cmurjlfw20004w5oo9181e7ru','cmurjlfvc0000w5oolprwtqnh','cmurjlfvu0002w5oo56f1jvau','OWNER','2026-10-02 22:36:20.019','2026-10-02 22:36:20.019','system_role_owner'),('cmurju4sb000fw5oo42lktx2f','cmurju4ra000bw5oo0n9vfnba','cmurju4s5000dw5ooagv1r2lr','OWNER','2026-10-02 22:43:05.531','2026-10-02 22:43:05.531','system_role_owner'),('cmurk7d470004w5tocrbc88zq','cmurk7d330000w5todc7ho5ow','cmurk7d3y0002w5to5fddmo57','OWNER','2026-10-02 22:53:22.856','2026-10-02 22:53:22.856','system_role_owner'),('cmurkfosu000fw5tojsvp3kk9','cmurkforf000bw5to4b5twv3q','cmurkfosg000dw5totb5z2pa3','OWNER','2026-10-02 22:59:51.246','2026-10-02 22:59:51.246','system_role_owner'),('cmurscwsw0004w5hyo3xnw7hy','cmurscwrx0000w5hy145pl3pi','cmurscwso0002w5hyemz7my4u','OWNER','2026-10-03 02:41:38.577','2026-10-03 02:41:38.577','system_role_owner'),('cmuspex7f000pw5hypegjn8ws','cmuspex6a000lw5hyg8i5ca4m','cmuspex75000nw5hy0w5xvaxt','OWNER','2026-10-03 18:06:59.740','2026-10-03 18:06:59.740','system_role_owner'),('cmuspyo9h0004w58eo3s1lwb9','cmuspyo8b0000w58etpmbcs7j','cmuspyo970002w58elzoj8tg3','OWNER','2026-10-03 18:22:21.270','2026-10-03 18:22:21.270','system_role_owner'),('cmusziwmu0008w5kzm5dx7tu2','cmusziwkm0004w5kzpq2rvbjv','cmusziwma0006w5kznbvme8e0','OWNER','2026-10-03 22:50:01.782','2026-10-03 22:50:01.782','system_role_owner');
/*!40000 ALTER TABLE `restaurant_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurants`
--

DROP TABLE IF EXISTS `restaurants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurants` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `cuisineId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priceRangeId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `restaurants_city_idx` (`city`),
  KEY `restaurants_department_idx` (`department`),
  KEY `restaurants_status_idx` (`status`),
  KEY `restaurants_cuisineId_idx` (`cuisineId`),
  KEY `restaurants_priceRangeId_idx` (`priceRangeId`),
  CONSTRAINT `restaurants_cuisineId_fkey` FOREIGN KEY (`cuisineId`) REFERENCES `cuisines` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `restaurants_priceRangeId_fkey` FOREIGN KEY (`priceRangeId`) REFERENCES `price_ranges` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurants`
--

LOCK TABLES `restaurants` WRITE;
/*!40000 ALTER TABLE `restaurants` DISABLE KEYS */;
INSERT INTO `restaurants` VALUES ('cmun5xm470002w51tvvzje8ha','Restaurante Demo','Restaurante de prueba para validar el registro de PromoApp.','3001234567','Calle 1 # 2-3','Barranquilla','Atlántico',10.9878000,-74.7889000,'https://example.com','@restaurantedemo','https://facebook.com/restaurantedemo','ACTIVE','cmun4e5js0000w5uyzv8gdb8r','cmun4e5lv000aw5uy6efu4pfn','2026-09-29 21:02:48.632','2026-09-29 21:02:48.632'),('cmupzghux0002w5dt65yh7eqj','brochetas','comida rapida para la familia',NULL,'carrera 10c # 2-62','Puerto Colombia','Atlántico',10.9917104,-74.9542620,NULL,NULL,NULL,'ACTIVE','cmun4e5lm0006w5uyk3v7qp1o','cmun4e5ls0009w5uytj7c4qvq','2026-10-01 20:24:50.793','2026-10-01 20:24:50.793'),('cmupzxkbw0009w5dt3nnpwipe','cacacacaca','acscadsdasdasdafsgfdgdf',NULL,'carrera 10c # 2-62','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5lh0003w5uydni4mn6a','cmun4e5lv000aw5uy6efu4pfn','2026-10-01 20:38:07.148','2026-10-01 20:38:07.148'),('cmuq7atvg000gw5dtsgcx77be','brochetas','comida rapida para la familia',NULL,'carrera 10c # 2-62','Puerto Colombia','Atlántico',10.9917104,-74.9542620,NULL,NULL,NULL,'ACTIVE','cmun4e5lm0006w5uyk3v7qp1o','cmun4e5lv000aw5uy6efu4pfn','2026-10-02 00:04:23.350','2026-10-02 00:04:23.350'),('cmuq829fb0002w51wdxiq1oql','uno por ahi no se','comida buenna y barata compae',NULL,'carrera 10c # 2-62','Puerto Colombia','Atlántico',10.9921824,-74.9549697,NULL,NULL,NULL,'ACTIVE','cmun4e5le0002w5uyo3rxby41','cmun4e5lv000aw5uy6efu4pfn','2026-10-02 00:25:43.223','2026-10-02 00:25:43.223'),('cmuqacpce0002w5sc3lpla696','la cocina oculta','comida rapida cocina oculta',NULL,'carrera 10c # 2-62','Puerto Colombia','Atlántico',10.9917104,-74.9542620,NULL,NULL,NULL,'ACTIVE','cmun4e5lm0006w5uyk3v7qp1o','cmun4e5lw000bw5uygguy641h','2026-10-02 01:29:49.647','2026-10-02 01:29:49.647'),('cmuqatq0v0002w5whhvboaxmo','sadfggffds','AERTYTJHGRFEDWWTREYHGFDawerfda',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5le0002w5uyo3rxby41','cmun4e5lw000bw5uygguy641h','2026-10-02 01:43:03.679','2026-10-02 01:43:03.679'),('cmurf4n2j0009w5whzireb8p9','brochetas inc','comida rapida para la familia',NULL,'carrera 10c # 2-62','Puerto Colombia','Atlántico',10.9917104,-74.9542620,NULL,NULL,NULL,'ACTIVE','cmun4e5lm0006w5uyk3v7qp1o','cmun4e5lv000aw5uy6efu4pfn','2026-10-02 20:31:17.707','2026-10-02 20:31:17.707'),('cmurfco8q0002w5ahdg45qvur','brochetas dog','comida para la familia',NULL,'carrera 10c # 2-62','Puerto Colombia','Atlántico',10.9917104,-74.9542620,NULL,NULL,NULL,'ACTIVE','cmun4e5lm0006w5uyk3v7qp1o','cmun4e5lv000aw5uy6efu4pfn','2026-10-02 20:37:32.474','2026-10-02 20:37:32.474'),('cmurfkihr0002w5dd5vg0chdi','qweqweqwe','asdasdasdasda asd adqwd qsa as',NULL,'carrera 10c # 2-62','Puerto Colombia','Atlántico',10.9917104,-74.9542620,NULL,NULL,NULL,'ACTIVE','cmun4e5lm0006w5uyk3v7qp1o','cmun4e5lw000bw5uygguy641h','2026-10-02 20:43:38.271','2026-10-02 20:43:38.271'),('cmurg7udf0002w5cc3s1x033n','mateo','wetewrtvwrt rwtg retherty ert',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5le0002w5uyo3rxby41','cmun4e5lz000cw5uybeqfnfis','2026-10-02 21:01:46.755','2026-10-02 21:01:46.755'),('cmuri82270002w5fvnl5e0i4w','qweqwe','qweqweqweqweq qw eqwe qwe qwe qwe',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5le0002w5uyo3rxby41','cmun4e5lw000bw5uygguy641h','2026-10-02 21:57:55.951','2026-10-02 21:57:55.951'),('cmurichyc0009w5fv2f1i55ed','asdasd','asdasdasd ad asd asd a a',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5le0002w5uyo3rxby41','cmun4e5lv000aw5uy6efu4pfn','2026-10-02 22:01:23.172','2026-10-02 22:01:23.172'),('cmuriej1a000gw5fv1r16xoqc','asdasadas','asdasdfs qwd sdf sdfsd',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5le0002w5uyo3rxby41','cmun4e5lv000aw5uy6efu4pfn','2026-10-02 22:02:57.886','2026-10-02 22:02:57.886'),('cmuriq8op000nw5fvgjw88uz3','mateo','asd as ad asdasd ad asd ads',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5lh0003w5uydni4mn6a','cmun4e5lw000bw5uygguy641h','2026-10-02 22:12:04.345','2026-10-02 22:12:04.345'),('cmuriu43w000uw5fvwj30e5ki','sdfsdfsdf','dsfsdfsdfsdf sd sf sd f',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5lj0004w5uyfot8xi5y','cmun4e5ls0009w5uytj7c4qvq','2026-10-02 22:15:05.037','2026-10-02 22:15:05.037'),('cmuriyjzc0011w5fvgzosh9sd','mateo','aef sf sdfsdfsdfsfsdf',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5l60001w5uyoyvt5j4j','cmun4e5lv000aw5uy6efu4pfn','2026-10-02 22:18:32.233','2026-10-02 22:18:32.233'),('cmurj4l320018w5fv7i8ktqgp','mateo','asdas asd asd asd asd a',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5l60001w5uyoyvt5j4j','cmun4e5lw000bw5uygguy641h','2026-10-02 22:23:13.598','2026-10-02 22:23:13.598'),('cmurja3s1001fw5fvmdh0qdse','mateo','asdasdasd asd asd asad',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5le0002w5uyo3rxby41','cmun4e5lw000bw5uygguy641h','2026-10-02 22:27:31.105','2026-10-02 22:27:31.105'),('cmurjd0ir001mw5fvws4guqc7','asdasd','asdasdasdafsdfsdasd as',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5l60001w5uyoyvt5j4j','cmun4e5lw000bw5uygguy641h','2026-10-02 22:29:46.852','2026-10-02 22:29:46.852'),('cmurjiqr2001tw5fvcgfj1bht','mateo','qwdasd asa dsa dasd asd a',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5js0000w5uyzv8gdb8r','cmun4e5lz000cw5uybeqfnfis','2026-10-02 22:34:14.126','2026-10-02 22:34:14.126'),('cmurjlfvu0002w5oo56f1jvau','mateo','sd fsdf sdfsdfsdf sfsdf',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5lh0003w5uydni4mn6a','cmun4e5lv000aw5uy6efu4pfn','2026-10-02 22:36:20.011','2026-10-02 22:36:20.011'),('cmurju4s5000dw5ooagv1r2lr','Sr brochetas','asdasdasdasd a asd adsadsd',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5le0002w5uyo3rxby41','cmun4e5lw000bw5uygguy641h','2026-10-02 22:43:05.525','2026-10-02 22:43:05.525'),('cmurk7d3y0002w5to5fddmo57','Sr perro','sdgdfgdfgd dfdfg dfg dfg dfgfdgfdgf',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5lm0006w5uyk3v7qp1o','cmun4e5lv000aw5uy6efu4pfn','2026-10-02 22:53:22.846','2026-10-02 22:53:22.846'),('cmurkfosg000dw5totb5z2pa3','mateo','xcvxcvxcvxcvx asd asd as',NULL,'Calle 2','Puerto Colombia','Atlántico',10.9762691,-74.7465256,NULL,NULL,NULL,'ACTIVE','cmun4e5l60001w5uyoyvt5j4j','cmun4e5lz000cw5uybeqfnfis','2026-10-02 22:59:51.231','2026-10-02 22:59:51.231'),('cmurscwso0002w5hyemz7my4u','mateo','asd asd asd asd asdasdas',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5le0002w5uyo3rxby41','cmun4e5lv000aw5uy6efu4pfn','2026-10-03 02:41:38.568','2026-10-03 02:41:38.568'),('cmuspex75000nw5hy0w5xvaxt','Sr Brochetas','comida rapida para toda la familia',NULL,'carrera 10c # 2-62','Puerto Colombia','Atlántico',10.9917104,-74.9542620,NULL,NULL,NULL,'ACTIVE','cmun4e5lm0006w5uyk3v7qp1o','cmun4e5lv000aw5uy6efu4pfn','2026-10-03 18:06:59.729','2026-10-03 18:06:59.729'),('cmuspyo970002w58elzoj8tg3','asdada','asdasd as asda dsadasda dsadas',NULL,'Calle 2','Puerto Colombia','Atlántico',NULL,NULL,NULL,NULL,NULL,'ACTIVE','cmun4e5le0002w5uyo3rxby41','cmun4e5lv000aw5uy6efu4pfn','2026-10-03 18:22:21.260','2026-10-03 18:22:21.260'),('cmusziwma0006w5kznbvme8e0','la parrilla de mateo','comida rapida para toda la familia',NULL,'carrera 10c # 2-62','Puerto Colombia','Atlántico',10.9920354,-74.9548189,NULL,NULL,NULL,'ACTIVE','cmun4e5lm0006w5uyk3v7qp1o','cmun4e5lw000bw5uygguy641h','2026-10-03 22:50:01.761','2026-10-03 22:50:01.761');
/*!40000 ALTER TABLE `restaurants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `roleId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`roleId`,`permissionId`),
  KEY `role_permissions_permissionId_idx` (`permissionId`),
  CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES ('system_role_admin','cmv78eada000sw5nhnwirfwsn','2026-10-13 22:07:09.384'),('system_role_admin','cmv78eadh000tw5nh5dfnql99','2026-10-13 22:07:09.388'),('system_role_admin','cmv78eadj000uw5nhl372rj6m','2026-10-13 22:07:09.389'),('system_role_admin','cmv78eadl000vw5nhxge9fty1','2026-10-13 22:07:09.391'),('system_role_admin','cmv78eadn000ww5nh4qvbaxbw','2026-10-13 22:07:09.392'),('system_role_admin','cmv78eado000xw5nhtnlgf6q4','2026-10-13 22:07:09.394'),('system_role_admin','cmv78eadq000yw5nh5kb1qepk','2026-10-13 22:07:09.396'),('system_role_admin','cmv78eadr000zw5nh3r7ditov','2026-10-13 22:07:09.397'),('system_role_admin','cmv78eadt0010w5nhkssu9kxw','2026-10-13 22:07:09.399'),('system_role_admin','cmv78eadu0011w5nhe1hmijgf','2026-10-13 22:07:09.402'),('system_role_admin','cmv78eadw0012w5nh5m8syma1','2026-10-13 22:07:09.404'),('system_role_admin','cmv78eadx0013w5nhnpff82rk','2026-10-13 22:07:09.405'),('system_role_admin','cmv78eae30015w5nhpwdb8tza','2026-10-13 22:07:09.406'),('system_role_manager','cmv78eada000sw5nhnwirfwsn','2026-10-13 22:07:09.408'),('system_role_manager','cmv78eadh000tw5nh5dfnql99','2026-10-13 22:07:09.409'),('system_role_manager','cmv78eadj000uw5nhl372rj6m','2026-10-13 22:07:09.410'),('system_role_manager','cmv78eadl000vw5nhxge9fty1','2026-10-13 22:07:09.411'),('system_role_manager','cmv78eado000xw5nhtnlgf6q4','2026-10-13 22:07:09.413'),('system_role_manager','cmv78eadq000yw5nh5kb1qepk','2026-10-13 22:07:09.414'),('system_role_manager','cmv78eadr000zw5nh3r7ditov','2026-10-13 22:07:09.415'),('system_role_manager','cmv78eadu0011w5nhe1hmijgf','2026-10-13 22:07:09.417'),('system_role_manager','cmv78eadw0012w5nh5m8syma1','2026-10-13 22:07:09.418'),('system_role_owner','cmv78eada000sw5nhnwirfwsn','2026-10-13 22:07:09.347'),('system_role_owner','cmv78eadh000tw5nh5dfnql99','2026-10-13 22:07:09.353'),('system_role_owner','cmv78eadj000uw5nhl372rj6m','2026-10-13 22:07:09.356'),('system_role_owner','cmv78eadl000vw5nhxge9fty1','2026-10-13 22:07:09.357'),('system_role_owner','cmv78eadn000ww5nh4qvbaxbw','2026-10-13 22:07:09.358'),('system_role_owner','cmv78eado000xw5nhtnlgf6q4','2026-10-13 22:07:09.360'),('system_role_owner','cmv78eadq000yw5nh5kb1qepk','2026-10-13 22:07:09.362'),('system_role_owner','cmv78eadr000zw5nh3r7ditov','2026-10-13 22:07:09.369'),('system_role_owner','cmv78eadt0010w5nhkssu9kxw','2026-10-13 22:07:09.372'),('system_role_owner','cmv78eadu0011w5nhe1hmijgf','2026-10-13 22:07:09.374'),('system_role_owner','cmv78eadw0012w5nh5m8syma1','2026-10-13 22:07:09.376'),('system_role_owner','cmv78eadx0013w5nhnpff82rk','2026-10-13 22:07:09.378'),('system_role_owner','cmv78eady0014w5nhr6z0j80k','2026-10-13 22:07:09.379'),('system_role_owner','cmv78eae30015w5nhpwdb8tza','2026-10-13 22:07:09.381'),('system_role_owner','cmv78eae40016w5nhld6zj2f4','2026-10-13 22:07:09.382'),('system_role_staff','cmv78eada000sw5nhnwirfwsn','2026-10-13 22:07:09.419'),('system_role_staff','cmv78eadh000tw5nh5dfnql99','2026-10-13 22:07:09.421'),('system_role_staff','cmv78eado000xw5nhtnlgf6q4','2026-10-13 22:07:09.422'),('system_role_staff','cmv78eadq000yw5nh5kb1qepk','2026-10-13 22:07:09.423');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `restaurantId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isSystem` tinyint(1) NOT NULL DEFAULT '0',
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_restaurantId_code_key` (`restaurantId`,`code`),
  KEY `roles_restaurantId_isActive_idx` (`restaurantId`,`isActive`),
  CONSTRAINT `roles_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES ('system_role_admin','ADMIN','Administrador','Administrador del restaurante',NULL,1,0,1,'2026-10-13 15:52:38.780','2026-10-13 15:52:38.780'),('system_role_manager','MANAGER','Gerente','Gerente del restaurante',NULL,1,0,1,'2026-10-13 15:52:38.780','2026-10-13 15:52:38.780'),('system_role_owner','OWNER','Propietario','Propietario del restaurante',NULL,1,0,1,'2026-10-13 15:52:38.780','2026-10-13 15:52:38.780'),('system_role_staff','STAFF','Empleado','Empleado del restaurante',NULL,1,0,1,'2026-10-13 15:52:38.780','2026-10-13 15:52:38.780');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `restaurantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `planId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','TRIALING','ACTIVE','PAST_DUE','CANCELED','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TRIALING',
  `startsAt` datetime(3) NOT NULL,
  `trialEndsAt` datetime(3) DEFAULT NULL,
  `currentPeriodStart` datetime(3) DEFAULT NULL,
  `currentPeriodEnd` datetime(3) DEFAULT NULL,
  `canceledAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `subscriptions_restaurantId_status_idx` (`restaurantId`,`status`),
  KEY `subscriptions_planId_idx` (`planId`),
  CONSTRAINT `subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `subscriptions_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
INSERT INTO `subscriptions` VALUES ('cmun5xm4m0006w51t4ps8crnd','cmun5xm470002w51tvvzje8ha','cmun4e5n4000pw5uyw2v2a6bo','ACTIVE','2026-09-29 21:02:48.646',NULL,NULL,NULL,NULL,'2026-09-29 21:02:48.647','2026-09-29 21:02:48.647'),('cmupzghvr0006w5dtwq2zlfcc','cmupzghux0002w5dt65yh7eqj','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-01 20:24:50.822','2026-10-15 20:24:50.822',NULL,NULL,NULL,'2026-10-01 20:24:50.824','2026-10-01 20:24:50.824'),('cmupzxkc4000dw5dtu6d2xuwe','cmupzxkbw0009w5dt3nnpwipe','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-01 20:38:07.156','2026-10-15 20:38:07.156',NULL,NULL,NULL,'2026-10-01 20:38:07.157','2026-10-01 20:38:07.157'),('cmuq7aty0000kw5dtjsxy8r3o','cmuq7atvg000gw5dtsgcx77be','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 00:04:23.433','2026-10-16 00:04:23.433',NULL,NULL,NULL,'2026-10-02 00:04:23.448','2026-10-02 00:04:23.448'),('cmuq829g70006w51w7okejfan','cmuq829fb0002w51wdxiq1oql','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 00:25:43.253','2026-10-16 00:25:43.253',NULL,NULL,NULL,'2026-10-02 00:25:43.256','2026-10-02 00:25:43.256'),('cmuqacpcp0006w5scc4y9ec5u','cmuqacpce0002w5sc3lpla696','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 01:29:49.657','2026-10-16 01:29:49.657',NULL,NULL,NULL,'2026-10-02 01:29:49.657','2026-10-02 01:29:49.657'),('cmuqatq1d0006w5whrsepz2lz','cmuqatq0v0002w5whhvboaxmo','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 01:43:03.696','2026-10-16 01:43:03.696',NULL,NULL,NULL,'2026-10-02 01:43:03.697','2026-10-02 01:43:03.697'),('cmurf4n47000dw5whteoaew9h','cmurf4n2j0009w5whzireb8p9','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 20:31:17.766','2026-10-16 20:31:17.766',NULL,NULL,NULL,'2026-10-02 20:31:17.767','2026-10-02 20:31:17.767'),('cmurfco940006w5ahmkgg3w3d','cmurfco8q0002w5ahdg45qvur','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 20:37:32.488','2026-10-16 20:37:32.488',NULL,NULL,NULL,'2026-10-02 20:37:32.488','2026-10-02 20:37:32.488'),('cmurfkii90006w5dd1zttntqq','cmurfkihr0002w5dd5vg0chdi','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 20:43:38.289','2026-10-16 20:43:38.289',NULL,NULL,NULL,'2026-10-02 20:43:38.289','2026-10-02 20:43:38.289'),('cmurg7udu0006w5cco1n1vuky','cmurg7udf0002w5cc3s1x033n','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 21:01:46.769','2026-10-16 21:01:46.769',NULL,NULL,NULL,'2026-10-02 21:01:46.770','2026-10-02 21:01:46.770'),('cmuri822k0006w5fvfq1l3tlh','cmuri82270002w5fvnl5e0i4w','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 21:57:55.964','2026-10-16 21:57:55.964',NULL,NULL,NULL,'2026-10-02 21:57:55.964','2026-10-02 21:57:55.964'),('cmurichzk000dw5fvmb9bnivi','cmurichyc0009w5fv2f1i55ed','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 22:01:23.215','2026-10-16 22:01:23.215',NULL,NULL,NULL,'2026-10-02 22:01:23.216','2026-10-02 22:01:23.216'),('cmuriej1k000kw5fveb0hjduo','cmuriej1a000gw5fv1r16xoqc','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 22:02:57.894','2026-10-16 22:02:57.894',NULL,NULL,NULL,'2026-10-02 22:02:57.896','2026-10-02 22:02:57.896'),('cmuriq8ow000rw5fv1l7h5qhe','cmuriq8op000nw5fvgjw88uz3','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 22:12:04.351','2026-10-16 22:12:04.351',NULL,NULL,NULL,'2026-10-02 22:12:04.352','2026-10-02 22:12:04.352'),('cmuriu447000yw5fvuui3vdpk','cmuriu43w000uw5fvwj30e5ki','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 22:15:05.047','2026-10-16 22:15:05.047',NULL,NULL,NULL,'2026-10-02 22:15:05.048','2026-10-02 22:15:05.048'),('cmuriyjzv0015w5fvu2a11539','cmuriyjzc0011w5fvgzosh9sd','cmun4e5na000rw5uy2l3ljzsb','PENDING','2026-10-02 22:18:32.250',NULL,NULL,NULL,NULL,'2026-10-02 22:18:32.252','2026-10-02 22:18:32.252'),('cmurj4l3c001cw5fvflnzyco2','cmurj4l320018w5fv7i8ktqgp','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 22:23:13.608','2026-10-16 22:23:13.608',NULL,NULL,NULL,'2026-10-02 22:23:13.608','2026-10-02 22:23:13.608'),('cmurja3sh001jw5fvull4pwh4','cmurja3s1001fw5fvmdh0qdse','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 22:27:31.120','2026-10-16 22:27:31.120',NULL,NULL,NULL,'2026-10-02 22:27:31.122','2026-10-02 22:27:31.122'),('cmurjd0j7001qw5fvdms5ez3v','cmurjd0ir001mw5fvws4guqc7','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 22:29:46.866','2026-10-16 22:29:46.866',NULL,NULL,NULL,'2026-10-02 22:29:46.867','2026-10-02 22:29:46.867'),('cmurjiqrn001xw5fvpo69jr0l','cmurjiqr2001tw5fvcgfj1bht','cmun4e5n7000qw5uy5vk14uss','PENDING','2026-10-02 22:34:14.146','2026-10-16 22:34:14.146',NULL,NULL,NULL,'2026-10-02 22:34:14.147','2026-10-02 22:34:14.147'),('cmurjlfw60006w5oozdlct5yg','cmurjlfvu0002w5oo56f1jvau','cmun4e5n7000qw5uy5vk14uss','ACTIVE','2026-10-02 22:36:20.021','2026-10-16 22:36:20.021','2026-10-02 22:36:49.555',NULL,NULL,'2026-10-02 22:36:20.022','2026-10-02 22:36:49.558'),('cmurju4sf000hw5oocats1zsl','cmurju4s5000dw5ooagv1r2lr','cmun4e5na000rw5uy2l3ljzsb','ACTIVE','2026-10-02 22:43:05.534',NULL,'2026-10-02 22:43:35.156',NULL,NULL,'2026-10-02 22:43:05.535','2026-10-02 22:43:35.157'),('cmurk7d4b0006w5tomick00l7','cmurk7d3y0002w5to5fddmo57','cmun4e5na000rw5uy2l3ljzsb','ACTIVE','2026-10-02 22:53:22.859',NULL,'2026-10-02 22:53:59.695',NULL,NULL,'2026-10-02 22:53:22.860','2026-10-02 22:53:59.696'),('cmurkfot0000hw5totofxibzm','cmurkfosg000dw5totb5z2pa3','cmun4e5n4000pw5uyw2v2a6bo','ACTIVE','2026-10-02 22:59:51.251',NULL,NULL,NULL,NULL,'2026-10-02 22:59:51.252','2026-10-02 22:59:51.252'),('cmurscwt00006w5hyblb2k6dg','cmurscwso0002w5hyemz7my4u','cmun4e5n4000pw5uyw2v2a6bo','ACTIVE','2026-10-03 02:41:38.580',NULL,NULL,NULL,NULL,'2026-10-03 02:41:38.581','2026-10-03 02:41:38.581'),('cmuspex7n000rw5hy2jezbonk','cmuspex75000nw5hy0w5xvaxt','cmun4e5na000rw5uy2l3ljzsb','ACTIVE','2026-10-03 18:06:59.746',NULL,'2026-10-03 18:08:11.427',NULL,NULL,'2026-10-03 18:06:59.747','2026-10-03 18:08:11.428'),('cmuspyo9l0006w58eq8ae7ygg','cmuspyo970002w58elzoj8tg3','cmun4e5na000rw5uy2l3ljzsb','ACTIVE','2026-10-03 18:22:21.273',NULL,'2026-10-03 18:23:02.633',NULL,NULL,'2026-10-03 18:22:21.274','2026-10-03 18:23:02.634'),('cmusziwnk000aw5kz8n6uaz39','cmusziwma0006w5kznbvme8e0','cmun4e5n7000qw5uy5vk14uss','ACTIVE','2026-10-03 22:50:01.807','2026-10-17 22:50:01.807','2026-10-03 22:50:44.658',NULL,NULL,'2026-10-03 22:50:01.808','2026-10-03 22:50:44.659');
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `firstName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `termsAcceptedAt` datetime(3) DEFAULT NULL,
  `privacyAcceptedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('cmun5xm3m0000w51t4owtjbm1','mateo.test@promoapp.com','$argon2id$v=19$m=65536,p=4,t=3$2rPqp/uqQE009WdDpx+Njw$uJgaX3RE0lXT2Ztq0r9YXAmNUd91tBHsWpEc/z4XCFw','Mateo','ACTIVE','2026-09-29 21:02:48.609',NULL,'2026-09-29 21:02:48.610','2026-09-29 21:02:48.610'),('cmupzghti0000w5dta79abaxq','teosio97@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$J2kZyo4hJG9S9c6yz2Cu4g$SXXXEpZEec/OcwCgdHPd375G/3I05S+xTc5s9n2m3Og','mateo gomez osio','ACTIVE','2026-10-01 20:24:50.739',NULL,'2026-10-01 20:24:50.742','2026-10-01 20:24:50.742'),('cmupzxkbf0007w5dtct4rjhy8','mateo@example.com','$argon2id$v=19$m=65536,p=4,t=3$+MOd1cPDnNyna2MJB/X2bA$a+ABY3mG7B8w7+ua9GlaM5aIQ+eHV3Kqf2F9D7fSl/k','mateo gomez osio','ACTIVE','2026-10-01 20:38:07.130',NULL,'2026-10-01 20:38:07.131','2026-10-01 20:38:07.131'),('cmuq7atqp000ew5dtxuc1wg2t','juan@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$LZeHHByUr++HS4lg54Fg8Q$2F3rtWy5UqalCe8lXrsSk2+cSHKL36LlhhMrd6p0Dw4','mateo gomez osio','ACTIVE','2026-10-02 00:04:23.184',NULL,'2026-10-02 00:04:23.185','2026-10-02 00:04:23.185'),('cmuq829ef0000w51wtokxx4qu','tst1@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$gFDj37Vr6k72RA5yMHB2ag$59e+v6flDQvDoyPnYt55dVOA3UTqpfi/MPePlj38R4k','mateo gomez osio','ACTIVE','2026-10-02 00:25:43.190',NULL,'2026-10-02 00:25:43.191','2026-10-02 00:25:43.191'),('cmuqacpbq0000w5sclu1zjslj','mate@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$aq76v/AI0fdsN99u7CGCdQ$5+dfMmvaPabTUjDitpdlH6RxbGdfhucipGKZYryY4og','mateo gomez osio','ACTIVE','2026-10-02 01:29:49.621',NULL,'2026-10-02 01:29:49.622','2026-10-02 01:29:49.622'),('cmuqatq010000w5whqmclc28e','asd@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$xUX+bCC3qxIVhRI7q2nQPQ$IAeFuMEN3wPXFt76dXBc0Anp/KgbHTQxg2gyIQV+QNs','mateo gomez osio','ACTIVE','2026-10-02 01:43:03.648',NULL,'2026-10-02 01:43:03.648','2026-10-02 01:43:03.648'),('cmurf4mz80007w5wh8153vb0k','bro@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$2N3jkvF0Wue5y+qYDR9WfA$TK0AJ5mKObcj32QjRh0VhnPrmv/WJM0KBVdlmMOZN68','mateo gomez osio','ACTIVE','2026-10-02 20:31:17.585',NULL,'2026-10-02 20:31:17.587','2026-10-02 20:31:17.587'),('cmurfco7y0000w5ah3nz8f51y','br@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$ch/3rJNMiTGFB2m1UF1j9Q$ys9Z4vonWLsvuENUX3mf/Wg5AgYi/sz7zULvctJVEYQ','mateo gomez osio','ACTIVE','2026-10-02 20:37:32.446',NULL,'2026-10-02 20:37:32.447','2026-10-02 20:37:32.447'),('cmurfkih20000w5ddm0385c08','a@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$a7SNNPbSHBv843KKxd4vng$BUrPOjKkGE4j8oXsKWSEkLrjueLj05F8Jdo7mF1BwAE','mateo gomez osio','ACTIVE','2026-10-02 20:43:38.245',NULL,'2026-10-02 20:43:38.246','2026-10-02 20:43:38.246'),('cmurg7uch0000w5ccidgsvep4','g@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$qeaabZT54jG28P4A2RIx6Q$eTefEdlJqOI+6qYkw1RdUIyKtzRGUu29f1KP7rssp1U','mateo gomez osio','ACTIVE','2026-10-02 21:01:46.721',NULL,'2026-10-02 21:01:46.722','2026-10-02 21:01:46.722'),('cmuri821f0000w5fveonar2f1','aas@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$niWbxYrUpSqbHfmLfp97sw$5lC4fl2VczmIDtVr+Qlh2bRDHGu77Fm3gTc9rJrRGpA','mateo gomez osio','ACTIVE','2026-10-02 21:57:55.923',NULL,'2026-10-02 21:57:55.924','2026-10-02 21:57:55.924'),('cmurichxl0007w5fv4ogx4kwj','sadfff@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$kEAmr9JKoTGZfV+DYgB4eQ$ma9ztNA+0NV+DAdpd1ua558Y+ydmld4e6+rrFTeBhC4','sa','ACTIVE','2026-10-02 22:01:23.144',NULL,'2026-10-02 22:01:23.145','2026-10-02 22:01:23.145'),('cmuriej0m000ew5fvk4bqf8jc','sdfsdf@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$51arDgSlf3IjgaCJ/sBbgg$EkAiKQZ68qFkqUi1KxR9YMwi+3N+JT5T/llPju26dzg','mateo gomez osio','ACTIVE','2026-10-02 22:02:57.862',NULL,'2026-10-02 22:02:57.863','2026-10-02 22:02:57.863'),('cmuriq8o2000lw5fv27iao7e2','asdaaaaaa@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$rvGG7bJVsNnsRP0quSLz8w$XiN67WRatlQ6O677l6dKoGu5ntLPB99OJLZ+2elmAXM','mateo gomez osio','ACTIVE','2026-10-02 22:12:04.321',NULL,'2026-10-02 22:12:04.322','2026-10-02 22:12:04.322'),('cmuriu437000sw5fvreizi6i8','sdfsd121f@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$dED8LYQhLetJZJcx/lVBOg$BijFgcRJ2082oHvJcnmi5ty9WLEXIThiQqllLnJLU0I','mateo gomez osio','ACTIVE','2026-10-02 22:15:05.011',NULL,'2026-10-02 22:15:05.012','2026-10-02 22:15:05.012'),('cmuriyjyp000zw5fvexrvnwah','sdddd@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$WXysgh6lna6VERIwoInv4Q$ld58/9j2jm47UyIiBkNIHcpqKJ3KwRBFMKXoIhiXApo','mateo gomez osio','ACTIVE','2026-10-02 22:18:32.205',NULL,'2026-10-02 22:18:32.209','2026-10-02 22:18:32.209'),('cmurj4l2m0016w5fv079v76fr','aaaaa@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$Wn5XfTZrnb04dkTwF9tgVA$/ZyxPFCUPcwid+/LM8p83Qk2bdCi3vGI1MlB76SWSUw','mateo gomez osio','ACTIVE','2026-10-02 22:23:13.582',NULL,'2026-10-02 22:23:13.582','2026-10-02 22:23:13.582'),('cmurja3r7001dw5fv6xuuafuc','asdasdad@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$g2mgiYW9Pj2UrWvDVysbCg$dKl1MLUwTCHU0byQJktjMTDktz6IZ/2Jy/BPDeU/zPI','mateo gomez osio','ACTIVE','2026-10-02 22:27:31.074',NULL,'2026-10-02 22:27:31.075','2026-10-02 22:27:31.075'),('cmurjd0i9001kw5fv0q61seet','asdasdasd@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$dtO3wD+ZA4JjG9D1UcJW5g$F0x5JJfVMz9lRay+cdkeZpTRTlEy4aE3+FIYNkFgd8c','mateo gomez osio','ACTIVE','2026-10-02 22:29:46.832',NULL,'2026-10-02 22:29:46.833','2026-10-02 22:29:46.833'),('cmurjiqq7001rw5fvrezvpi3g','asdasdasdasd@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$sqIhdOEa0Wi5NCY6EwBbeg$m7cgnMiUmOHcqcOauocKuH+y1SOI2DurE8pajnWbZlM','mateo gomez osio','ACTIVE','2026-10-02 22:34:14.095',NULL,'2026-10-02 22:34:14.096','2026-10-02 22:34:14.096'),('cmurjlfvc0000w5oolprwtqnh','sssss@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$BWXHyXy9VZkGhH6UjKVhxg$237QqG9CYGox9i3zZfgL+MyErWrNwip1VjgaEz9o1xw','mateo gomez osio','ACTIVE','2026-10-02 22:36:19.991',NULL,'2026-10-02 22:36:19.992','2026-10-02 22:36:19.992'),('cmurju4ra000bw5oo0n9vfnba','asdasd@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$oX3o7gi6tHRz2F9yLFodLQ$J3y5x0kDMZ/bpOYlya8wqSNaFkE+HyraMUf1XRDdx74','mateo gomez osio','ACTIVE','2026-10-02 22:43:05.492',NULL,'2026-10-02 22:43:05.494','2026-10-02 22:43:05.494'),('cmurk7d330000w5todc7ho5ow','dfgdfgd@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$j9AE/mx9d2gxpzsamgd2rg$IKd8comSbXz6Ccgp4ZqffjJKfsEtbq/lAPTbs7C+9hA','mateo gomez osio','ACTIVE','2026-10-02 22:53:22.814',NULL,'2026-10-02 22:53:22.815','2026-10-02 22:53:22.815'),('cmurkforf000bw5to4b5twv3q','xxxxxxxx@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$4EB5Qx+gTs8VBIrYMLxO8Q$CC0Ph6vgmV624YbTUQQVSsX3ftPgE52Lk0BxadeCn2A','mateo gomez osio','ACTIVE','2026-10-02 22:59:51.193',NULL,'2026-10-02 22:59:51.195','2026-10-02 22:59:51.195'),('cmurscwrx0000w5hy145pl3pi','alba@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$S7DpVZswvMYuMyHWfcZu+Q$V97cKvk15OX/1WDbjSzDn8WE1Li4+lJt9jsIX/xVbmU','alba','ACTIVE','2026-10-03 02:41:38.540',NULL,'2026-10-03 02:41:38.541','2026-10-03 02:41:38.541'),('cmuspex6a000lw5hyg8i5ca4m','teosio97@hotmail.com','$argon2id$v=19$m=65536,p=4,t=3$U1vBDcYNHoYoUT7cEZXPiA$tpTJVXohidFj4NqbRB/nVgbGgUjuDo6e1dXBAO+j3yo','mateo gomez osio','ACTIVE','2026-10-03 18:06:59.696',NULL,'2026-10-03 18:06:59.698','2026-10-03 18:06:59.698'),('cmuspyo8b0000w58etpmbcs7j','broche@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$unTFMbuCCPIlzopnMbWfmg$Q1lF11cOj6+s49nrpDv3SUqJK01AHwcCfgKZ3QbJ4Lg','mateo gomez osio','ACTIVE','2026-10-03 18:22:21.226',NULL,'2026-10-03 18:22:21.227','2026-10-03 18:22:21.227'),('cmusziwkm0004w5kzpq2rvbjv','mateoosio@gmail.com','$argon2id$v=19$m=65536,p=4,t=3$VKHzn1a0UhfKnF/WWG15VQ$6Sb5BQfMeJzFUpRvvTuMmc+MCcqRS8+oiPFhT/Qey74','mateo gomez osio','ACTIVE','2026-10-03 22:50:01.698',NULL,'2026-10-03 22:50:01.702','2026-10-03 22:50:01.702');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-13 18:12:41
