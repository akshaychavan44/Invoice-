import type { ReactNode } from "react";

type PageProps = { children: ReactNode };

// Named boundaries keep each CRM screen independently maintainable while leaving
// its current layout and behavior entirely unchanged.
export const DashboardPage = ({ children }: PageProps) => <>{children}</>;
export const LeadsPage = ({ children }: PageProps) => <>{children}</>;
export const FollowUpsPage = ({ children }: PageProps) => <>{children}</>;
export const InvoicesPage = ({ children }: PageProps) => <>{children}</>;
export const CreateInvoicePage = ({ children }: PageProps) => <>{children}</>;
export const QuotationsPage = ({ children }: PageProps) => <>{children}</>;
export const ClientsPage = ({ children }: PageProps) => <>{children}</>;
export const PaymentsPage = ({ children }: PageProps) => <>{children}</>;
export const ExpensesPage = ({ children }: PageProps) => <>{children}</>;
export const SettingsPage = ({ children }: PageProps) => <>{children}</>;
