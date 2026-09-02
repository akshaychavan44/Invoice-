import Login from "./components/Login";
import SalesDashboard from "./components/SalesDashboard";
import SubAdminDashboard from "./components/SubAdminDashboard";
import DeveloperWorkspace from "./components/DeveloperWorkspace";
import { ClientsPage, CreateInvoicePage, DashboardPage, ExpensesPage, FollowUpsPage, InvoicesPage, LeadsPage, PaymentsPage, QuotationsPage, SettingsPage } from "./components/pages/CrmPages";
import "./app.css";
import { apiFetch, AuthUser } from "./lib/api";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, UserPlus, BellRing, FileText, Plus, FileQuestion, Users, Building2,
  CreditCard, Calculator, Settings, Search, Sun, Moon, Bell, ChevronDown, X, Eye,
  Phone, MessageCircle, Mail, Calendar, MapPin, TrendingUp, TrendingDown, Clock,
  Check, AlertCircle, ArrowLeft, Save, Wand2, Sparkles, Bot, Filter,
  Download, Edit3, Trash2, MoreHorizontal, ChevronRight, Briefcase, Home, Store, Factory, LandPlot, LogOut
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";

// TYPES
type LeadPriority = "High" | "Medium" | "Low";
type LeadStatus = "New" | "Contacted" | "Follow-up" | "Qualified" | "Negotiation" | "Converted" | "Lost";
type FollowUpType = "Phone Call" | "WhatsApp" | "Email" | "Meeting" | "Site Visit";
type FollowUpStatus = "Scheduled" | "Completed" | "Rescheduled" | "Cancelled" | "Overdue";

interface Lead {
  id: string; name: string; company: string; email: string; phone: string;
  propertyType: string; location: string; budgetMin: number; budgetMax: number;
  source: string; assignedTo: string; priority: LeadPriority; status: LeadStatus;
  notes: string; nextFollowUp: string; followUpType: FollowUpType; avatar: string;
  createdAt: string; customerId?: string | null; convertedAt?: string | null;
}
interface FollowUp {
  id: string; leadId: string; leadName: string; company: string; property: string;
  type: FollowUpType; date: string; time: string; assignedTo: string;
  priority: LeadPriority; status: FollowUpStatus; notes: string; completedAt?: string | null;
}
interface InvoiceItem { id: string; name: string; hsn: string; qty: number; unit: string; rate: number; discount: number; gst: number; }
interface Invoice {
  id: string; number: string; clientId: string; clientName: string; date: string; dueDate: string;
  placeOfSupply: string; items: InvoiceItem[]; subtotal: number; total: number; gstTotal: number;
  cgst: number; sgst: number; igst: number; status: "Draft" | "Sent" | "Paid" | "Overdue"; amountPaid: number;
}
interface Client { id: string; businessName: string; name: string; gstin: string; email: string; phone: string; address: string; state: string; creditLimit: number; }
interface Quotation { id: string; clientName: string; amount: number; validUntil: string; status: string; }

type ApiLead = {
  id: string; full_name: string; company: string | null; email: string | null; phone: string | null;
  source: string; notes: string | null; status: string; created_at: string; customer_id?: string | null; converted_at?: string | null;
};

const toLead = (lead: ApiLead): Lead => ({
  id: lead.id, name: lead.full_name, company: lead.company ?? "", email: lead.email ?? "", phone: lead.phone ?? "",
  propertyType: "Commercial", location: "", budgetMin: 0, budgetMax: 0, source: lead.source,
  assignedTo: "", priority: "Medium", status: ({ NEW:"New", CONTACTED:"Contacted", FOLLOW_UP:"Follow-up", INTERESTED:"Qualified", QUOTATION_SENT:"Qualified", NEGOTIATION:"Negotiation", CONVERTED:"Converted", LOST:"Lost" }[lead.status] ?? "New") as LeadStatus, notes: lead.notes ?? "", nextFollowUp: "", customerId:lead.customer_id ?? null, convertedAt:lead.converted_at ?? null,
  followUpType: "Phone Call", avatar: lead.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
  createdAt: lead.created_at,
});
type ApiFollowUp = { id: string; lead_id: string | null; lead_name: string; company: string | null; property: string | null; type: string; followup_date: string; followup_time: string | null; assigned_to: string | null; priority: string | null; status: string; notes: string | null; completed_at?: string | null };
const toFollowUp = (followup: ApiFollowUp): FollowUp => ({ id: followup.id, leadId: followup.lead_id ?? "", leadName: followup.lead_name, company: followup.company ?? "", property: followup.property ?? "", type: followup.type as FollowUpType, date: followup.followup_date, time: followup.followup_time ?? "", assignedTo: followup.assigned_to ?? "", priority: (followup.priority as LeadPriority) ?? "Medium", status: followup.status as FollowUpStatus, notes: followup.notes ?? "", completedAt:followup.completed_at ?? null });

type ApiClient = { id: string; name: string; company: string | null; email: string | null; phone: string | null; gst_number: string | null };
const toClient = (client: ApiClient): Client => ({
  id: client.id, businessName: client.company ?? client.name, name: client.name, gstin: client.gst_number ?? "",
  email: client.email ?? "", phone: client.phone ?? "", address: "", state: "27-Maharashtra", creditLimit: 0,
});
type ApiQuotation = { quotation_number: string; client_name: string; amount: string | number; valid_until: string; status: string };
const toQuotation = (quotation: ApiQuotation): Quotation => ({ id: quotation.quotation_number, clientName: quotation.client_name, amount: Number(quotation.amount), validUntil: quotation.valid_until.slice(0, 10), status: quotation.status });
type ApiNotification = { id:string; title:string; message:string; is_read:boolean; created_at:string };
const toNotification = (notification: ApiNotification) => ({ id:notification.id, text:`${notification.title}: ${notification.message}`, time:new Date(notification.created_at).toLocaleString(), unread:!notification.is_read });
type ApiInvoice = { id: string; invoice_number: string; client_id: string; client_name: string; total: string | number; paid_amount: string | number; due_date: string; created_at: string };
const toInvoice = (invoice: ApiInvoice): Invoice => ({ id: invoice.id, number: invoice.invoice_number, clientId: invoice.client_id, clientName: invoice.client_name, date: invoice.created_at.slice(0, 10), dueDate: invoice.due_date.slice(0, 10), placeOfSupply: "27-Maharashtra", items: [], subtotal: Number(invoice.total), total: Number(invoice.total), gstTotal: 0, cgst: 0, sgst: 0, igst: 0, status: Number(invoice.paid_amount) >= Number(invoice.total) ? "Paid" : "Sent", amountPaid: Number(invoice.paid_amount) });
type FinanceExpense = { id: string; title: string; category: string; amount: string | number; expense_date: string | null; payment_method: string | null };
type FinancePayment = { id: string; invoice_number: string; amount: string | number; method: string; created_at: string };

