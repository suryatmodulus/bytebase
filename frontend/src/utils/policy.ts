import { hasFeature } from "@/store";
import type { Database, Instance, Principal } from "@/types";
import { hasWorkspacePermission } from "./role";
import { Policy, PolicyType } from "@/types/proto/v1/org_policy_service";
import { State } from "@/types/proto/v1/common";
import { isMemberOfProject } from ".";

export const isInstanceAccessible = (instance: Instance, user: Principal) => {
  if (!hasFeature("bb.feature.access-control")) {
    // The current plan doesn't have access control feature.
    // Fallback to true.
    return true;
  }

  if (
    hasWorkspacePermission(
      "bb.permission.workspace.manage-access-control",
      user.role
    )
  ) {
    // The current user has the super privilege to access all databases.
    // AKA. Owners and DBAs
    return true;
  }

  // See if the instance is in a production environment
  const { environment } = instance;
  if (environment.tier === "UNPROTECTED") {
    return true;
  }

  return false;
};

export const isDatabaseAccessible = (
  database: Database,
  policyList: Policy[],
  user: Principal
) => {
  if (!isMemberOfProject(database.project, user)) {
    return false;
  }

  if (!hasFeature("bb.feature.access-control")) {
    // The current plan doesn't have access control feature.
    // Fallback to true.
    return true;
  }

  if (
    hasWorkspacePermission(
      "bb.permission.workspace.manage-access-control",
      user.role
    )
  ) {
    // The current user has the super privilege to access all databases.
    // AKA. Owners and DBAs
    return true;
  }

  const { environment } = database.instance;
  if (environment.tier === "UNPROTECTED") {
    return true;
  }

  const policy = policyList.find((policy) => {
    const { type, resourceUid, state } = policy;
    return (
      type === PolicyType.ACCESS_CONTROL &&
      resourceUid === `${database.id}` &&
      state === State.ACTIVE
    );
  });
  if (policy) {
    // The database is in the allowed list
    return true;
  }
  // denied otherwise
  return false;
};
