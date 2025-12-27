import path from "node:path";
import { type Enforcer, type Model, newEnforcer } from "casbin";
import prisma from "prisma";
import type { CasbinRule } from "prisma/generated/client";
import { env } from "../config/env";

let enforcer: Enforcer | null = null;

class PrismaAdapter {
	async loadPolicy(model: Model) {
		const lines = await prisma.casbinRule.findMany();

		for (const line of lines) {
			const rule = this.loadPolicyLine(line);
			if (rule) {
				model.model
					.get(rule.sec)
					?.get(rule.ptype)
					?.policy.push(rule.rule as string[]);
			}
		}
	}

	async savePolicy(model: Model) {
		await prisma.casbinRule.deleteMany();

		const rules = [];

		const astMap = model.model.get("p");
		if (astMap) {
			for (const [ptype, ast] of astMap) {
				for (const rule of ast.policy) {
					const line = this.savePolicyLine(ptype, rule);
					rules.push(line);
				}
			}
		}

		const gMap = model.model.get("g");
		if (gMap) {
			for (const [ptype, ast] of gMap) {
				for (const rule of ast.policy) {
					const line = this.savePolicyLine(ptype, rule);
					rules.push(line);
				}
			}
		}

		if (rules.length > 0) {
			await prisma.casbinRule.createMany({ data: rules });
		}

		return true;
	}

	async addPolicy(_sec: string, ptype: string, rule: string[]) {
		const line = this.savePolicyLine(ptype, rule);
		await prisma.casbinRule.create({ data: line });
	}

	async removePolicy(_sec: string, ptype: string, rule: string[]) {
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

	async removeFilteredPolicy(
		_sec: string,
		ptype: string,
		fieldIndex: number,
		...fieldValues: string[]
	) {
		const where: { [key: string]: string } = { ptype };

		for (let i = 0; i < fieldValues.length; i++) {
			const fieldName = `v${fieldIndex + i}`;
			where[fieldName] = fieldValues[i];
		}

		await prisma.casbinRule.deleteMany({ where });
	}

	private loadPolicyLine(line: CasbinRule) {
		const policy = [
			line.v0,
			line.v1,
			line.v2,
			line.v3,
			line.v4,
			line.v5,
		].filter((v) => v !== null && v !== "");

		if (policy.length === 0) return null;

		const sec = line.ptype.charAt(0);
		return { sec, ptype: line.ptype, rule: policy };
	}

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

export async function getEnforcer(): Promise<Enforcer> {
	if (!enforcer) {
		const modelPath = path.join(process.cwd(), "src/permission/model.conf");

		if (
			env.NODE_ENV === "production" ||
			process.env.USE_DB_ADAPTER === "true"
		) {
			const adapter = new PrismaAdapter();
			enforcer = await newEnforcer(modelPath, adapter);
		} else {
			const policyPath = path.join(process.cwd(), "src/permission/policy.csv");
			enforcer = await newEnforcer(modelPath, policyPath);
		}

		await enforcer.loadPolicy();
	}

	return enforcer;
}

export async function reloadPolicy(): Promise<void> {
	enforcer = null;
	await getEnforcer();
}

export async function syncCsvToDatabase(): Promise<void> {
	console.log("🔄 Syncing CSV policies to database...");

	const modelPath = path.join(process.cwd(), "src/permission/model.conf");
	const policyPath = path.join(process.cwd(), "src/permission/policy.csv");
	const csvEnforcer = await newEnforcer(modelPath, policyPath);

	const adapter = new PrismaAdapter();
	await adapter.savePolicy(csvEnforcer.getModel());

	console.log("✅ CSV policies synced to database");
}

export async function getAllPolicies() {
	const e = await getEnforcer();
	return {
		policies: e.getPolicy(),
		groupingPolicies: e.getGroupingPolicy(),
	};
}

export async function addPolicy(role: string, object: string, action: string) {
	const e = await getEnforcer();
	const added = await e.addPolicy(role, object, action);

	if (added) {
		await e.savePolicy();
	}

	return added;
}

export async function removePolicy(
	role: string,
	object: string,
	action: string,
) {
	const e = await getEnforcer();
	const removed = await e.removePolicy(role, object, action);

	if (removed) {
		await e.savePolicy();
	}

	return removed;
}

export async function addRoleForUser(userId: string, role: string) {
	const e = await getEnforcer();
	const added = await e.addGroupingPolicy(userId, role);

	if (added) {
		await e.savePolicy();
	}

	return added;
}

export async function removeRoleForUser(userId: string, role: string) {
	const e = await getEnforcer();
	const removed = await e.removeGroupingPolicy(userId, role);

	if (removed) {
		await e.savePolicy();
	}

	return removed;
}

export async function getRolesForUser(userId: string) {
	const e = await getEnforcer();
	return e.getRolesForUser(userId);
}

export async function getUsersForRole(role: string) {
	const e = await getEnforcer();
	return e.getUsersForRole(role);
}
