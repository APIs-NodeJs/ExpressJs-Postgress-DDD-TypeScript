import { Router } from "express";
import authRoutes from "@modules/auth/presentation/routes/auth.routes";
import productRoutes from "@modules/products/presentation/routes/product.routes";
import featureRoutes from "@modules/features/presentation/routes/feature.routes";
import taskRoutes from "@modules/tasks/presentation/routes/task.routes";
import bugRoutes from "@modules/bugs/presentation/routes/bug.routes";
import sprintRoutes from "@modules/sprints/presentation/routes/sprint.routes";
import releaseRoutes from "@modules/releases/presentation/routes/release.routes";
import teamRoutes from "@modules/team/presentation/routes/team.routes";
import dashboardRoutes from "@modules/dashboard/presentation/routes/dashboard.routes";
import settingsRoutes from "@modules/settings/presentation/routes/settings.routes";
import billingRoutes from "@modules/billing/presentation/routes/billing.routes";
import adminRoutes from "@modules/admin/presentation/routes/admin.routes";
import analyticsRoutes from "@modules/analytics/presentation/routes/analytics.routes"; // NEW

const router = Router();

// ============================================================================
// API VERSION 1 ROUTES
// ============================================================================

// Authentication & Authorization
router.use("/auth", authRoutes);

// Core Modules
router.use("/products", productRoutes);
router.use("/features", featureRoutes);
router.use("/tasks", taskRoutes);
router.use("/bugs", bugRoutes);
router.use("/sprints", sprintRoutes);
router.use("/releases", releaseRoutes);
router.use("/team", teamRoutes);

// Dashboard & Analytics
router.use("/dashboard", dashboardRoutes);
router.use("/analytics", analyticsRoutes); // NEW - Analytics Module

// Settings & Configuration
router.use("/settings", settingsRoutes);
router.use("/billing", billingRoutes);

// Admin Panel
router.use("/admin", adminRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API documentation redirect
router.get("/", (req, res) => {
  res.json({
    message: "DevCycle API v1",
    documentation: "/api/docs",
    health: "/api/health",
  });
});

export default router;