const followUpTimeOptions = Array.from({ length: 24 }, (_, hour) => [0, 30].map(minute => { const suffix = hour < 12 ? "AM" : "PM"; const displayHour = hour % 12 || 12; return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`; })).flat();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);

 

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [payments, setPayments] = useState<FinancePayment[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUpFilter, setFollowUpFilter] = useState<string>("All");
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<"unread" | "all">("unread");
  const [showAiChat, setShowAiChat] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const followUpDateRef = useRef<HTMLInputElement>(null);
  const addLeadDateRef = useRef<HTMLInputElement>(null);
  const quoteValidUntilRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // NEW INVOICE FORM STATE
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice> & { placeOfSupply: string }>({
    number:"INV-2026-001",
    date:new Date().toISOString().split("T")[0],
    dueDate:new Date(Date.now()+30*86400000).toISOString().split("T")[0],
    placeOfSupply:"27-Maharashtra",
    items:[{id:"1", name:"", hsn:"", qty:1, unit:"Nos", rate:0, discount:0, gst:18}],
    amountPaid:0,
    clientId:"", clientName:"", status:"Draft"
  });
  const [previewMode, setPreviewMode] = useState(false);

  // ADD LEAD FORM
  const [leadForm, setLeadForm] = useState<Partial<Lead>>({
    propertyType:"Commercial", location:"Tardeo", source:"Website", priority:"Medium", status:"New", followUpType:"Phone Call", assignedTo:"Aarav"
  });
  const [followUpForm, setFollowUpForm] = useState<Partial<FollowUp>>({ type:"Phone Call", priority:"Medium", assignedTo:"Aarav" });
  const [clientForm, setClientForm] = useState<Partial<Client>>({ state:"27-Maharashtra" });
  const [quoteForm, setQuoteForm] = useState<Partial<Quotation>>({ status:"Draft" });

  const [notifications, setNotifications] = useState([{ id:"1", text:"Follow-up overdue: Sneha Gupta", time:"10 min ago", unread:true }, { id:"2", text:"New lead: Ananya Desai converted", time:"1 hr ago", unread:true }, { id:"3", text:"Invoice INV-2026-001 due in 3 days", time:"2 hr ago", unread:false }]);

  // Load theme only. CRM data is always loaded from the authenticated backend.
  useEffect(()=>{
    const savedTheme = localStorage.getItem("zootechx_theme");
    if(savedTheme) setIsDark(savedTheme==="dark");
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
    }
  },[]);

  // Restore only a server-validated session; never trust a role stored in the browser.
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("zootechx_token");
      if (!token) { setAuthChecking(false); return; }
      try {
        const response = await apiFetch("/api/auth/me");
        const data = await response.json();
        if (!response.ok || !data.user) throw new Error("Invalid session");
        const user = data.user as AuthUser;
        localStorage.setItem("zootechx_user", JSON.stringify(user));
        setUserRole(user.role);
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem("zootechx_token");
        localStorage.removeItem("zootechx_user");
      } finally {
        setAuthChecking(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const loadCrmData = async () => {
      try {
        const [leadsResponse, clientsResponse, invoicesResponse, expensesResponse, paymentsResponse, followupsResponse, quotationsResponse, notificationsResponse] = await Promise.all([apiFetch("/api/leads"), apiFetch("/api/clients"), apiFetch("/api/invoices"), apiFetch("/api/expenses"), apiFetch("/api/payments"), apiFetch("/api/followups"), apiFetch("/api/quotations"), apiFetch("/api/notifications")]);
        const leadsData = await leadsResponse.json();
        const clientsData = await clientsResponse.json();
        const invoicesData = await invoicesResponse.json(); const expensesData = await expensesResponse.json(); const paymentsData = await paymentsResponse.json(); const followupsData = await followupsResponse.json(); const quotationsData = await quotationsResponse.json(); const notificationsData = await notificationsResponse.json();
        if (leadsResponse.ok && Array.isArray(leadsData.data)) setLeads(leadsData.data.map(toLead));
        if (clientsResponse.ok && Array.isArray(clientsData.data)) setClients(clientsData.data.map(toClient));
        if (invoicesResponse.ok && Array.isArray(invoicesData.data)) setInvoices(invoicesData.data.map(toInvoice));
        if (expensesResponse.ok && Array.isArray(expensesData.data)) setExpenses(expensesData.data);
        if (paymentsResponse.ok && Array.isArray(paymentsData.data)) setPayments(paymentsData.data);
        if (followupsResponse.ok && Array.isArray(followupsData.data)) setFollowUps(followupsData.data.map(toFollowUp));
        if (quotationsResponse.ok && Array.isArray(quotationsData.data)) setQuotations(quotationsData.data.map(toQuotation));
        if (notificationsResponse.ok && Array.isArray(notificationsData.data)) setNotifications(notificationsData.data.map(toNotification));
      } catch {
        // Leave the CRM lists empty until the backend is available.
      }
    };
    loadCrmData();
  }, [isLoggedIn]);

useEffect(()=>{ localStorage.setItem("zootechx_theme", isDark?"dark":"light"); },[isDark]);

  useEffect(() => {
    const closeSearchOnOutsideClick = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) setIsSearchOpen(false);
    };
    document.addEventListener("mousedown", closeSearchOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeSearchOnOutsideClick);
  }, []);

  // Overdue detection
  useEffect(()=>{
    const now = new Date();
    setFollowUps(prev=> prev.map(f=>{
      const fDate = new Date(f.date + " " + f.time);
      if(fDate < now && f.status==="Scheduled") return {...f, status:"Overdue" as FollowUpStatus};
      return f;
    }));
  },[]);

  const toggleTheme = () => setIsDark(!isDark);

  const filteredLeads = useMemo(()=>{
    if(!searchQuery) return leads;
    return leads.filter(l=> `${l.name} ${l.company} ${l.email}`.toLowerCase().includes(searchQuery.toLowerCase()));
  },[leads, searchQuery]);

  const searchMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return { leads:[] as Lead[], followUps:[] as FollowUp[], clients:[] as Client[], invoices:[] as Invoice[] };
    const matches = (value: string) => value.toLowerCase().includes(query);
    return {
      leads: leads.filter(lead => matches(`${lead.name} ${lead.company} ${lead.email} ${lead.phone}`)).slice(0, 3),
      followUps: followUps.filter(followUp => matches(`${followUp.leadName} ${followUp.company} ${followUp.property} ${followUp.type}`)).slice(0, 3),
      clients: clients.filter(client => matches(`${client.businessName} ${client.name} ${client.email} ${client.phone}`)).slice(0, 3),
      invoices: invoices.filter(invoice => matches(`${invoice.number} ${invoice.clientName}`)).slice(0, 3),
    };
  }, [clients, followUps, invoices, leads, searchQuery]);

  const searchResultCount = searchMatches.leads.length + searchMatches.followUps.length + searchMatches.clients.length + searchMatches.invoices.length;
  const bellNotifications = notificationTab === "unread" ? notifications.filter(notification => notification.unread) : notifications;
  const markNotificationRead = async (id:string) => { const response = await apiFetch(`/api/notifications/${id}/read`, { method:"PATCH" }); if (response.ok) setNotifications(current => current.map(notification => notification.id === id ? { ...notification, unread:false } : notification)); };
  const markAllNotificationsRead = async () => { const response = await apiFetch("/api/notifications/read-all", { method:"POST" }); if (response.ok) setNotifications(current => current.map(notification => ({ ...notification, unread:false }))); };
  const clearReadNotifications = async () => { const response = await apiFetch("/api/notifications/clear-read", { method:"POST" }); if (response.ok) setNotifications(current => current.filter(notification => notification.unread)); };

  // Converted records belong in Clients, so all lead counters use active leads.
  const activeLeads = useMemo(() => leads.filter(lead => lead.status !== "Converted"), [leads]);
  const visibleLeads = useMemo(() => filteredLeads.filter(lead => lead.status !== "Converted"), [filteredLeads]);

  const kpis = useMemo(()=> {
    const total = leads.length;
    const totalInvoiced = invoices.reduce((s,i)=> s+i.total,0);
    const pending = invoices.filter(i=> i.status==="Sent").length;
    const overdue = followUps.filter(f=> f.status==="Overdue").length;
    return { total, totalInvoiced, pending, overdue };
  },[leads, invoices, followUps]);

  const pipelineData = useMemo(() => ["New", "Contacted", "Follow-up", "Qualified", "Negotiation", "Converted"].map(name => ({ name, value: leads.filter(lead => lead.status === name).length })), [leads]);
  const revenueData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(); date.setMonth(date.getMonth() - (5 - index));
      return { key: `${date.getFullYear()}-${date.getMonth()}`, month: date.toLocaleString("en", { month:"short" }), revenue: 0, forecast: 0 };
    });
    invoices.forEach(invoice => {
      const date = new Date(invoice.date);
      const target = months.find(month => month.key === `${date.getFullYear()}-${date.getMonth()}`);
      if (target) target.revenue += invoice.total;
    });
    return months;
  }, [invoices]);
  const statusData = useMemo(() => {
    const colors: Record<Invoice["status"], string> = { Paid:"#10b981", Sent:"#6366f1", Draft:"#94a3b8", Overdue:"#ef4444" };
    return (Object.keys(colors) as Invoice["status"][]).map(name => ({ name, value: invoices.filter(invoice => invoice.status === name).length, color: colors[name] }));
  }, [invoices]);

  const todayFollowUps = followUps.filter(f=> f.date===new Date().toISOString().split("T")[0] && f.status!=="Completed");
  const upcomingFollow = followUps.filter(f=> new Date(f.date) > new Date() && f.status==="Scheduled").length;
  const overdueFollow = followUps.filter(f=> f.status==="Overdue").length;
  const completedFollow = followUps.filter(f=> f.status==="Completed").length;

  const filteredFollowUps = useMemo(()=>{
    if(followUpFilter==="All") return followUps;
    if(followUpFilter==="Today") return followUps.filter(f=> f.date===new Date().toISOString().split("T")[0]);
    if(followUpFilter==="Upcoming") return followUps.filter(f=> new Date(f.date) > new Date() && f.status==="Scheduled");
    return followUps.filter(f=> f.status===followUpFilter);
  },[followUps, followUpFilter]);

  const handleConvertLead = async (lead: Lead) => {
    try {
      const response = await apiFetch(`/api/leads/${lead.id}/convert`, { method:"POST" });
      const data = await response.json();
      if (!response.ok || !data.data) throw new Error(data.message || "Unable to convert lead");
      setLeads(current => current.map(item => item.id === lead.id ? toLead(data.data as ApiLead) : item));
      if (data.client) {
        const client = toClient(data.client as ApiClient);
        setClients(current => current.some(item => item.id === client.id) ? current : [client, ...current]);
      }
      setSelectedLead(null);
    } catch (error) {
      setNotifications(current => [{ id:Date.now().toString(), text:error instanceof Error ? error.message : "Unable to convert lead", time:"Just now", unread:true }, ...current]);
    }
  };

  const handleLeadStatusChange = async (lead: Lead, status: LeadStatus) => {
    if (status === "Converted") {
      await handleConvertLead(lead);
      return;
    }

    const apiStatus: Record<Exclude<LeadStatus, "Converted">, string> = {
      New: "NEW",
      Contacted: "CONTACTED",
      "Follow-up": "FOLLOW_UP",
      Qualified: "INTERESTED",
      Negotiation: "NEGOTIATION",
      Lost: "LOST",
    };

    try {
      const response = await apiFetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: apiStatus[status] }),
      });
      const data = await response.json();
      if (!response.ok || !data.data) throw new Error(data.message || "Unable to update lead status");
      setLeads(current => current.map(item => item.id === lead.id ? toLead(data.data as ApiLead) : item));
    } catch (error) {
      setNotifications(current => [{ id:Date.now().toString(), text:error instanceof Error ? error.message : "Unable to update lead status", time:"Just now", unread:true }, ...current]);
    }
  };

  const handleCreateQuotation = async () => {
    if (!quoteForm.clientName || !quoteForm.amount) return;
    const client = clients.find(item => item.businessName === quoteForm.clientName);
    try {
      const response = await apiFetch("/api/quotations", {
        method: "POST",
        body: JSON.stringify({ clientId: client?.id, clientName: quoteForm.clientName, amount: quoteForm.amount, validUntil: quoteForm.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0], status: quoteForm.status || "Draft" }),
      });
      const data = await response.json();
      if (!response.ok || !data.data) throw new Error(data.message || "Unable to save quotation");
      const quotation = toQuotation(data.data as ApiQuotation);
      setQuotations(current => [quotation, ...current]);
      setShowCreateQuote(false);
      setQuoteForm({ status:"Draft" });
    } catch (error) {
      setNotifications(current => [{ id:Date.now().toString(), text:error instanceof Error ? error.message : "Unable to save quotation", time:"Just now", unread:true }, ...current]);
    }
  };

  const handleCompleteFollowUp = async (followUp: FollowUp) => {
    try {
      const response = await apiFetch(`/api/followups/${followUp.id}/complete`, { method:"POST" });
      const data = await response.json();
      if (!response.ok || !data.data) throw new Error(data.message || "Unable to complete follow-up");
      setFollowUps(current => current.map(item => item.id === followUp.id ? toFollowUp(data.data as ApiFollowUp) : item));
    } catch (error) {
      setNotifications(current => [{ id:Date.now().toString(), text:error instanceof Error ? error.message : "Unable to complete follow-up", time:"Just now", unread:true }, ...current]);
    }
  };

  const handleDeleteFollowUp = async (followUp: FollowUp) => {
    try {
      const response = await apiFetch(`/api/followups/${followUp.id}`, { method:"DELETE" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message || "Unable to delete follow-up"); }
      setFollowUps(current => current.filter(item => item.id !== followUp.id));
    } catch (error) {
      setNotifications(current => [{ id:Date.now().toString(), text:error instanceof Error ? error.message : "Unable to delete follow-up", time:"Just now", unread:true }, ...current]);
    }
  };

  const handleAddLead = async () => {
    if(!leadForm.name || !leadForm.phone) return;
    const newLead: Lead = {
      id:`L${String(leads.length+1).padStart(3,"0")}`,
      name:leadForm.name!, company:leadForm.company||"", email:leadForm.email||"", phone:leadForm.phone!,
      propertyType:leadForm.propertyType||"Commercial", location:leadForm.location||"Tardeo",
      budgetMin:leadForm.budgetMin||0, budgetMax:leadForm.budgetMax||0, source:leadForm.source||"Website",
      assignedTo:leadForm.assignedTo||"Aarav", priority:(leadForm.priority as LeadPriority)||"Medium",
      status:(leadForm.status as LeadStatus)||"New", notes:leadForm.notes||"",
      nextFollowUp:leadForm.nextFollowUp||new Date(Date.now()+86400000).toISOString(),
      followUpType:(leadForm.followUpType as FollowUpType)||"Phone Call",
      avatar:leadForm.name!.split(" ").map(n=> n[0]).join("").slice(0,2).toUpperCase(),
      createdAt:new Date().toISOString()
    };
    let savedLead: Lead;
    try {
      const response = await apiFetch("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          fullName: newLead.name, company: newLead.company || undefined, email: newLead.email || undefined,
          phone: newLead.phone || undefined, source: newLead.source, notes: newLead.notes || undefined,
          status: ({ New:"NEW", Contacted:"CONTACTED", "Follow-up":"FOLLOW_UP", Qualified:"INTERESTED", Negotiation:"NEGOTIATION", Converted:"CONVERTED", Lost:"LOST" }[newLead.status] ?? "NEW"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save lead");
      savedLead = toLead(data.data as ApiLead);
      setLeads(current => [savedLead, ...current]);
    } catch (error) {
      setNotifications(current => [{ id:Date.now().toString(), text:error instanceof Error ? error.message : "Unable to save lead", time:"Just now", unread:true }, ...current]);
      return;
    }
    // Auto-create the selected follow-up only after the lead has been persisted.
    if(newLead.nextFollowUp){
      const d = new Date(newLead.nextFollowUp);
      const fu: FollowUp = {
        id:"", leadId:savedLead.id, leadName:newLead.name,
        company:newLead.company, property:`${newLead.propertyType} - ${newLead.location}`,
        type:newLead.followUpType, date:d.toISOString().split("T")[0], time:"10:00 AM",
        assignedTo:newLead.assignedTo, priority:newLead.priority, status:"Scheduled", notes:`Follow up for ${newLead.name}`
      };
      try {
        const response = await apiFetch("/api/followups", { method:"POST", body:JSON.stringify({ leadId:fu.leadId, leadName:fu.leadName, company:fu.company || undefined, property:fu.property || undefined, type:fu.type, date:fu.date, time:fu.time, assignedTo:fu.assignedTo, priority:fu.priority, status:fu.status, notes:fu.notes }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to create follow-up");
        const savedFollowUp = toFollowUp(data.data as ApiFollowUp);
        setFollowUps(current => [savedFollowUp, ...current]);
      } catch (error) { setNotifications(current => [{ id:Date.now().toString(), text:error instanceof Error ? error.message : "Lead was saved, but its follow-up could not be created", time:"Just now", unread:true }, ...current]); }
    }
    setShowAddLead(false);
    setLeadForm({ propertyType:"Commercial", location:"Tardeo", source:"Website", priority:"Medium", status:"New", followUpType:"Phone Call", assignedTo:"Aarav" });
  };

  const handleScheduleFollowUp = async () => {
    if(!followUpForm.leadName) { setNotifications([{ id: Date.now().toString(), text: "Select a lead before scheduling a follow-up.", time: "Just now", unread: true }, ...notifications]); return; }
    const fu: FollowUp = {
      id:`F${String(followUps.length+1).padStart(3,"0")}`, leadId:followUpForm.leadId||"", leadName:followUpForm.leadName!,
      company:followUpForm.company||"", property:followUpForm.property||"", type:(followUpForm.type as FollowUpType)||"Phone Call",
      date:followUpForm.date||new Date().toISOString().split("T")[0], time:followUpForm.time||"10:00 AM",
      assignedTo:followUpForm.assignedTo||"Aarav", priority:(followUpForm.priority as LeadPriority)||"Medium",
      status:"Scheduled", notes:followUpForm.notes||""
    };
    try {
      const response = await apiFetch("/api/followups", { method: "POST", body: JSON.stringify({ leadId: fu.leadId || undefined, leadName: fu.leadName, company: fu.company || undefined, property: fu.property || undefined, type: fu.type, date: fu.date, time: fu.time, assignedTo: fu.assignedTo, priority: fu.priority, status: fu.status, notes: fu.notes || undefined }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to schedule follow-up");
      const savedFollowUp = toFollowUp(data.data as ApiFollowUp);
      setFollowUps(current => [savedFollowUp, ...current]);
      setShowFollowUpModal(false); setFollowUpForm({ type:"Phone Call", priority:"Medium", assignedTo:"Aarav" });
    } catch (error) { setNotifications([{ id: Date.now().toString(), text: error instanceof Error ? error.message : "Unable to schedule follow-up", time: "Just now", unread: true }, ...notifications]); }
  };

  const handleCreateClient = async () => {
    if (!clientForm.businessName || !clientForm.phone) return;
    try {
      const response = await apiFetch("/api/clients", { method: "POST", body: JSON.stringify({ name: clientForm.name || clientForm.businessName, company: clientForm.businessName, email: clientForm.email || undefined, phone: clientForm.phone, gstNumber: clientForm.gstin || undefined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save client");
      setClients([toClient(data.data), ...clients]);
      setShowCreateClient(false);
      setClientForm({ state: "27-Maharashtra" });
    } catch (error) { setNotifications(current => [{ id:Date.now().toString(), text:error instanceof Error ? error.message : "Unable to save client", time:"Just now", unread:true }, ...current]); }
  };

  const calculateInvoiceTotals = (items: InvoiceItem[], place: string) => {
    const subtotal = items.reduce((s,it)=> s + (it.qty*it.rate*(1-it.discount/100)),0);
    const gstTotal = items.reduce((s,it)=> s + (it.qty*it.rate*(1-it.discount/100)*it.gst/100),0);
    const isMaharashtra = place.startsWith("27");
    const cgst = isMaharashtra ? gstTotal/2 : 0;
    const sgst = isMaharashtra ? gstTotal/2 : 0;
    const igst = isMaharashtra ? 0 : gstTotal;
    const total = subtotal + gstTotal;
    return { subtotal, gstTotal, cgst, sgst, igst, total };
  };

  const handleSaveInvoice = async (asDraft:boolean=false) => {
    const items = newInvoice.items as InvoiceItem[];
    const calc = calculateInvoiceTotals(items, newInvoice.placeOfSupply||"27-Maharashtra");
    const inv: Invoice = {
      id:`INV${String(invoices.length+1).padStart(2,"0")}`,
      number:newInvoice.number||`INV-2026-${String(invoices.length+1).padStart(3,"0")}`,
      clientId:newInvoice.clientId||"", clientName:newInvoice.clientName||clients[0]?.businessName||"Unknown",
      date:newInvoice.date||new Date().toISOString().split("T")[0],
      dueDate:newInvoice.dueDate||new Date(Date.now()+30*86400000).toISOString().split("T")[0],
      placeOfSupply:newInvoice.placeOfSupply||"27-Maharashtra",
      items, subtotal:calc.subtotal, total:calc.total, gstTotal:calc.gstTotal,
      cgst:calc.cgst, sgst:calc.sgst, igst:calc.igst,
      status: asDraft ? "Draft" : "Sent", amountPaid:newInvoice.amountPaid||0
    };
    try {
      if (!inv.clientId) throw new Error("Choose a client before saving an invoice");
      const response = await apiFetch("/api/invoices", { method: "POST", body: JSON.stringify({ invoiceNumber: inv.number, clientId: inv.clientId, clientName: inv.clientName, total: inv.total, paidAmount: inv.amountPaid, dueDate: new Date(inv.dueDate).toISOString() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save invoice");
      setInvoices([{ ...inv, id: data.data.id }, ...invoices]);
    } catch (error) {
      if (error instanceof Error && error.message === "Choose a client before saving an invoice") {
        setNotifications([{ id: Date.now().toString(), text: error.message, time: "Just now", unread: true }, ...notifications]);
        return;
      }
      setInvoices([inv, ...invoices]);
      setNotifications([{ id: Date.now().toString(), text: "Invoice saved locally. It will sync when Neon is available.", time: "Just now", unread: true }, ...notifications]);
    }
    setCurrentPage("invoices");
    setNewInvoice({
      number:`INV-2026-${String(invoices.length+2).padStart(3,"0")}`,
      date:new Date().toISOString().split("T")[0],
      dueDate:new Date(Date.now()+30*86400000).toISOString().split("T")[0],
      placeOfSupply:"27-Maharashtra",
      items:[{id:"1", name:"", hsn:"", qty:1, unit:"Nos", rate:0, discount:0, gst:18}],
      amountPaid:0, clientId:"", clientName:"", status:"Draft"
    });
  };

  // theme classes
  const bgMain = isDark ? "bg-[#1d2028]" : "bg-[#f5f6f8]";
  const bgCard = isDark ? "bg-[#272b35] border-[#363b48]" : "bg-white border-[#e4e7ec]";
  const bgSidebar = isDark ? "bg-[#222630] border-[#363b48]" : "bg-[#fbfbfc] border-[#e4e7ec]";
  const textMain = isDark ? "text-[#f2f4f7]" : "text-slate-800";
  const textMuted = isDark ? "text-[#abb2bf]" : "text-slate-500";
  const borderC = isDark ? "border-[#23233a]" : "border-slate-200";
  const inputCls = isDark ? "bg-[#303540] border-[#424958] text-[#f2f4f7] placeholder-[#9ca4b2]" : "bg-white border-[#e1e5eb] text-slate-800 placeholder-slate-400";
  const logout = () => {
    localStorage.removeItem("zootechx_token");
    localStorage.removeItem("zootechx_user");
    setIsLoggedIn(false);
    setUserRole("");
  };
  const exportCsv = (filename: string, rows: Array<Record<string, string | number>>) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const content = [headers.join(","), ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };
if (authChecking) {
  return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Checking your session…</div>;
}
if (!isLoggedIn) {
  return (
    <Login
      onLoginSuccess={(token, user) => {
        setIsLoggedIn(true);
        setUserRole(user.role);
      }}
    />
  );
}
if (userRole === "SALES") {
  return <SalesDashboard onLogout={logout} />;
}
if (userRole === "DEVELOPER") {
  return <DeveloperWorkspace onLogout={logout} />;
}
if (userRole === "SUB_ADMIN") {
  return (
    <SubAdminDashboard
      onLogout={logout}
    />
  );
}
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className={`premium-dashboard h-[100dvh] min-h-screen overflow-hidden font-sans antialiased flex ${bgMain} ${textMain} transition-colors duration-300`}>
      

      {/* SIDEBAR */}
      <aside className={`w-[260px] shrink-0 hidden lg:flex flex-col ${bgSidebar} border-r h-[100dvh] z-10`}>
        <div className="p-5 border-b border-inherit flex items-center gap-3 relative">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-[18px] shadow-[0_0_20px_rgba(99,102,241,0.35)]">Z</div>
            <div className="absolute -top-1 -right-1 h-[10px] w-[10px]">
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
              <div className="relative h-[8px] w-[8px] rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0f0f1a]" />
            </div>
          </div>
          <div>
            <div className="font-bold leading-none text-[15px] flex items-center gap-1.5">ZootechX.ai <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"/></div>
            <div className={`text-[11px] ${textMuted} mono flex items-center gap-1`}><span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 animate-pulse"/>ERP OS • v2.6</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id:"dashboard", label:"Dashboard", icon:LayoutDashboard },
            { id:"leads", label:"Leads", icon:UserPlus, badge:activeLeads.length },
            { id:"followups", label:"Follow-ups", icon:BellRing, badge:overdueFollow, badgeColor:"bg-red-500" },
            { id:"invoices", label:"Invoices", icon:FileText },
            { id:"invoices/new", label:"Create Invoice", icon:Plus, isNew:true },
            { id:"quotations", label:"Quotations", icon:FileQuestion },
            { id:"clients", label:"Clients", icon:Users },
            { id:"developers", label:"Developers & Projects", icon:Briefcase },
            
            { id:"payments", label:"Payments", icon:CreditCard },
            { id:"expenses", label:"Expenses", icon:Calculator },
          ].map(item=>{
            const active = currentPage===item.id;
            return (
              <button key={item.id} onClick={()=> setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all ${active ? (isDark ? "bg-[#1c1c2e] text-white border border-[#2a2a40]" : "bg-slate-900 text-white shadow") : `${textMuted} hover:${isDark?"bg-[#1a1a2a] text-white":"bg-slate-100 text-slate-900"}`}`}>
                <item.icon size={18} className={item.isNew ? "text-violet-500" : ""} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge ? <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${item.badgeColor||"bg-indigo-600 text-white"}`}>{item.badge}</span> : null}
                {item.isNew ? <span className="text-[10px] bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-1.5 py-0.5 rounded-full">NEW</span> : null}
              </button>
            )
          })}
        </nav>
        <div className={`p-3 border-t ${borderC}`}>


          <button onClick={()=> setCurrentPage("settings")} className={`mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] ${textMuted} hover:bg-slate-100 dark:hover:bg-[#1a1a2a]`}><Settings size={18}/>Settings</button>
          <button onClick={logout} className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-red-400 hover:bg-red-500/10 transition"><LogOut size={18}/>Log out</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        {/* HEADER */}
        <header className={`h-[64px] sticky top-0 z-20 flex items-center gap-3 px-4 lg:px-6 border-b backdrop-blur-xl ${isDark?"bg-[#0f0f1a]/80 border-[#23233a]":"bg-white/80 border-slate-200"} relative`}>
          {/* animated gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
            <div className="h-full w-full" style={{background:'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #6366f1)', backgroundSize:'200% 100%', animation:'gradient-move 3s linear infinite'}}/>
          </div>
          {/* mobile menu */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="relative">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold">Z</div>
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0f0f1a]"/>
            </div>
            <span className="font-bold text-[14px] flex items-center gap-1">ZootechX.ai <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/></span>
          </div>

          <div ref={searchContainerRef} className="hidden lg:flex items-center gap-2 flex-1 max-w-[420px] relative">
            <Search size={16} className={`absolute left-3 ${textMuted}`} />
            <input value={searchQuery} onFocus={()=> setIsSearchOpen(true)} onChange={e=> { setSearchQuery(e.target.value); setIsSearchOpen(true); }} placeholder="Search leads, clients, invoices…" className={`w-full h-9 pl-9 pr-3 rounded-xl border text-[13px] outline-none ${inputCls}`} />
            {searchQuery && isSearchOpen && (
              <div className={`absolute top-11 left-0 w-full rounded-xl border shadow-xl z-30 max-h-[320px] overflow-auto ${bgCard} ${borderC} p-2`}>
                {searchMatches.leads.length > 0 && <div><div className={`px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest ${textMuted}`}>Leads</div>{searchMatches.leads.map(lead => <button key={lead.id} onClick={()=> { setSelectedLead(lead); setSearchQuery(""); setIsSearchOpen(false); setCurrentPage("leads"); }} className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 hover:${isDark?"bg-[#1c1c2e]":"bg-slate-50"}`}><div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">{lead.avatar}</div><div><div className="text-[13px] font-medium">{lead.name}</div><div className={`text-[11px] ${textMuted}`}>{lead.company || lead.email}</div></div></button>)}</div>}
                {searchMatches.followUps.length > 0 && <div><div className={`px-2 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest ${textMuted}`}>Follow-ups</div>{searchMatches.followUps.map(followUp => <button key={followUp.id} onClick={()=> { setSearchQuery(""); setIsSearchOpen(false); setCurrentPage("followups"); }} className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 hover:${isDark?"bg-[#1c1c2e]":"bg-slate-50"}`}><div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isDark?"bg-[#23233a]":"bg-slate-100"}`}><BellRing size={14}/></div><div><div className="text-[13px] font-medium">{followUp.leadName}</div><div className={`text-[11px] ${textMuted}`}>{followUp.type} · {followUp.company}</div></div></button>)}</div>}
                {searchMatches.clients.length > 0 && <div><div className={`px-2 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest ${textMuted}`}>Clients</div>{searchMatches.clients.map(client => <button key={client.id} onClick={()=> { setSearchQuery(""); setIsSearchOpen(false); setCurrentPage("clients"); }} className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 hover:${isDark?"bg-[#1c1c2e]":"bg-slate-50"}`}><div className="h-8 w-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center"><Users size={14}/></div><div><div className="text-[13px] font-medium">{client.businessName}</div><div className={`text-[11px] ${textMuted}`}>{client.name || client.email}</div></div></button>)}</div>}
                {searchMatches.invoices.length > 0 && <div><div className={`px-2 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest ${textMuted}`}>Invoices</div>{searchMatches.invoices.map(invoice => <button key={invoice.id} onClick={()=> { setSearchQuery(""); setIsSearchOpen(false); setCurrentPage("invoices"); }} className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 hover:${isDark?"bg-[#1c1c2e]":"bg-slate-50"}`}><div className="h-8 w-8 rounded-lg bg-violet-600/10 text-violet-600 flex items-center justify-center"><FileText size={14}/></div><div><div className="text-[13px] font-medium">{invoice.clientName}</div><div className={`text-[11px] ${textMuted}`}>{invoice.number} · ₹{invoice.total.toLocaleString()}</div></div></button>)}</div>}
                {searchResultCount===0 && <div className={`p-3 text-[13px] ${textMuted}`}>No matching leads, follow-ups, clients, or invoices</div>}
              </div>
            )}
          </div>

          <div className="flex-1 lg:hidden" />

          <div className="flex items-center gap-2">
            {/* New dropdown */}
            <div className="relative">
              <button onClick={()=> setNewDropdownOpen(!newDropdownOpen)} className={`shine-btn h-9 px-3.5 rounded-xl border flex items-center gap-2 text-[13px] font-medium ${isDark?"bg-white text-black border-white":"bg-slate-900 text-white border-slate-900"} shadow hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all`}>
                <Plus size={16}/> <span className="hidden sm:inline">New</span> <ChevronDown size={14}/>
              </button>
              {newDropdownOpen && (
                <div className={`absolute right-0 top-11 w-[260px] rounded-2xl shadow-xl border p-1.5 z-40 ${bgCard}`}>
                  {[
                    { label:"New Invoice", desc:"Create GST invoice", icon:FileText, action:()=> { setCurrentPage("invoices/new"); setNewDropdownOpen(false);} },
                    { label:"New Lead", desc:"Add potential client", icon:UserPlus, action:()=> { setShowAddLead(true); setNewDropdownOpen(false);} },
                    { label:"Follow Up", desc:"Schedule follow-up", icon:BellRing, action:()=> { setShowFollowUpModal(true); setNewDropdownOpen(false);} },
                    { label:"AI Generate Invoice", desc:"Auto from conversation", icon:Wand2, action:()=> { setCurrentPage("invoices/new"); setNewDropdownOpen(false);} },
                  ].map(i=> (
                    <button key={i.label} onClick={i.action} className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:${isDark?"bg-[#1c1c2e]":"bg-slate-50"}`}>
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isDark?"bg-[#23233a]":"bg-slate-100"}`}><i.icon size={16}/></div>
                      <div><div className="text-[13px] font-medium">{i.label}</div><div className={`text-[11px] ${textMuted}`}>{i.desc}</div></div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={toggleTheme} className={`h-10 w-10 rounded-xl border flex items-center justify-center transition ${bgCard} hover:scale-105`}>
              {isDark ? <Sun size={18}/> : <Moon size={18}/>}
            </button>

            <div className="relative">
              <button onClick={()=> { setNotifOpen(!notifOpen); setNotificationTab("unread"); }} className={`h-10 w-10 rounded-xl border flex items-center justify-center relative ${bgCard}`}>
                <Bell size={18}/>
                {notifications.filter(n=> n.unread).length>0 && <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{notifications.filter(n=> n.unread).length}</span>}
              </button>
              {notifOpen && (
                <div className={`absolute right-0 top-12 w-[360px] rounded-2xl border shadow-xl z-40 ${bgCard} overflow-hidden`}>
                  <div className={`p-3.5 border-b ${borderC}`}><div className="flex items-center justify-between"><div className="font-semibold text-[14px]">Notifications</div>{notificationTab === "unread" && <button onClick={()=> void markAllNotificationsRead()} className="text-[11px] text-indigo-500 hover:underline">Mark all as read</button>}</div><div className="mt-3 flex gap-4 text-[12px] font-medium"><button onClick={()=> setNotificationTab("unread")} className={notificationTab === "unread" ? "text-indigo-500" : textMuted}>Unread</button><button onClick={()=> setNotificationTab("all")} className={notificationTab === "all" ? "text-indigo-500" : textMuted}>All</button></div></div>
                  <div className="max-h-[360px] overflow-auto">
                    {bellNotifications.map(n=> (
                      <div key={n.id} className={`p-3.5 flex gap-3 border-b last:border-0 ${borderC} ${n.unread ? (isDark?"bg-[#1a1a2e]":"bg-white") : (isDark?"bg-[#11111b]":"bg-slate-50")}`}>
                        <div className={`h-2 w-2 mt-2 rounded-full ${n.unread?"bg-indigo-600":"bg-transparent"}`} />
                        <div className="flex-1"><div className="text-[13px]">{n.text}</div><div className={`text-[11px] ${textMuted} mt-1`}>{n.time}</div>{n.unread && <button onClick={()=> void markNotificationRead(n.id)} className="mt-1.5 text-[11px] text-indigo-500 hover:underline">Mark as read</button>}</div>
                      </div>
                    ))}
                    {bellNotifications.length === 0 && <div className={`p-8 text-center text-[12px] ${textMuted}`}>{notificationTab === "unread" ? "You’re all caught up" : "No notifications"}</div>}
                  </div>
                  {notificationTab === "all" && <div className={`border-t p-3 ${borderC}`}><button onClick={()=> void clearReadNotifications()} className={`w-full text-center text-[11px] ${textMuted} hover:text-red-500`}>Clear all read</button></div>}
                </div>
              )}
            </div>

            <div className={`h-9 w-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-[12px] font-bold`}>RR</div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 pb-20 lg:p-6">
          {/* DASHBOARD */}
          {currentPage==="dashboard" && (
            <DashboardPage>
            <div className="space-y-5 max-w-[1600px] mx-auto dashboard-reference">
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }} className="flex flex-wrap items-center justify-between gap-4">
                <div><h1 className="text-[25px] font-bold tracking-tight">Dashboard</h1><p className={`mt-1 text-[13px] ${textMuted}`}>Overview of your CRM performance.</p></div>
                <button onClick={()=> setShowAddLead(true)} className="flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-[13px] font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5"><Plus size={16}/>Add lead</button>
              </motion.section>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {[
                  { label:"Total Leads", value:kpis.total, change:"+12%", up:true, icon:UserPlus, color:"from-indigo-600 to-violet-600" },
                  { label:"Total Invoiced", value:`₹${(kpis.totalInvoiced/100000).toFixed(1)}L`, change:"+8.2%", up:true, icon:CreditCard, color:"from-emerald-600 to-teal-600" },
                  { label:"Pending", value:kpis.pending, change:"-2", up:false, icon:Clock, color:"from-amber-500 to-orange-500" },
                  { label:"Overdue", value:kpis.overdue, change:"+3", up:false, icon:AlertCircle, color:"from-red-500 to-pink-500" },
                ].map(k=> (
                  <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:.3 }} key={k.label} className={`dashboard-stat rounded-xl border p-4 ${bgCard}`}>
                    <div className={`mb-3 h-[3px] w-full rounded-full bg-gradient-to-r ${k.color}`}/>
                    <div className="flex items-end justify-between gap-3"><div><div className="text-[25px] font-bold leading-none">{k.value}</div><div className={`mt-2 text-[11px] font-medium ${textMuted}`}>{k.label}</div></div><div className={`mb-0.5 flex items-center gap-1 text-[11px] font-semibold ${k.up?"text-emerald-600":"text-red-500"}`}>{k.up?<TrendingUp size={13}/>:<TrendingDown size={13}/>}{k.change}</div></div>
                  </motion.div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                <div className={`dashboard-panel rounded-xl border p-5 ${bgCard}`}><div className="mb-4 flex items-center justify-between"><div className="font-semibold text-[14px]">Lead Pipeline</div><button onClick={()=> setCurrentPage("leads")} className={`text-[11px] ${textMuted}`}>View leads</button></div><div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={pipelineData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={isDark?"#23233a":"#e2e8f0"} horizontal={false}/><XAxis type="number"/><YAxis dataKey="name" type="category" width={80}/><Tooltip/><Bar dataKey="value" fill="#6366f1" radius={[0,8,8,0]}/></BarChart></ResponsiveContainer></div></div>
                <div className={`dashboard-panel rounded-xl border p-5 ${bgCard}`}><div className="font-semibold text-[14px] mb-4">Revenue Overview</div><div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2}/></AreaChart></ResponsiveContainer></div></div>
                <div className={`dashboard-panel rounded-xl border p-5 ${bgCard}`}><div className="font-semibold text-[14px] mb-4">Invoice Status</div><div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" innerRadius={50} outerRadius={80}>{statusData.map((entry,index)=><Cell key={index} fill={entry.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></div>
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                <div className={`dashboard-panel rounded-xl border ${bgCard} overflow-hidden`}>
                  <div className={`p-4 flex items-center justify-between border-b ${borderC}`}><div className="font-semibold text-[14px]">Follow-ups Today • {todayFollowUps.length}</div><button onClick={()=> setCurrentPage("followups")} className={`text-[12px] ${textMuted} hover:underline`}>View All</button></div>
                  <div className="divide-y divide-inherit">
                    {todayFollowUps.slice(0,4).map(f=> (
                      <div key={f.id} className="p-3.5 flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isDark?"bg-[#23233a]":"bg-slate-100"}`}><Phone size={14}/></div>
                        <div className="flex-1 min-w-0"><div className="text-[13px] font-medium truncate">{f.leadName} • {f.type}</div><div className={`text-[11px] ${textMuted} truncate`}>{f.time} • {f.property}</div></div>
                        <button onClick={()=> void handleCompleteFollowUp(f)} className="h-7 px-2.5 rounded-lg bg-emerald-600 text-white text-[11px] font-medium flex items-center gap-1"><Check size={12}/>Done</button>
                      </div>
                    ))}
                    {todayFollowUps.length===0 && <div className={`p-6 text-center text-[13px] ${textMuted}`}>No follow-ups today 🎉</div>}
                  </div>
                </div>

                <div className={`dashboard-panel rounded-xl border ${bgCard} overflow-hidden`}>
                  <div className={`p-4 border-b ${borderC} font-semibold text-[14px]`}>Recent Leads</div>
                  <div className="divide-y divide-inherit">
                    {leads.slice(0,4).map(l=> (
                      <div key={l.id} className="p-3.5 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">{l.avatar}</div>
                        <div className="flex-1 min-w-0"><div className="text-[13px] font-medium truncate">{l.name}</div><div className={`text-[11px] ${textMuted} truncate`}>{l.company} • {l.location}</div></div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${l.status==="New"?"bg-blue-500/10 text-blue-600 border-blue-500/20": l.status==="Follow-up"?"bg-amber-500/10 text-amber-600 border-amber-500/20":"bg-slate-500/10 text-slate-600"}`}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
            </DashboardPage>
          )}

          {/* LEADS */}
          {currentPage==="leads" && (
            <LeadsPage>
            <div className="max-w-[1600px] mx-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h1 className="text-[22px] font-bold">Leads</h1><p className={`text-[13px] ${textMuted}`}>Track and manage potential clients</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => exportCsv("zootechx-leads.csv", visibleLeads.map((lead) => ({ Name: lead.name, Company: lead.company, Email: lead.email, Phone: lead.phone, Status: lead.status, Source: lead.source })))} className={`h-9 px-3 rounded-xl border text-[13px] flex items-center gap-2 ${bgCard}`}><Download size={16}/>Export</button>
                  <button onClick={()=> setShowAddLead(true)} className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-medium flex items-center gap-2"><Plus size={16}/>Add Lead</button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label:"Total Leads", value:activeLeads.length },
                  { label:"New Leads", value:leads.filter(l=> l.status==="New").length },
                  { label:"Follow-ups Today", value:todayFollowUps.length },
                  { label:"Converted", value:leads.filter(l=> l.status==="Converted").length },
                ].map(c=> (
                  <div key={c.label} className={`rounded-2xl border p-4 ${bgCard}`}><div className={`text-[11px] ${textMuted} uppercase tracking-widest`}>{c.label}</div><div className="text-[22px] font-bold mt-1">{c.value}</div></div>
                ))}
              </div>

              <div className={`rounded-2xl border overflow-hidden ${bgCard}`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead className={`${isDark?"bg-[#0f0f1a]":"bg-slate-50"} border-b ${borderC} text-[11px] ${textMuted} uppercase tracking-widest`}>
                      <tr><th className="text-left p-3 font-medium">Lead</th><th className="text-left p-3 font-medium">Company</th><th className="text-left p-3 font-medium">Contact</th><th className="text-left p-3 font-medium">Property Interest</th><th className="text-left p-3 font-medium">Source</th><th className="text-left p-3 font-medium">Assigned</th><th className="text-left p-3 font-medium">Priority</th><th className="text-left p-3 font-medium">Status</th><th className="text-left p-3 font-medium">Next Follow-up</th><th className="text-left p-3 font-medium">Actions</th></tr>
                    </thead>
                    <tbody className={`divide-y ${borderC}`}>
                      {visibleLeads.map(l=> (
                        <tr key={l.id} className={`hover:${isDark?"bg-[#1a1a2e]":"bg-slate-50"} transition`}>
                          <td className="p-3 flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-[11px] font-bold">{l.avatar}</div><span className="text-[13px] font-medium">{l.name}</span></td>
                          <td className="p-3 text-[13px]">{l.company}</td>
                          <td className="p-3 text-[12px]"><div>{l.phone}</div><div className={`${textMuted} text-[11px] truncate max-w-[140px]`}>{l.email}</div></td>
                          <td className="p-3 text-[12px]">{l.propertyType} • {l.location}</td>
                          <td className="p-3 text-[12px]"><span className={`px-2 py-1 rounded-full border text-[11px] ${bgCard}`}>{l.source}</span></td>
                          <td className="p-3 text-[12px]">{l.assignedTo}</td>
                          <td className="p-3"><span className={`inline-flex items-center gap-1 text-[11px] ${l.priority==="High"?"text-red-600": l.priority==="Medium"?"text-amber-600":"text-zinc-500"}`}><span className={`h-2 w-2 rounded-full ${l.priority==="High"?"bg-red-500": l.priority==="Medium"?"bg-amber-500":"bg-zinc-400"}`}/>{l.priority}</span></td>
                          <td className="p-3"><select value={l.status} onChange={e=> void handleLeadStatusChange(l, e.target.value as LeadStatus)} aria-label={`Status for ${l.name}`} className={`h-7 rounded-full border px-2 text-[11px] outline-none ${
                            l.status==="New"?"bg-blue-500/10 text-blue-600 border-blue-500/20":
                            l.status==="Contacted"?"bg-slate-500/10 text-slate-600 border-slate-500/20":
                            l.status==="Follow-up"?"bg-amber-500/10 text-amber-600 border-amber-500/20":
                            l.status==="Qualified"?"bg-violet-500/10 text-violet-600 border-violet-500/20":
                            l.status==="Negotiation"?"bg-orange-500/10 text-orange-600 border-orange-500/20":"bg-red-500/10 text-red-600 border-red-500/20"
                          }`}>
                            {(["New", "Contacted", "Follow-up", "Qualified", "Negotiation", "Lost", "Converted"] as LeadStatus[]).map(status => <option key={status} value={status}>{status}</option>)}
                          </select></td>
                          <td className="p-3 text-[12px]">{new Date(l.nextFollowUp).toLocaleDateString()}</td>
                          <td className="p-3 flex items-center gap-1">
                            <button onClick={()=> setSelectedLead(l)} className={`h-7 w-7 rounded-lg border flex items-center justify-center ${bgCard}`}><Eye size={14}/></button>
                            <button onClick={()=> void handleConvertLead(l)} className="h-7 px-2 rounded-lg bg-emerald-600 text-white text-[11px]">Convert</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            </LeadsPage>
          )}

          {/* FOLLOW-UPS */}
          {currentPage==="followups" && (
            <FollowUpsPage>
            <div className="max-w-[1600px] mx-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h1 className="text-[22px] font-bold">Follow-ups</h1><p className={`text-[13px] ${textMuted}`}>Stay on top of conversations</p></div>
                <button onClick={()=> setShowFollowUpModal(true)} className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-medium flex items-center gap-2"><Plus size={16}/>Schedule Follow-up</button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label:"Today", value:todayFollowUps.length },
                  { label:"Upcoming", value:upcomingFollow },
                  { label:"Overdue", value:overdueFollow, danger:true },
                  { label:"Completed", value:completedFollow },
                ].map(c=> (
                  <div key={c.label} className={`rounded-2xl border p-4 ${bgCard} ${c.danger && c.value>0 ? "ring-1 ring-red-500/30" : ""}`}><div className={`text-[11px] ${textMuted} uppercase tracking-widest`}>{c.label}</div><div className={`text-[22px] font-bold mt-1 ${c.danger && c.value>0?"text-red-500":""}`}>{c.value}</div></div>
                ))}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {["All","Today","Upcoming","Overdue","Completed"].map(tab=> (
                  <button key={tab} onClick={()=> setFollowUpFilter(tab)} className={`h-8 px-3 rounded-full border text-[13px] whitespace-nowrap ${followUpFilter===tab? "bg-slate-900 text-white dark:bg-white dark:text-black border-transparent" : bgCard}`}>{tab}</button>
                ))}
              </div>

              <div className={`rounded-2xl border overflow-hidden ${bgCard}`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className={`${isDark?"bg-[#0f0f1a]":"bg-slate-50"} border-b ${borderC} text-[11px] ${textMuted} uppercase tracking-widest`}><tr><th className="text-left p-3">Date</th><th className="text-left p-3">Time</th><th className="text-left p-3">Lead/Client</th><th className="text-left p-3">Property</th><th className="text-left p-3">Type</th><th className="text-left p-3">Assigned</th><th className="text-left p-3">Priority</th><th className="text-left p-3">Status</th><th className="text-left p-3">Actions</th></tr></thead>
                    <tbody className={`divide-y ${borderC}`}>
                      {filteredFollowUps.map(f=> (
                        <tr key={f.id} className={`hover:${isDark?"bg-[#1a1a2e]":"bg-slate-50"}`}>
                          <td className="p-3 text-[13px]">{f.date}</td>
                          <td className="p-3 text-[13px]">{f.time}</td>
                          <td className="p-3 text-[13px] font-medium">{f.leadName}<div className={`text-[11px] ${textMuted}`}>{f.company}</div></td>
                          <td className="p-3 text-[12px]">{f.property}</td>
                          <td className="p-3 text-[12px] flex items-center gap-1"><span className={`h-6 w-6 rounded-lg flex items-center justify-center ${isDark?"bg-[#23233a]":"bg-slate-100"}`}>{f.type==="Phone Call"?<Phone size={12}/>: f.type==="WhatsApp"?<MessageCircle size={12}/>: f.type==="Email"?<Mail size={12}/>:<Calendar size={12}/>}</span>{f.type}</td>
                          <td className="p-3 text-[12px]">{f.assignedTo}</td>
                          <td className="p-3 text-[11px]">{f.priority}</td>
                          <td className="p-3"><span className={`text-[11px] px-2 py-1 rounded-full border ${f.status==="Overdue"?"bg-red-500/10 text-red-600 border-red-500/20": f.status==="Completed"?"bg-emerald-500/10 text-emerald-600 border-emerald-500/20":"bg-amber-500/10 text-amber-600 border-amber-500/20"}`}>{f.status}</span></td>
                          <td className="p-3 flex gap-1">
                            <button onClick={()=> void handleCompleteFollowUp(f)} className="h-7 px-2 rounded-lg bg-emerald-600 text-white text-[11px]">Complete</button>
                            <button onClick={()=> void handleDeleteFollowUp(f)} className={`h-7 w-7 rounded-lg border flex items-center justify-center ${bgCard}`}><Trash2 size={12}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            </FollowUpsPage>
          )}

          {/* INVOICES LIST */}
          {currentPage==="invoices" && (
            <InvoicesPage>
            <div className="max-w-[1600px] mx-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h1 className="text-[22px] font-bold">Invoices</h1><p className={`text-[13px] ${textMuted} flex items-center gap-2`}><Sparkles size={12} className="text-violet-500"/>AI-powered invoicing • GST auto-calc</p></div>
                <div className="flex gap-2"><button onClick={() => setSearchQuery("")} className={`h-9 px-3 rounded-xl border text-[13px] flex items-center gap-2 ${bgCard}`}><Filter size={14}/>Clear Search</button><button onClick={() => exportCsv("zootechx-invoices.csv", invoices.map((invoice) => ({ Invoice: invoice.number, Client: invoice.clientName, Date: invoice.date, Total: invoice.total, Status: invoice.status })))} className={`h-9 px-3 rounded-xl border text-[13px] flex items-center gap-2 ${bgCard}`}><Download size={14}/>Export</button><button onClick={()=> setCurrentPage("invoices/new")} className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-medium flex items-center gap-2"><Plus size={16}/>Create Invoice</button></div>
              </div>
              <div className={`rounded-2xl border overflow-hidden ${bgCard}`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className={`${isDark?"bg-[#0f0f1a]":"bg-slate-50"} border-b ${borderC} text-[11px] ${textMuted} uppercase tracking-widest`}><tr><th className="text-left p-3">Invoice No</th><th className="text-left p-3">Client</th><th className="text-left p-3">Date</th><th className="text-left p-3">Amount</th><th className="text-left p-3">GST</th><th className="text-left p-3">Status</th><th className="text-left p-3">Actions</th></tr></thead>
                    <tbody className={`divide-y ${borderC}`}>
                      {invoices.map(inv=> (
                        <tr key={inv.id} className={`hover:${isDark?"bg-[#1a1a2e]":"bg-slate-50"}`}>
                          <td className="p-3 text-[13px] font-medium mono">{inv.number}</td>
                          <td className="p-3 text-[13px]">{inv.clientName}</td>
                          <td className="p-3 text-[12px]">{inv.date}</td>
                          <td className="p-3 text-[13px] font-semibold">₹{inv.total.toLocaleString()}</td>
                          <td className="p-3 text-[12px]">₹{inv.gstTotal.toLocaleString()}</td>
                          <td className="p-3"><span className={`text-[11px] px-2 py-1 rounded-full border ${inv.status==="Paid"?"bg-emerald-500/10 text-emerald-600 border-emerald-500/20": inv.status==="Sent"?"bg-blue-500/10 text-blue-600 border-blue-500/20": inv.status==="Overdue"?"bg-red-500/10 text-red-600 border-red-500/20":"bg-slate-500/10 text-slate-600"}`}>{inv.status}</span></td>
                          <td className="p-3 flex gap-1"><button onClick={()=> setPreviewInvoice(inv)} className={`h-7 w-7 rounded-lg border flex items-center justify-center ${bgCard}`}><Eye size={14}/></button><button onClick={()=> { setNewInvoice({...inv, items:inv.items}); setCurrentPage("invoices/new"); }} className={`h-7 w-7 rounded-lg border flex items-center justify-center ${bgCard}`}><Edit3 size={14}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            </InvoicesPage>
          )}

          {/* CREATE NEW INVOICE PAGE - DEDICATED */}
          {currentPage==="invoices/new" && (
            <CreateInvoicePage>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="max-w-[1400px] mx-auto"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={()=> setCurrentPage("invoices")} aria-label="Back to invoices" className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-transform hover:-translate-x-0.5 ${bgCard}`}><ArrowLeft size={16}/></button>
                  <div><h1 className="text-[22px] font-bold tracking-tight">Create invoice</h1><p className={`text-[13px] ${textMuted}`}>Add customer details, items, and payment terms.</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=> handleSaveInvoice(true)} className={`h-10 px-4 rounded-xl border text-[13px] font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm ${bgCard}`}><Save size={14} className="inline mr-1.5"/>Save draft</button>
                  <button onClick={()=> setPreviewMode(!previewMode)} className={`h-10 px-4 rounded-xl border text-[13px] font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm ${bgCard}`}><Eye size={14} className="inline mr-1.5"/>{previewMode?"Edit invoice":"Preview"}</button>
                  <button onClick={()=> handleSaveInvoice(false)} className="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20"><Save size={14}/>Save & send</button>
                </div>
              </div>

              {previewMode ? (
                <motion.div initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.24 }} className={`rounded-2xl border p-6 lg:p-8 max-w-[800px] mx-auto ${isDark?"bg-white text-black":"bg-white text-black"} shadow-xl`}>
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3"><div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold">Z</div><div><div className="font-bold">ZootechX.ai</div><div className="text-[11px] text-slate-500">AI-powered systems studio • GSTIN: 27ABCDE1234F1Z5</div><div className="text-[11px] text-slate-500">Mumbai, Maharashtra • zootechx.ai</div></div></div>
                    <div className="text-right"><div className="text-[20px] font-bold">TAX INVOICE</div><div className="mono text-[12px] mt-1">{newInvoice.number}</div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mt-6 text-[12px]">
                    <div><div className="font-semibold">Bill To</div><div className="mt-1 font-medium">{newInvoice.clientName||"Select client"}</div><div className="text-slate-500">{clients.find(c=> c.id===newInvoice.clientId)?.address||"Address"}</div><div className="text-slate-500">State: {newInvoice.placeOfSupply}</div></div>
                    <div className="text-right"><div>Invoice Date: {newInvoice.date}</div><div>Due Date: {newInvoice.dueDate}</div><div>Place of Supply: {newInvoice.placeOfSupply}</div></div>
                  </div>
                  <table className="w-full mt-6 text-[12px] border"><thead className="bg-slate-100"><tr><th className="p-2 text-left">Item</th><th className="p-2">HSN</th><th className="p-2">Qty</th><th className="p-2">Rate</th><th className="p-2">GST%</th><th className="p-2 text-right">Amount</th></tr></thead><tbody>{(newInvoice.items as InvoiceItem[]).map(it=> (<tr key={it.id} className="border-t"><td className="p-2">{it.name||"—"}</td><td className="p-2">{it.hsn}</td><td className="p-2 text-center">{it.qty}</td><td className="p-2 text-right">₹{it.rate}</td><td className="p-2 text-center">{it.gst}%</td><td className="p-2 text-right">₹{(it.qty*it.rate*(1-it.discount/100)*(1+it.gst/100)).toFixed(0)}</td></tr>))}</tbody></table>
                  <div className="flex justify-end mt-4"><div className="w-[260px] text-[12px] space-y-1">
                    {(() => { const calc = calculateInvoiceTotals(newInvoice.items as InvoiceItem[], newInvoice.placeOfSupply||""); return (<><div className="flex justify-between"><span>Subtotal</span><span>₹{calc.subtotal.toFixed(0)}</span></div><div className="flex justify-between"><span>CGST</span><span>₹{calc.cgst.toFixed(0)}</span></div><div className="flex justify-between"><span>SGST</span><span>₹{calc.sgst.toFixed(0)}</span></div><div className="flex justify-between"><span>IGST</span><span>₹{calc.igst.toFixed(0)}</span></div><div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Grand Total</span><span>₹{calc.total.toFixed(0)}</span></div></>); })()}
                  </div></div>
                  <div className="mt-8 flex justify-between items-end"><div className="text-[11px] text-slate-500">Amount in words: {(() => { const t = calculateInvoiceTotals(newInvoice.items as InvoiceItem[], newInvoice.placeOfSupply||"").total; return `${t.toLocaleString()} Rupees Only`; })()}<div className="mt-4">Terms: Payment within 15 days • Late fee 1.5%</div></div><div className="text-center"><div className="h-12 w-24 border-b border-slate-400"/><div className="text-[11px] mt-1">Authorized Signature</div></div></div>
                </motion.div>
              ) : (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                  {/* LEFT */}
                  <div className="space-y-4">
                    <div className={`rounded-2xl border p-5 lg:p-6 shadow-sm ${bgCard}`}>
                      <div className="mb-5"><div className="font-semibold text-[15px]">Invoice details</div><div className={`mt-1 text-[12px] ${textMuted}`}>Set the document number, dates, customer, and tax location.</div></div>
                      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        <div><label className={`text-[11px] ${textMuted}`}>Invoice Number</label><input value={newInvoice.number} onChange={e=> setNewInvoice({...newInvoice, number:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] mono ${inputCls}`}/></div>
                        <div><label className={`text-[11px] ${textMuted}`}>Invoice Date</label><input type="date" value={newInvoice.date} onChange={e=> setNewInvoice({...newInvoice, date:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div>
                        <div><label className={`text-[11px] ${textMuted}`}>Due Date</label><input type="date" value={newInvoice.dueDate} onChange={e=> setNewInvoice({...newInvoice, dueDate:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div>
                        <div><label className={`text-[11px] ${textMuted}`}>Place of Supply</label><select value={newInvoice.placeOfSupply} onChange={e=> setNewInvoice({...newInvoice, placeOfSupply:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>27-Maharashtra</option><option>29-Karnataka</option><option>07-Delhi</option><option>09-Uttar Pradesh</option><option>24-Gujarat</option><option>36-Telangana</option></select></div>
                        <div className="sm:col-span-2 xl:col-span-4"><label className={`text-[11px] ${textMuted}`}>Customer *</label><select value={newInvoice.clientId} onChange={e=> { const c = clients.find(x=> x.id===e.target.value); setNewInvoice({...newInvoice, clientId:e.target.value, clientName:c?.businessName||""}); }} className={`mt-1 w-full h-10 rounded-xl border px-3 text-[13px] ${inputCls}`}><option value="">Select client</option>{clients.map(c=> <option key={c.id} value={c.id}>{c.businessName}</option>)}</select></div>
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-5 lg:p-6 shadow-sm ${bgCard}`}>
                      <div className="mb-5"><div className="font-semibold text-[15px]">Line items</div><div className={`mt-1 text-[12px] ${textMuted}`}>Add the products or services you are billing for.</div></div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                          <thead className={`text-[11px] ${textMuted} uppercase tracking-widest border-b ${borderC}`}><tr><th className="text-left p-2 font-medium">Item</th><th className="text-left p-2 font-medium">HSN/SAC</th><th className="text-left p-2 font-medium">Qty</th><th className="text-left p-2 font-medium">Unit</th><th className="text-left p-2 font-medium">Rate</th><th className="text-left p-2 font-medium">Disc%</th><th className="text-left p-2 font-medium">GST%</th><th className="text-left p-2 font-medium">Amount</th><th className="p-2"></th></tr></thead>
                          <tbody>
                            {(newInvoice.items as InvoiceItem[]).map((it, idx)=> (
                              <tr key={it.id} className={`border-b ${borderC}`}>
                                <td className="p-2"><input value={it.name} onChange={e=> { const items=[...(newInvoice.items as InvoiceItem[])]; items[idx].name=e.target.value; if(e.target.value.toLowerCase().includes("broker")) items[idx].hsn="9972"; else if(e.target.value.toLowerCase().includes("consult")) items[idx].hsn="9983"; setNewInvoice({...newInvoice, items}); }} placeholder="Item name" className={`w-full h-8 rounded-lg border px-2 text-[13px] ${inputCls}`}/></td>
                                <td className="p-2"><input value={it.hsn} onChange={e=> { const items=[...(newInvoice.items as InvoiceItem[])]; items[idx].hsn=e.target.value; setNewInvoice({...newInvoice, items}); }} className={`w-[80px] h-8 rounded-lg border px-2 text-[12px] mono ${inputCls}`}/></td>
                                <td className="p-2"><input type="number" value={it.qty} onChange={e=> { const items=[...(newInvoice.items as InvoiceItem[])]; items[idx].qty=Number(e.target.value); setNewInvoice({...newInvoice, items}); }} className={`w-[60px] h-8 rounded-lg border px-2 text-[12px] ${inputCls}`}/></td>
                                <td className="p-2"><select value={it.unit} onChange={e=> { const items=[...(newInvoice.items as InvoiceItem[])]; items[idx].unit=e.target.value; setNewInvoice({...newInvoice, items}); }} className={`h-8 rounded-lg border px-1 text-[12px] ${inputCls}`}><option>Nos</option><option>Sqft</option><option>Hours</option></select></td>
                                <td className="p-2"><input type="number" value={it.rate} onChange={e=> { const items=[...(newInvoice.items as InvoiceItem[])]; items[idx].rate=Number(e.target.value); setNewInvoice({...newInvoice, items}); }} className={`w-[90px] h-8 rounded-lg border px-2 text-[12px] ${inputCls}`}/></td>
                                <td className="p-2"><input type="number" value={it.discount} onChange={e=> { const items=[...(newInvoice.items as InvoiceItem[])]; items[idx].discount=Number(e.target.value); setNewInvoice({...newInvoice, items}); }} className={`w-[50px] h-8 rounded-lg border px-2 text-[12px] ${inputCls}`}/></td>
                                <td className="p-2"><select value={it.gst} onChange={e=> { const items=[...(newInvoice.items as InvoiceItem[])]; items[idx].gst=Number(e.target.value); setNewInvoice({...newInvoice, items}); }} className={`h-8 rounded-lg border px-1 text-[12px] ${inputCls}`}><option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option><option value={28}>28%</option></select></td>
                                <td className="p-2 text-[13px] font-medium mono">₹{(it.qty*it.rate*(1-it.discount/100)*(1+it.gst/100)).toFixed(0)}</td>
                                <td className="p-2"><button onClick={()=> { if((newInvoice.items as InvoiceItem[]).length>1) setNewInvoice({...newInvoice, items:(newInvoice.items as InvoiceItem[]).filter((_,i)=> i!==idx)}); }} className={`h-7 w-7 rounded-lg border flex items-center justify-center ${bgCard}`}><X size={12}/></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button onClick={()=> setNewInvoice({...newInvoice, items:[...(newInvoice.items as InvoiceItem[]), {id:Date.now().toString(), name:"", hsn:"", qty:1, unit:"Nos", rate:0, discount:0, gst:18}]})} className={`mt-4 h-9 px-3.5 rounded-xl border text-[12px] font-medium flex items-center gap-1.5 transition-all hover:-translate-y-0.5 hover:shadow-sm ${bgCard}`}><Plus size={13}/>Add line item</button>
                    </div>

                    <div className={`rounded-2xl border p-5 shadow-sm ${bgCard}`}>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><label className={`text-[11px] ${textMuted}`}>Notes</label><textarea placeholder="Notes for client…" className={`mt-1 w-full h-20 rounded-xl border p-3 text-[13px] ${inputCls}`}/></div>
                        <div><label className={`text-[11px] ${textMuted}`}>Terms & Conditions</label><textarea defaultValue="Payment within 15 days. Late fee 1.5% per month. GST as applicable." className={`mt-1 w-full h-20 rounded-xl border p-3 text-[13px] ${inputCls}`}/></div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT STICKY */}
                  <div className="space-y-4 xl:sticky xl:top-[80px] self-start">
                    <div className={`rounded-2xl border p-5 shadow-sm ${bgCard}`}>
                      <div className="font-semibold text-[15px] mb-1">Invoice total</div>
                      <div className={`text-[12px] mb-4 ${textMuted}`}>Updates automatically as you edit.</div>
                      {(() => {
                        const calc = calculateInvoiceTotals(newInvoice.items as InvoiceItem[], newInvoice.placeOfSupply||"");
                        const balance = calc.total - (newInvoice.amountPaid||0);
                        return (
                          <div className="space-y-2 text-[13px]">
                            <div className="flex justify-between"><span className={textMuted}>Subtotal</span><span className="font-medium mono">₹{calc.subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className={textMuted}>CGST</span><span className="font-medium mono">₹{calc.cgst.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className={textMuted}>{calc.igst>0?"IGST":"SGST"}</span><span className="font-medium mono">₹{(calc.igst>0?calc.igst:calc.sgst).toFixed(2)}</span></div>
                            <div className={`flex justify-between pt-3 border-t ${borderC} font-bold text-[15px]`}><span>Grand total</span><span className="mono">₹{calc.total.toFixed(2)}</span></div>
                            <div className="pt-2 space-y-2">
                              <div className="flex justify-between text-[12px]"><span className={textMuted}>Amount Paid</span><input type="number" value={newInvoice.amountPaid} onChange={e=> setNewInvoice({...newInvoice, amountPaid:Number(e.target.value)})} className={`w-[100px] h-7 rounded-lg border px-2 text-[12px] mono ${inputCls}`}/></div>
                              <div className="flex justify-between font-semibold"><span>Balance Due</span><span className={`mono ${balance>0?"text-amber-600":"text-emerald-600"}`}>₹{balance.toFixed(2)}</span></div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className={`rounded-2xl border p-5 shadow-sm ${bgCard}`}>
                      <div className="font-semibold text-[13px] mb-2">Client Info</div>
                      {newInvoice.clientId ? (
                        <div className="text-[12px] space-y-1">
                          <div className="font-medium">{clients.find(c=> c.id===newInvoice.clientId)?.businessName}</div>
                          <div className={textMuted}>{clients.find(c=> c.id===newInvoice.clientId)?.email}</div>
                          <div className={textMuted}>{clients.find(c=> c.id===newInvoice.clientId)?.phone}</div>
                          <div className={textMuted}>GSTIN: {clients.find(c=> c.id===newInvoice.clientId)?.gstin||"Not provided"}</div>
                        </div>
                      ) : <div className={`text-[12px] ${textMuted}`}>Select a customer to auto-fill details</div>}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
            </CreateInvoicePage>
          )}

          {/* QUOTATIONS */}
          {currentPage==="quotations" && (
            <QuotationsPage>
            <div className="max-w-[1200px] mx-auto space-y-4">
              <div className="flex items-center justify-between"><div><h1 className="text-[22px] font-bold">Quotations</h1><p className={`text-[13px] ${textMuted}`}>Manage quotes</p></div><button onClick={()=> setShowCreateQuote(true)} className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-medium flex items-center gap-2"><Plus size={16}/>Create Quotation</button></div>
              <div className={`rounded-2xl border overflow-hidden ${bgCard}`}><table className="w-full"><thead className={`${isDark?"bg-[#0f0f1a]":"bg-slate-50"} border-b ${borderC} text-[11px] ${textMuted} uppercase tracking-widest`}><tr><th className="text-left p-3">Quote ID</th><th className="text-left p-3">Client</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Valid Until</th><th className="text-left p-3">Status</th><th className="text-left p-3">Actions</th></tr></thead><tbody className={`divide-y ${borderC}`}>{quotations.map(q=> <tr key={q.id}><td className="p-3 mono text-[13px]">{q.id}</td><td className="p-3 text-[13px]">{q.clientName}</td><td className="p-3 font-semibold">₹{q.amount.toLocaleString()}</td><td className="p-3 text-[12px]">{q.validUntil}</td><td className="p-3"><span className={`text-[11px] px-2 py-1 rounded-full border ${q.status==="Sent"?"bg-blue-500/10 text-blue-600":"bg-slate-500/10 text-slate-600"}`}>{q.status}</span></td><td className="p-3 flex gap-1"><button onClick={()=> { const c = clients.find(x=> x.businessName===q.clientName); setNewInvoice({ number:`INV-2026-${String(invoices.length+1).padStart(3,"0")}`, date:new Date().toISOString().split("T")[0], dueDate:new Date(Date.now()+30*86400000).toISOString().split("T")[0], placeOfSupply:"27-Maharashtra", items:[{id:"1", name:`Services for ${q.clientName}`, hsn:"9972", qty:1, unit:"Nos", rate:q.amount/1.18, discount:0, gst:18}], amountPaid:0, clientId:c?.id||"", clientName:q.clientName, status:"Draft" }); setCurrentPage("invoices/new"); }} className="h-7 px-2 rounded-lg bg-indigo-600 text-white text-[11px]">Convert to Invoice</button></td></tr>)}</tbody></table></div>
            </div>
            </QuotationsPage>
          )}

          {/* CLIENTS */}
          {currentPage==="clients" && (
            <ClientsPage>
            <div className="max-w-[1200px] mx-auto space-y-4">
              <div className="flex items-center justify-between"><div><h1 className="text-[22px] font-bold">Clients</h1><p className={`text-[13px] ${textMuted}`}>Manage your clients</p></div><button onClick={()=> setShowCreateClient(true)} className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-medium flex items-center gap-2"><Plus size={16}/>Add Client</button></div>
              <div className={`rounded-2xl border overflow-hidden ${bgCard}`}><div className="overflow-x-auto"><table className="w-full min-w-[700px]"><thead className={`${isDark?"bg-[#0f0f1a]":"bg-slate-50"} border-b ${borderC} text-[11px] ${textMuted} uppercase tracking-widest`}><tr><th className="text-left p-3">Business</th><th className="text-left p-3">Contact</th><th className="text-left p-3">GSTIN</th><th className="text-left p-3">State</th><th className="text-left p-3">Credit Limit</th></tr></thead><tbody className={`divide-y ${borderC}`}>{clients.map(c=> <tr key={c.id}><td className="p-3"><div className="font-medium text-[13px]">{c.businessName}</div><div className={`text-[11px] ${textMuted}`}>{c.name}</div></td><td className="p-3 text-[12px]"><div>{c.email}</div><div className={textMuted}>{c.phone}</div></td><td className="p-3 mono text-[11px]">{c.gstin||"—"}</td><td className="p-3 text-[12px]">{c.state}</td><td className="p-3 text-[13px]">₹{c.creditLimit.toLocaleString()}</td></tr>)}</tbody></table></div></div>
            </div>
            </ClientsPage>
          )}

          {currentPage==="developers" && <DeveloperWorkspace admin />}

          {currentPage === "payments" && <PaymentsPage><div className="max-w-[1000px] mx-auto"><h1 className="text-[22px] font-bold mb-5">Payments</h1><div className={`rounded-2xl border overflow-hidden ${bgCard}`}><table className="w-full text-sm"><thead className={`${isDark?"bg-[#0f0f1a]":"bg-slate-50"}`}><tr><th className="p-3 text-left">Invoice</th><th className="p-3 text-left">Method</th><th className="p-3 text-right">Amount</th></tr></thead><tbody>{payments.map(payment => <tr key={payment.id} className={`border-t ${borderC}`}><td className="p-3">{payment.invoice_number}</td><td className="p-3">{payment.method}</td><td className="p-3 text-right font-semibold">₹{Number(payment.amount).toLocaleString()}</td></tr>)}{payments.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500">No payments recorded yet.</td></tr>}</tbody></table></div></div></PaymentsPage>}
          {currentPage === "expenses" && <ExpensesPage><div className="max-w-[1000px] mx-auto"><h1 className="text-[22px] font-bold mb-5">Expenses</h1><div className={`rounded-2xl border overflow-hidden ${bgCard}`}><table className="w-full text-sm"><thead className={`${isDark?"bg-[#0f0f1a]":"bg-slate-50"}`}><tr><th className="p-3 text-left">Expense</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Method</th><th className="p-3 text-right">Amount</th></tr></thead><tbody>{expenses.map(expense => <tr key={expense.id} className={`border-t ${borderC}`}><td className="p-3">{expense.title}</td><td className="p-3">{expense.category}</td><td className="p-3">{expense.payment_method || "—"}</td><td className="p-3 text-right font-semibold">₹{Number(expense.amount).toLocaleString()}</td></tr>)}{expenses.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No expenses recorded yet.</td></tr>}</tbody></table></div></div></ExpensesPage>}
          {currentPage === "settings" && (
            <SettingsPage>
            <div className="max-w-[800px] mx-auto text-center py-20">
              <div className={`h-16 w-16 mx-auto rounded-2xl flex items-center justify-center ${isDark?"bg-[#1c1c2e]":"bg-slate-100"} mb-4`}><Building2 size={28} className={textMuted}/></div>
              <h2 className="text-[20px] font-bold capitalize">{currentPage}</h2><p className={`text-[13px] ${textMuted} mt-2`}>This module is part of ZootechX.ai ERP suite • Coming integrated with AI automation</p>
            </div>
            </SettingsPage>
          )}
        </main>
      </div>

      {/* MOBILE SIDEBAR BOTTOM */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex justify-around py-2 ${isDark?"bg-[#0f0f1a] border-[#23233a]":"bg-white border-slate-200"}`}>
        {[
          { id:"dashboard", icon:LayoutDashboard },
          { id:"leads", icon:UserPlus },
          { id:"followups", icon:BellRing },
          { id:"invoices", icon:FileText },
          { id:"invoices/new", icon:Plus },
        ].map(it=> (
          <button key={it.id} onClick={()=> setCurrentPage(it.id)} className={`h-10 w-10 rounded-xl flex items-center justify-center ${currentPage===it.id?"bg-slate-900 text-white dark:bg-white dark:text-black":""}`}><it.icon size={18}/></button>
        ))}
      </div>

      {/* ADD LEAD MODAL */}
      {showAddLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=> setShowAddLead(false)}/>
          <div className={`relative w-full max-w-[640px] rounded-2xl border shadow-2xl max-h-[90vh] overflow-auto ${bgCard}`}>
            <div className={`sticky top-0 p-5 border-b ${borderC} flex items-center justify-between backdrop-blur-xl ${isDark?"bg-[#14141f]/90":"bg-white/90"}`}><div><div className="font-bold text-[16px]">Add New Lead</div><div className={`text-[12px] ${textMuted}`}>Potential client details</div></div><button onClick={()=> setShowAddLead(false)} className={`h-8 w-8 rounded-xl border flex items-center justify-center ${bgCard}`}><X size={16}/></button></div>
            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="text-[11px] font-medium">Full Name *</label><input value={leadForm.name||""} onChange={e=> setLeadForm({...leadForm, name:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div>
                <div><label className="text-[11px] font-medium">Company</label><input value={leadForm.company||""} onChange={e=> setLeadForm({...leadForm, company:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div>
                <div><label className="text-[11px] font-medium">Email</label><input value={leadForm.email||""} onChange={e=> setLeadForm({...leadForm, email:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div>
                <div><label className="text-[11px] font-medium">Phone *</label><input value={leadForm.phone||""} onChange={e=> setLeadForm({...leadForm, phone:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div>
                <div><label className="text-[11px] font-medium">Property Type</label><select value={leadForm.propertyType} onChange={e=> setLeadForm({...leadForm, propertyType:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>Residential</option><option>Commercial</option><option>Office</option><option>Retail</option><option>Industrial</option><option>Land</option></select></div>
                <div><label className="text-[11px] font-medium">Location</label><select value={leadForm.location} onChange={e=> setLeadForm({...leadForm, location:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>Mumbai</option><option>Thane</option><option>Navi Mumbai</option><option>Andheri</option><option>Bandra</option><option>Tardeo</option><option>Worli</option><option>Lower Parel</option><option>Vashi</option><option>Other</option></select></div>
                <div><label className="text-[11px] font-medium">Budget Min</label><input type="number" value={leadForm.budgetMin||""} onChange={e=> setLeadForm({...leadForm, budgetMin:Number(e.target.value)})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div>
                <div><label className="text-[11px] font-medium">Budget Max</label><input type="number" value={leadForm.budgetMax||""} onChange={e=> setLeadForm({...leadForm, budgetMax:Number(e.target.value)})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div>
                <div><label className="text-[11px] font-medium">Source</label><select value={leadForm.source} onChange={e=> setLeadForm({...leadForm, source:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>Website</option><option>Referral</option><option>Walk-in</option><option>Phone</option><option>WhatsApp</option><option>LinkedIn</option><option>Instagram</option><option>Advertisement</option><option>Other</option></select></div>
                <div><label className="text-[11px] font-medium">Assigned To</label><select value={leadForm.assignedTo} onChange={e=> setLeadForm({...leadForm, assignedTo:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>Aarav</option><option>Priya</option><option>Rohan</option></select></div>
                <div><label className="text-[11px] font-medium">Priority</label><select value={leadForm.priority} onChange={e=> setLeadForm({...leadForm, priority:e.target.value as any})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>High</option><option>Medium</option><option>Low</option></select></div>
                <div><label className="text-[11px] font-medium">Status</label><select value={leadForm.status} onChange={e=> setLeadForm({...leadForm, status:e.target.value as any})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>New</option><option>Contacted</option><option>Follow-up</option><option>Qualified</option><option>Negotiation</option><option>Converted</option><option>Lost</option></select></div>
              </div>
              <div><label className="text-[11px] font-medium">Notes</label><textarea value={leadForm.notes||""} onChange={e=> setLeadForm({...leadForm, notes:e.target.value})} className={`mt-1 w-full h-20 rounded-xl border p-3 text-[13px] ${inputCls}`}/></div>
              <div className={`p-3 rounded-xl border border-amber-500/30 ${isDark?"bg-amber-500/10":"bg-amber-50"}`}>
                <div className="text-[11px] font-semibold text-amber-600 flex items-center gap-1"><Calendar size={12}/>Next Follow-up</div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="flex min-w-0 gap-1"><input ref={addLeadDateRef} type="date" value={leadForm.nextFollowUp? new Date(leadForm.nextFollowUp).toISOString().split("T")[0] : ""} onChange={e=> setLeadForm({...leadForm, nextFollowUp:new Date(e.target.value).toISOString()})} className={`min-w-0 flex-1 h-9 rounded-xl border px-2 text-[12px] ${inputCls}`}/><button type="button" aria-label="Open lead due date calendar" onClick={() => { const picker = addLeadDateRef.current as (HTMLInputElement & { showPicker?: () => void }) | null; try { picker?.showPicker?.(); } catch {} picker?.focus(); }} className={`h-9 w-9 shrink-0 rounded-xl border flex items-center justify-center ${bgCard}`}><Calendar size={14}/></button></div>
                  <select value={leadForm.followUpType} onChange={e=> setLeadForm({...leadForm, followUpType:e.target.value as any})} className={`h-9 rounded-xl border px-2 text-[12px] ${inputCls}`}><option>Phone Call</option><option>WhatsApp</option><option>Email</option><option>Meeting</option><option>Site Visit</option></select>
                  <div className={`h-9 rounded-xl border flex items-center px-2 text-[11px] ${inputCls}`}><Clock size={12} className="mr-1"/>10:00 AM</div>
                </div>
              </div>
              <button onClick={handleAddLead} className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-[13px]">Save Lead + Create Follow-up</button>
            </div>
          </div>
        </div>
      )}

      {/* FOLLOW-UP MODAL */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=> setShowFollowUpModal(false)}/>
          <div className={`relative w-full max-w-[520px] rounded-2xl border shadow-2xl ${bgCard}`}>
            <div className={`p-5 border-b ${borderC} flex items-center justify-between`}><div className="font-bold text-[16px]">Schedule Follow-up</div><button onClick={()=> setShowFollowUpModal(false)} className={`h-8 w-8 rounded-xl border flex items-center justify-center ${bgCard}`}><X size={16}/></button></div>
            <div className="p-5 space-y-3">
              <div><label className="text-[11px] font-medium">Lead / Client</label><select value={followUpForm.leadId||""} onChange={e=> { const value = e.target.value; const l = leads.find(x=> x.id===value); const c = value.startsWith("client:") ? clients.find(x=> x.id===value.slice(7)) : undefined; setFollowUpForm({...followUpForm, leadId:value, leadName:c?.name||l?.name||"", company:c?.businessName||l?.company||"", property:c ? "" : `${l?.propertyType} - ${l?.location}`}); }} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option value="">Select lead or client</option><optgroup label="Leads">{leads.map(l=> <option key={l.id} value={l.id}>{l.name} - {l.company}</option>)}</optgroup><optgroup label="Clients">{clients.map(c=> <option key={c.id} value={`client:${c.id}`}>{c.businessName}{c.name && c.name!==c.businessName ? ` - ${c.name}` : ""}</option>)}</optgroup></select></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] font-medium">Type</label><select value={followUpForm.type} onChange={e=> setFollowUpForm({...followUpForm, type:e.target.value as any})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>Phone Call</option><option>WhatsApp</option><option>Email</option><option>Meeting</option><option>Site Visit</option></select></div><div><label className="text-[11px] font-medium">Priority</label><select value={followUpForm.priority} onChange={e=> setFollowUpForm({...followUpForm, priority:e.target.value as any})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>High</option><option>Medium</option><option>Low</option></select></div></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] font-medium">Date</label><div className="mt-1 flex gap-1"><input ref={followUpDateRef} type="date" value={followUpForm.date||""} onChange={e=> setFollowUpForm({...followUpForm, date:e.target.value})} className={`min-w-0 flex-1 h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/><button type="button" aria-label="Open follow-up date calendar" onClick={() => { const picker = followUpDateRef.current as (HTMLInputElement & { showPicker?: () => void }) | null; try { picker?.showPicker?.(); } catch {} picker?.focus(); }} className={`h-9 w-9 rounded-xl border flex items-center justify-center ${bgCard}`}><Calendar size={14}/></button></div></div><div><label className="text-[11px] font-medium">Time</label><select value={followUpForm.time||"10:00 AM"} onChange={e=> setFollowUpForm({...followUpForm, time:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}>{followUpTimeOptions.map(time => <option key={time} value={time}>{time}</option>)}</select></div></div>
              <div><label className="text-[11px] font-medium">Assigned To</label><select value={followUpForm.assignedTo} onChange={e=> setFollowUpForm({...followUpForm, assignedTo:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>Aarav</option><option>Priya</option><option>Rohan</option></select></div>
              <div><label className="text-[11px] font-medium">Notes</label><textarea value={followUpForm.notes||""} onChange={e=> setFollowUpForm({...followUpForm, notes:e.target.value})} className={`mt-1 w-full h-20 rounded-xl border p-3 text-[13px] ${inputCls}`}/></div>
              <div className={`p-2.5 rounded-xl border text-[11px] ${isDark?"bg-[#1c1c2e]":"bg-slate-50"} ${borderC}`}>Reminder: 15 min before • Auto notification</div>
              <button onClick={handleScheduleFollowUp} className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-[13px]">Schedule Follow-up</button>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT MODAL */}
      {showCreateClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=> setShowCreateClient(false)}/>
          <div className={`relative w-full max-w-[520px] rounded-2xl border shadow-2xl ${bgCard}`}>
            <div className={`p-5 border-b ${borderC} flex items-center justify-between`}><div className="font-bold">Add Client</div><button onClick={()=> setShowCreateClient(false)} className={`h-8 w-8 rounded-xl border flex items-center justify-center ${bgCard}`}><X size={16}/></button></div>
            <div className="p-5 space-y-3">
              <div><label className="text-[11px] font-medium">Business Name *</label><input value={clientForm.businessName||""} onChange={e=> setClientForm({...clientForm, businessName:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] font-medium">Name</label><input value={clientForm.name||""} onChange={e=> setClientForm({...clientForm, name:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div><div><label className="text-[11px] font-medium">GSTIN AI validation</label><input value={clientForm.gstin||""} onChange={e=> setClientForm({...clientForm, gstin:e.target.value})} placeholder="27ABCDE1234F1Z5" className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] mono ${inputCls}`}/></div></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] font-medium">Email</label><input value={clientForm.email||""} onChange={e=> setClientForm({...clientForm, email:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div><div><label className="text-[11px] font-medium">Phone *</label><input value={clientForm.phone||""} onChange={e=> setClientForm({...clientForm, phone:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div></div>
              <div><label className="text-[11px] font-medium">Billing Address</label><input value={clientForm.address||""} onChange={e=> setClientForm({...clientForm, address:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] font-medium">State</label><select value={clientForm.state} onChange={e=> setClientForm({...clientForm, state:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>27-Maharashtra</option><option>29-Karnataka</option><option>07-Delhi</option></select></div><div><label className="text-[11px] font-medium">Credit Limit</label><input type="number" value={clientForm.creditLimit||""} onChange={e=> setClientForm({...clientForm, creditLimit:Number(e.target.value)})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div></div>
              <button onClick={handleCreateClient} className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-[13px]">Save Client</button>
            </div>
          </div>
        </div>
      )}

      {/* QUOTE MODAL */}
      {showCreateQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=> setShowCreateQuote(false)}/>
          <div className={`relative w-full max-w-[480px] rounded-2xl border shadow-2xl ${bgCard}`}>
            <div className={`p-5 border-b ${borderC} flex items-center justify-between`}><div className="font-bold">Create Quotation</div><button onClick={()=> setShowCreateQuote(false)} className={`h-8 w-8 rounded-xl border flex items-center justify-center ${bgCard}`}><X size={16}/></button></div>
            <div className="p-5 space-y-3">
              <div><label className="text-[11px] font-medium">Customer</label><select value={quoteForm.clientName||""} onChange={e=> setQuoteForm({...quoteForm, clientName:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option value="">Select client</option>{clients.map(c=> <option key={c.id} value={c.businessName}>{c.businessName}</option>)}</select></div>
              <div><label className="text-[11px] font-medium">Amount</label><input type="number" value={quoteForm.amount||""} onChange={e=> setQuoteForm({...quoteForm, amount:Number(e.target.value)})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] font-medium">Valid Until</label><div className="relative mt-1"><input ref={quoteValidUntilRef} type="date" value={quoteForm.validUntil||""} onChange={e=> setQuoteForm({...quoteForm, validUntil:e.target.value})} className={`w-full h-9 rounded-xl border px-3 pr-9 text-[13px] ${inputCls}`}/><button type="button" aria-label="Open valid until calendar" onClick={()=> { const input = quoteValidUntilRef.current; if (!input) return; input.focus(); input.showPicker?.(); }} className={`absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center ${textMuted}`}><Calendar size={14}/></button></div></div><div><label className="text-[11px] font-medium">Status</label><select value={quoteForm.status} onChange={e=> setQuoteForm({...quoteForm, status:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>Draft</option><option>Sent</option><option>Accepted</option></select></div></div>
              <button onClick={()=> void handleCreateQuotation()} className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-[13px]">Save Quotation</button>
            </div>
          </div>
        </div>
      )}

      {/* LEAD DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=> setSelectedLead(null)}/>
          <div className={`relative w-full max-w-[380px] h-full border-l shadow-2xl overflow-auto ${bgCard}`}>
            <div className={`p-5 border-b ${borderC} flex items-center justify-between sticky top-0 ${isDark?"bg-[#14141f]":"bg-white"}`}><div className="font-bold">Lead Details</div><button onClick={()=> setSelectedLead(null)} className={`h-8 w-8 rounded-xl border flex items-center justify-center ${bgCard}`}><X size={16}/></button></div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold">{selectedLead.avatar}</div><div><div className="font-bold">{selectedLead.name}</div><div className={`text-[12px] ${textMuted}`}>{selectedLead.company}</div></div></div>
              <div className={`rounded-xl border p-3 ${isDark?"bg-[#1c1c2e]":"bg-slate-50"} ${borderC} space-y-2 text-[13px]`}><div className="font-semibold text-[12px]">Contact</div><div className="flex items-center gap-2"><Mail size={14} className={textMuted}/>{selectedLead.email}</div><div className="flex items-center gap-2"><Phone size={14} className={textMuted}/>{selectedLead.phone}</div><div className="flex items-center gap-2"><MapPin size={14} className={textMuted}/>{selectedLead.location}</div></div>
              <div className={`rounded-xl border p-3 ${borderC} space-y-2 text-[13px]`}><div className="font-semibold text-[12px]">Property Interest</div><div className="flex gap-2 flex-wrap"><span className={`px-2 py-1 rounded-full text-[11px] border ${bgCard}`}>{selectedLead.propertyType}</span><span className={`px-2 py-1 rounded-full text-[11px] border ${bgCard}`}>{selectedLead.location}</span><span className={`px-2 py-1 rounded-full text-[11px] border ${bgCard}`}>₹{selectedLead.budgetMin/100000}L - ₹{selectedLead.budgetMax/100000}L</span></div><div className={`text-[12px] ${textMuted}`}>{selectedLead.notes}</div></div>
              <div><div className="font-semibold text-[12px] mb-2">Activity Timeline</div><div className="space-y-2">{[
                { t:"Lead created", d:selectedLead.createdAt },
                { t:`Status: ${selectedLead.status}`, d:new Date().toISOString() },
                { t:`Next: ${selectedLead.followUpType}`, d:selectedLead.nextFollowUp }
              ].map((a,i)=> <div key={i} className="flex gap-3"><div className="h-6 w-6 rounded-full bg-indigo-600/10 text-indigo-600 flex items-center justify-center"><Clock size={12}/></div><div><div className="text-[12px] font-medium">{a.t}</div><div className={`text-[11px] ${textMuted}`}>{new Date(a.d).toLocaleString()}</div></div></div>)}</div></div>
              <div className="grid grid-cols-2 gap-2"><button onClick={() => window.location.href = `tel:${selectedLead.phone}`} className={`h-9 rounded-xl border text-[12px] flex items-center justify-center gap-1 ${bgCard}`}><Phone size={14}/>Call</button><button onClick={() => window.open(`https://wa.me/${selectedLead.phone.replace(/\D/g, "")}`, "_blank", "noopener,noreferrer")} className={`h-9 rounded-xl border text-[12px] flex items-center justify-center gap-1 ${bgCard}`}><MessageCircle size={14}/>WhatsApp</button><button onClick={() => window.location.href = `mailto:${selectedLead.email}`} className={`h-9 rounded-xl border text-[12px] flex items-center justify-center gap-1 ${bgCard}`}><Mail size={14}/>Email</button><button onClick={()=> { setShowFollowUpModal(true); setFollowUpForm({ leadId:selectedLead.id, leadName:selectedLead.name, company:selectedLead.company, property:`${selectedLead.propertyType} - ${selectedLead.location}`, type:"Phone Call", priority:selectedLead.priority, assignedTo:selectedLead.assignedTo }); }} className={`h-9 rounded-xl border text-[12px] flex items-center justify-center gap-1 ${bgCard}`}><Calendar size={14}/>Follow-up</button></div>
              <button onClick={()=> void handleConvertLead(selectedLead)} className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-[13px]">Convert to Client</button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE PREVIEW */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=> setPreviewInvoice(null)}/>
          <div className={`relative w-full max-w-[800px] rounded-2xl border shadow-2xl max-h-[90vh] overflow-auto bg-white text-black p-6`}>
            <div className="flex justify-between items-start"><div className="flex gap-3"><div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold">Z</div><div><div className="font-bold">ZootechX.ai</div><div className="text-[11px] text-slate-500">GSTIN: 27ABCDE1234F1Z5 • Mumbai</div></div></div><button onClick={()=> setPreviewInvoice(null)} className="h-8 w-8 rounded-xl border flex items-center justify-center bg-white"><X size={16}/></button></div>
            <div className="mt-6 grid grid-cols-2 gap-6 text-[12px]"><div><div className="font-semibold">Bill To</div><div className="font-medium mt-1">{previewInvoice.clientName}</div><div className="text-slate-500">Place: {previewInvoice.placeOfSupply}</div></div><div className="text-right"><div>Invoice: {previewInvoice.number}</div><div>Date: {previewInvoice.date}</div><div>Due: {previewInvoice.dueDate}</div></div></div>
            <table className="w-full mt-6 text-[12px] border"><thead className="bg-slate-100"><tr><th className="p-2 text-left">Item</th><th className="p-2">Qty</th><th className="p-2">Rate</th><th className="p-2">Amount</th></tr></thead><tbody>{previewInvoice.items.map(it=> <tr key={it.id} className="border-t"><td className="p-2">{it.name}</td><td className="p-2 text-center">{it.qty}</td><td className="p-2 text-right">₹{it.rate}</td><td className="p-2 text-right">₹{it.qty*it.rate}</td></tr>)}</tbody></table>
            <div className="flex justify-end mt-4"><div className="w-[200px] text-[12px] space-y-1"><div className="flex justify-between"><span>Subtotal</span><span>₹{previewInvoice.subtotal}</span></div><div className="flex justify-between"><span>GST</span><span>₹{previewInvoice.gstTotal}</span></div><div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>₹{previewInvoice.total}</span></div></div></div>
          </div>
        </div>
      )}

      {/* Click outside handlers */}
      {newDropdownOpen && <div className="fixed inset-0 z-10" onClick={()=> setNewDropdownOpen(false)}/>}
      {notifOpen && <div className="fixed inset-0 z-10" onClick={()=> setNotifOpen(false)}/>}
    </motion.div>
  );
}
