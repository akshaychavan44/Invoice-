import { AppRole } from "./auth";

export type DemoUser = { id: string; name: string; email: string; role: AppRole };
const accounts: DemoUser[] = [
  { id: "00000000-0000-4000-8000-000000000001", name: "ZootechX Super Admin", email: "admin@erp.com", role: "SUPER_ADMIN" },
  { id: "00000000-0000-4000-8000-000000000002", name: "ZootechX Sub Admin", email: "subadmin@erp.com", role: "SUB_ADMIN" },
  { id: "00000000-0000-4000-8000-000000000003", name: "ZootechX Sales", email: "sales@erp.com", role: "SALES" },
  { id: "00000000-0000-4000-8000-000000000004", name: "ZootechX Growth & Marketing", email: "marketing@erp.com", role: "DIGITAL_MARKETING" },
  { id: "00000000-0000-4000-8000-000000000005", name: "ZootechX Lead Developer", email: "dev@erp.com", role: "DEVELOPER" },
];
export function findDemoUser(value: string): DemoUser | undefined { return accounts.find((account) => account.email === value || account.id === value); }
export function isDemoPassword(password: string): boolean { return password === "ChangeMe123!"; }
