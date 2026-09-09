import type { Account } from "./account-manager";

export const basicAdminAccessRequest = async (user: Account) => user.type === 'admin';