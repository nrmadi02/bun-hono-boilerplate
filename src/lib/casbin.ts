import { newEnforcer, type Enforcer } from "casbin";
import path from "node:path";
import prisma from "prisma";
import { env } from "../config/env";

let enforcer: Enforcer | null = null;

/**
 * Custom Prisma Adapter for Casbin
 * Implements the Adapter interface to work with Prisma
 */
class PrismaAdapter {
  /**
   * Load all policies from database
   */
  async loadPolicy(model: any) {
    const lines = await prisma.casbinRule.findMany();
    
    for (const line of lines) {
      const rule = this.loadPolicyLine(line);
      if (rule) {
        model.model.get(rule.sec)?.get(rule.ptype)?.policy.push(rule.rule);
      }
    }
  }

  /**
   * Save all policies to database
   */
  async savePolicy(model: any) {
    // Clear existing policies
    await prisma.casbinRule.deleteMany();

    const rules = [];
    
    // Get all policy rules
    const astMap = model.model.get("p");
    if (astMap) {
      for (const [ptype, ast] of astMap) {
        for (const rule of ast.policy) {
          const line = this.savePolicyLine(ptype, rule);
          rules.push(line);
        }
      }
    }
    
    // Get all role rules
    const gMap = model.model.get("g");
    if (gMap) {
      for (const [ptype, ast] of gMap) {
        for (const rule of ast.policy) {
          const line = this.savePolicyLine(ptype, rule);
          rules.push(line);
        }
      }
    }

    // Batch insert
    if (rules.length > 0) {
      await prisma.casbinRule.createMany({ data: rules });
    }

    return true;
  }

  /**
   * Add a single policy rule to database
   */
  async addPolicy(sec: string, ptype: string, rule: string[]) {
    const line = this.savePolicyLine(ptype, rule);
    await prisma.casbinRule.create({ data: line });
  }

  /**
   * Remove a single policy rule from database
   */
  async removePolicy(sec: string, ptype: string, rule: string[]) {
    const line = this.savePolicyLine(ptype, rule);
    await prisma.casbinRule.deleteMany({
      where: {
        ptype: line.ptype,
        v0: line.v0,
        v1: line.v1,
        v2: line.v2,
        v3: line.v3,
        v4: line.v4,
        v5: line.v5,
      },
    });
  }

  /**
   * Remove policies by filter
   */
  async removeFilteredPolicy(
    sec: string,
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ) {
    const where: any = { ptype };
    
    for (let i = 0; i < fieldValues.length; i++) {
      const fieldName = `v${fieldIndex + i}`;
      where[fieldName] = fieldValues[i];
    }

    await prisma.casbinRule.deleteMany({ where });
  }

  /**
   * Convert database row to policy line
   */
  private loadPolicyLine(line: any) {
    const policy = [line.v0, line.v1, line.v2, line.v3, line.v4, line.v5]
      .filter((v) => v !== null && v !== "");

    if (policy.length === 0) return null;

    const sec = line.ptype.charAt(0);
    return { sec, ptype: line.ptype, rule: policy };
  }

  /**
   * Convert policy line to database row
   */
  private savePolicyLine(ptype: string, rule: string[]) {
    return {
      ptype,
      v0: rule[0] || null,
      v1: rule[1] || null,
      v2: rule[2] || null,
      v3: rule[3] || null,
      v4: rule[4] || null,
      v5: rule[5] || null,
    };
  }
}

/**
 * Get or create Casbin Enforcer (Singleton)
 */
export async function getEnforcer(): Promise<Enforcer> {
  if (!enforcer) {
    const modelPath = path.join(process.cwd(), "src/permission/model.conf");
    
    // Choose adapter based on environment
    if (env.NODE_ENV === "production" || process.env.USE_DB_ADAPTER === "true") {
      // Use Database Adapter for production
      const adapter = new PrismaAdapter();
      enforcer = await newEnforcer(modelPath, adapter);
      console.log("✅ Casbin enforcer initialized with DATABASE adapter");
    } else {
      // Use CSV Adapter for development
      const policyPath = path.join(process.cwd(), "src/permission/policy.csv");
      enforcer = await newEnforcer(modelPath, policyPath);
      console.log("✅ Casbin enforcer initialized with CSV adapter");
    }
    
    await enforcer.loadPolicy();
  }
  
  return enforcer;
}

/**
 * Reload policy from source (database or CSV)
 */
export async function reloadPolicy(): Promise<void> {
  // set enforcer to null to force reload
  enforcer = null;

  // get new enforcer
  await getEnforcer();

  console.log("✅ Casbin policy reloaded");
}

/**
 * Sync CSV policies to database (Migration helper)
 */
export async function syncCsvToDatabase(): Promise<void> {
  console.log("🔄 Syncing CSV policies to database...");
  
  // Load from CSV
  const modelPath = path.join(process.cwd(), "src/permission/model.conf");
  const policyPath = path.join(process.cwd(), "src/permission/policy.csv");
  const csvEnforcer = await newEnforcer(modelPath, policyPath);
  
  // Save to database
  const adapter = new PrismaAdapter();
  await adapter.savePolicy(csvEnforcer.getModel());
  
  console.log("✅ CSV policies synced to database");
}

/**
 * Get all policies from enforcer
 */
export async function getAllPolicies() {
  const e = await getEnforcer();
  return {
    policies: e.getPolicy(),
    groupingPolicies: e.getGroupingPolicy(),
  };
}

/**
 * Add a new policy
 */
export async function addPolicy(role: string, object: string, action: string) {
  const e = await getEnforcer();
  const added = await e.addPolicy(role, object, action);
  
  if (added) {
    await e.savePolicy();
  }
  
  return added;
}

/**
 * Remove a policy
 */
export async function removePolicy(role: string, object: string, action: string) {
  const e = await getEnforcer();
  const removed = await e.removePolicy(role, object, action);
  
  if (removed) {
    await e.savePolicy();
  }
  
  return removed;
}

/**
 * Add role for user (grouping policy)
 */
export async function addRoleForUser(userId: string, role: string) {
  const e = await getEnforcer();
  const added = await e.addGroupingPolicy(userId, role);
  
  if (added) {
    await e.savePolicy();
  }
  
  return added;
}

/**
 * Remove role from user
 */
export async function removeRoleForUser(userId: string, role: string) {
  const e = await getEnforcer();
  const removed = await e.removeGroupingPolicy(userId, role);
  
  if (removed) {
    await e.savePolicy();
  }
  
  return removed;
}

/**
 * Get roles for user
 */
export async function getRolesForUser(userId: string) {
  const e = await getEnforcer();
  return e.getRolesForUser(userId);
}

/**
 * Get users for role
 */
export async function getUsersForRole(role: string) {
  const e = await getEnforcer();
  return e.getUsersForRole(role);
}