import Login from "./components/Login";
import SalesDashboard from "./components/SalesDashboard";
import SubAdminDashboard from "./components/SubAdminDashboard";
import DeveloperWorkspace from "./components/DeveloperWorkspace";
import "./app.css";
import { apiFetch, AuthUser } from "./lib/api";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, UserPlus, BellRing, FileText, Plus, FileQuestion, Users, Building2,
  CreditCard, Calculator, Settings, Search, Sun, Moon, Bell, ChevronDown, X, Eye,
  Phone, MessageCircle, Mail, Calendar, MapPin, TrendingUp, TrendingDown, Clock,
  Check, AlertCircle, ArrowLeft, Save, Wand2, Sparkles, Mic, Bot, Zap, Filter,
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
  createdAt: string;
}
interface FollowUp {
  id: string; leadId: string; leadName: string; company: string; property: string;
  type: FollowUpType; date: string; time: string; assignedTo: string;
  priority: LeadPriority; status: FollowUpStatus; notes: string;
}
interface InvoiceItem { id: string; name: string; hsn: string; qty: number; unit: string; rate: number; discount: number; gst: number; }
interface Invoice {
  id: string; number: string; clientId: string; clientName: string; date: string; dueDate: string;
  placeOfSupply: string; items: InvoiceItem[]; subtotal: number; total: number; gstTotal: number;
  cgst: number; sgst: number; igst: number; status: "Draft" | "Sent" | "Paid" | "Overdue"; amountPaid: number;
}
interface Client { id: string; businessName: string; name: string; gstin: string; email: string; phone: string; address: string; state: string; creditLimit: number; }
interface Quotation { id: string; clientName: string; amount: number; validUntil: string; status: string; }

// MOCK DATA
const mockLeads: Lead[] = [
  { id:"L001", name:"Rahul Sharma", company:"Sharma Enterprises", email:"rahul@sharma.com", phone:"+91 98765 43210", propertyType:"Commercial", location:"Tardeo", budgetMin:5000000, budgetMax:12000000, source:"Website", assignedTo:"Aarav", priority:"High", status:"New", notes:"Looking for 2000 sqft office", nextFollowUp:new Date(Date.now()+86400000).toISOString(), followUpType:"Phone Call", avatar:"RS", createdAt:"2026-01-10" },
  { id:"L002", name:"Neha Patel", company:"Patel & Co", email:"neha@patelco.com", phone:"+91 98765 43211", propertyType:"Retail", location:"Bandra", budgetMin:3000000, budgetMax:7000000, source:"Referral", assignedTo:"Priya", priority:"Medium", status:"Follow-up", notes:"Needs high street retail", nextFollowUp:new Date().toISOString(), followUpType:"Site Visit", avatar:"NP", createdAt:"2026-01-09" },
  { id:"L003", name:"Amit Mehta", company:"Mehta Group", email:"amit@mehtagroup.com", phone:"+91 98765 43212", propertyType:"Office", location:"Lower Parel", budgetMin:10000000, budgetMax:25000000, source:"LinkedIn", assignedTo:"Aarav", priority:"High", status:"Qualified", notes:"Enterprise client", nextFollowUp:new Date(Date.now()+2*86400000).toISOString(), followUpType:"Meeting", avatar:"AM", createdAt:"2026-01-08" },
  { id:"L004", name:"Sneha Gupta", company:"Gupta Realty", email:"sneha@guptarealty.com", phone:"+91 98765 43213", propertyType:"Residential", location:"Worli", budgetMin:2000000, budgetMax:5000000, source:"Instagram", assignedTo:"Rohan", priority:"Low", status:"Contacted", notes:"2BHK sea view", nextFollowUp:new Date(Date.now()-86400000).toISOString(), followUpType:"WhatsApp", avatar:"SG", createdAt:"2026-01-07" },
  { id:"L005", name:"Vikram Singh", company:"Singh Developers", email:"vikram@singhdev.com", phone:"+91 98765 43214", propertyType:"Industrial", location:"Vashi", budgetMin:15000000, budgetMax:40000000, source:"Walk-in", assignedTo:"Priya", priority:"High", status:"Negotiation", notes:"Warehouse 10000 sqft", nextFollowUp:new Date(Date.now()+86400000).toISOString(), followUpType:"Email", avatar:"VS", createdAt:"2026-01-06" },
  { id:"L006", name:"Ananya Desai", company:"Desai Ventures", email:"ananya@desaiventures.com", phone:"+91 98765 43215", propertyType:"Land", location:"Thane", budgetMin:8000000, budgetMax:18000000, source:"WhatsApp", assignedTo:"Rohan", priority:"Medium", status:"Converted", notes:"Converted to client", nextFollowUp:new Date().toISOString(), followUpType:"Phone Call", avatar:"AD", createdAt:"2026-01-05" },
];

type ApiLead = {
  id: string; full_name: string; company: string | null; email: string | null; phone: string | null;
  source: string; notes: string | null; status: string; created_at: string;
};

const toLead = (lead: ApiLead): Lead => ({
  id: lead.id, name: lead.full_name, company: lead.company ?? "", email: lead.email ?? "", phone: lead.phone ?? "",
  propertyType: "Commercial", location: "", budgetMin: 0, budgetMax: 0, source: lead.source,
  assignedTo: "", priority: "Medium", status: "New", notes: lead.notes ?? "", nextFollowUp: "",
  followUpType: "Phone Call", avatar: lead.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
  createdAt: lead.created_at,
});
type ApiFollowUp = { id: string; lead_id: string | null; lead_name: string; company: string | null; property: string | null; type: string; followup_date: string; followup_time: string | null; assigned_to: string | null; priority: string | null; status: string; notes: string | null };
const toFollowUp = (followup: ApiFollowUp): FollowUp => ({ id: followup.id, leadId: followup.lead_id ?? "", leadName: followup.lead_name, company: followup.company ?? "", property: followup.property ?? "", type: followup.type as FollowUpType, date: followup.followup_date, time: followup.followup_time ?? "", assignedTo: followup.assigned_to ?? "", priority: (followup.priority as LeadPriority) ?? "Medium", status: followup.status as FollowUpStatus, notes: followup.notes ?? "" });

type ApiClient = { id: string; name: string; company: string | null; email: string | null; phone: string | null; gst_number: string | null };
const toClient = (client: ApiClient): Client => ({
  id: client.id, businessName: client.company ?? client.name, name: client.name, gstin: client.gst_number ?? "",
  email: client.email ?? "", phone: client.phone ?? "", address: "", state: "27-Maharashtra", creditLimit: 0,
});
type ApiInvoice = { id: string; invoice_number: string; client_id: string; client_name: string; total: string | number; paid_amount: string | number; due_date: string; created_at: string };
const toInvoice = (invoice: ApiInvoice): Invoice => ({ id: invoice.id, number: invoice.invoice_number, clientId: invoice.client_id, clientName: invoice.client_name, date: invoice.created_at.slice(0, 10), dueDate: invoice.due_date.slice(0, 10), placeOfSupply: "27-Maharashtra", items: [], subtotal: Number(invoice.total), total: Number(invoice.total), gstTotal: 0, cgst: 0, sgst: 0, igst: 0, status: Number(invoice.paid_amount) >= Number(invoice.total) ? "Paid" : "Sent", amountPaid: Number(invoice.paid_amount) });
type FinanceExpense = { id: string; title: string; category: string; amount: string | number; expense_date: string | null; payment_method: string | null };
type FinancePayment = { id: string; invoice_number: string; amount: string | number; method: string; created_at: string };

const mockClients: Client[] = [
  { id:"C001", businessName:"Sharma Enterprises", name:"Rahul Sharma", gstin:"27ABCDE1234F1Z5", email:"rahul@sharma.com", phone:"+91 98765 43210", address:"Tardeo, Mumbai", state:"27-Maharashtra", creditLimit:500000 },
  { id:"C002", businessName:"Patel & Co", name:"Neha Patel", gstin:"27FGHIJ5678K2Z6", email:"neha@patelco.com", phone:"+91 98765 43211", address:"Bandra, Mumbai", state:"27-Maharashtra", creditLimit:300000 },
  { id:"C003", businessName:"Mehta Group", name:"Amit Mehta", gstin:"27KLMNO9012L3Z7", email:"amit@mehtagroup.com", phone:"+91 98765 43212", address:"Lower Parel, Mumbai", state:"27-Maharashtra", creditLimit:1000000 },
];

const mockInvoices: Invoice[] = [
  { id:"INV01", number:"INV-2026-001", clientId:"C001", clientName:"Sharma Enterprises", date:"2026-01-15", dueDate:"2026-02-15", placeOfSupply:"27-Maharashtra", items:[{id:"1", name:"Office Space Brokerage", hsn:"9972", qty:1, unit:"Nos", rate:250000, discount:0, gst:18}], subtotal:250000, total:295000, gstTotal:45000, cgst:22500, sgst:22500, igst:0, status:"Sent", amountPaid:0 },
  { id:"INV02", number:"INV-2026-002", clientId:"C002", clientName:"Patel & Co", date:"2026-01-12", dueDate:"2026-01-30", placeOfSupply:"27-Maharashtra", items:[{id:"1", name:"Retail Consultancy", hsn:"9983", qty:1, unit:"Nos", rate:120000, discount:10, gst:18}], subtotal:108000, total:127440, gstTotal:19440, cgst:9720, sgst:9720, igst:0, status:"Paid", amountPaid:127440 },
];

const pipelineData = [
  { name:"New", value:12 }, { name:"Contacted", value:8 }, { name:"Follow-up", value:15 },
  { name:"Qualified", value:6 }, { name:"Negotiation", value:4 }, { name:"Converted", value:9 },
];
const revenueData = [
  { month:"Aug", revenue:280000, forecast:0 }, { month:"Sep", revenue:320000, forecast:0 },
  { month:"Oct", revenue:410000, forecast:0 }, { month:"Nov", revenue:380000, forecast:0 },
  { month:"Dec", revenue:520000, forecast:0 }, { month:"Jan", revenue:480000, forecast:520000 },
  { month:"Feb", revenue:0, forecast:610000 },
];
const statusData = [
  { name:"Paid", value:45, color:"#10b981" }, { name:"Sent", value:30, color:"#6366f1" },
  { name:"Draft", value:15, color:"#94a3b8" }, { name:"Overdue", value:10, color:"#ef4444" },
];
const followUpTimeOptions = Array.from({ length: 24 }, (_, hour) => [0, 30].map(minute => { const suffix = hour < 12 ? "AM" : "PM"; const displayHour = hour % 12 || 12; return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`; })).flat();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [leads, setLeads] = useState<Lead[]>(mockLeads);

 

  const [followUps, setFollowUps] = useState<FollowUp[]>(() => {
    return mockLeads.slice(0,5).map((l,i)=> ({
      id:`F00${i+1}`, leadId:l.id, leadName:l.name, company:l.company, property:`${l.propertyType} - ${l.location}`,
      type:l.followUpType, date:l.nextFollowUp.split("T")[0], time:`${10+i}:00 AM`, assignedTo:l.assignedTo, priority:l.priority, status: i===3 ? "Overdue" as FollowUpStatus : "Scheduled" as FollowUpStatus, notes:`Follow up with ${l.name}`
    }));
  });
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [payments, setPayments] = useState<FinancePayment[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([
    { id:"Q001", clientName:"Sharma Enterprises", amount:295000, validUntil:"2026-02-15", status:"Sent" },
    { id:"Q002", clientName:"Patel & Co", amount:127440, validUntil:"2026-02-10", status:"Draft" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddLead, setShowAddLead] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUpFilter, setFollowUpFilter] = useState<string>("All");
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [automationOn, setAutomationOn] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const followUpDateRef = useRef<HTMLInputElement>(null);

  // NEW INVOICE FORM STATE
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice> & { placeOfSupply: string }>({
    number:`INV-2026-${String(mockInvoices.length+1).padStart(3,"0")}`,
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

  const [notifications, setNotifications] = useState([
    { id:"1", text:"Follow-up overdue: Sneha Gupta", time:"10 min ago", unread:true },
    { id:"2", text:"New lead: Ananya Desai converted", time:"1 hr ago", unread:true },
    { id:"3", text:"Invoice INV-2026-001 due in 3 days", time:"2 hr ago", unread:false },
  ]);

  // hero animation states
  const [countAI, setCountAI] = useState(0);
  const [countVoice, setCountVoice] = useState(0);
  const [countTime, setCountTime] = useState(0);
  const [typedSubtitle, setTypedSubtitle] = useState("");
  const [marqueePaused, setMarqueePaused] = useState(false);
  const [heroKey, setHeroKey] = useState(0);

  // Load theme and data
  useEffect(()=>{
    const savedTheme = localStorage.getItem("zootechx_theme");
    if(savedTheme) setIsDark(savedTheme==="dark");
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
    }
    const savedLeads = localStorage.getItem("zootechx_leads");
    if(savedLeads) try{ setLeads(JSON.parse(savedLeads)); }catch{}
    const savedFollow = localStorage.getItem("zootechx_followups");
    if(savedFollow) try{ setFollowUps(JSON.parse(savedFollow)); }catch{}
    const savedInv = localStorage.getItem("zootechx_invoices");
    if(savedInv) try{ setInvoices(JSON.parse(savedInv)); }catch{}
    const savedClients = localStorage.getItem("zootechx_clients");
    if(savedClients) try{ setClients(JSON.parse(savedClients)); }catch{}
    const savedQuotes = localStorage.getItem("zootechx_quotations");
    if(savedQuotes) try{ setQuotations(JSON.parse(savedQuotes)); }catch{}
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
        const [leadsResponse, clientsResponse, invoicesResponse, expensesResponse, paymentsResponse, followupsResponse] = await Promise.all([apiFetch("/api/leads"), apiFetch("/api/clients"), apiFetch("/api/invoices"), apiFetch("/api/expenses"), apiFetch("/api/payments"), apiFetch("/api/followups")]);
        const leadsData = await leadsResponse.json();
        const clientsData = await clientsResponse.json();
        const invoicesData = await invoicesResponse.json(); const expensesData = await expensesResponse.json(); const paymentsData = await paymentsResponse.json(); const followupsData = await followupsResponse.json();
        if (leadsResponse.ok && Array.isArray(leadsData.data)) setLeads(leadsData.data.map(toLead));
        if (leadsResponse.ok && Array.isArray(leadsData.data) && leadsData.data.length === 0) {
          const currentUser = JSON.parse(localStorage.getItem("zootechx_user") || "null") as AuthUser | null;
          const savedLeads = JSON.parse(localStorage.getItem("zootechx_leads") || "[]") as Lead[];
          if (currentUser?.role === "SUPER_ADMIN" && savedLeads.length > 0) {
            await Promise.all(savedLeads.map(lead => apiFetch("/api/leads", { method: "POST", body: JSON.stringify({ fullName: lead.name, company: lead.company || undefined, email: lead.email || undefined, phone: lead.phone || undefined, source: lead.source || "Manual", notes: lead.notes || undefined }) })));
            const syncedResponse = await apiFetch("/api/leads"); const syncedData = await syncedResponse.json();
            if (syncedResponse.ok) setLeads((syncedData.data ?? []).map(toLead));
          }
        }
        if (clientsResponse.ok && Array.isArray(clientsData.data)) setClients(clientsData.data.map(toClient));
        if (clientsResponse.ok && Array.isArray(clientsData.data) && clientsData.data.length === 0) {
          const currentUser = JSON.parse(localStorage.getItem("zootechx_user") || "null") as AuthUser | null;
          const savedClients = JSON.parse(localStorage.getItem("zootechx_clients") || "[]") as Client[];
          if (currentUser?.role === "SUPER_ADMIN" && savedClients.length > 0) {
            await Promise.all(savedClients.map(client => apiFetch("/api/clients", { method: "POST", body: JSON.stringify({ name: client.name || client.businessName, company: client.businessName || undefined, email: client.email || undefined, phone: client.phone || "Not provided", gstNumber: client.gstin || undefined }) })));
            const syncedResponse = await apiFetch("/api/clients"); const syncedData = await syncedResponse.json();
            if (syncedResponse.ok) setClients((syncedData.data ?? []).map(toClient));
          }
        }
        if (invoicesResponse.ok && Array.isArray(invoicesData.data)) setInvoices(invoicesData.data.map(toInvoice));
        if (expensesResponse.ok && Array.isArray(expensesData.data)) setExpenses(expensesData.data);
        if (paymentsResponse.ok && Array.isArray(paymentsData.data)) setPayments(paymentsData.data);
        if (followupsResponse.ok && Array.isArray(followupsData.data) && followupsData.data.length > 0) setFollowUps(followupsData.data.map(toFollowUp));
        if (followupsResponse.ok && Array.isArray(followupsData.data) && followupsData.data.length === 0) {
          const currentUser = JSON.parse(localStorage.getItem("zootechx_user") || "null") as AuthUser | null;
          const savedFollowups = JSON.parse(localStorage.getItem("zootechx_followups") || "[]") as FollowUp[];
          if (currentUser?.role === "SUPER_ADMIN" && savedFollowups.length > 0) {
            await Promise.all(savedFollowups.map(followup => apiFetch("/api/followups", { method: "POST", body: JSON.stringify({ leadId: followup.leadId || undefined, leadName: followup.leadName, company: followup.company || undefined, property: followup.property || undefined, type: followup.type, date: followup.date, time: followup.time, assignedTo: followup.assignedTo, priority: followup.priority, status: followup.status, notes: followup.notes || undefined }) })));
            const syncedResponse = await apiFetch("/api/followups"); const syncedData = await syncedResponse.json();
            if (syncedResponse.ok) setFollowUps((syncedData.data ?? []).map(toFollowUp));
          }
        }
      } catch {
        // The local list remains available while the API is temporarily unreachable.
      }
    };
    loadCrmData();
  }, [isLoggedIn]);

  useEffect(()=>{ localStorage.setItem("zootechx_theme", isDark?"dark":"light"); },[isDark]);
  useEffect(()=>{ localStorage.setItem("zootechx_leads", JSON.stringify(leads)); },[leads]);
  useEffect(()=>{ localStorage.setItem("zootechx_followups", JSON.stringify(followUps)); },[followUps]);
  useEffect(()=>{ localStorage.setItem("zootechx_invoices", JSON.stringify(invoices)); },[invoices]);
  useEffect(()=>{ localStorage.setItem("zootechx_clients", JSON.stringify(clients)); },[clients]);
  useEffect(()=>{ localStorage.setItem("zootechx_quotations", JSON.stringify(quotations)); },[quotations]);

  // Overdue detection
  useEffect(()=>{
    const now = new Date();
    setFollowUps(prev=> prev.map(f=>{
      const fDate = new Date(f.date + " " + f.time);
      if(fDate < now && f.status==="Scheduled") return {...f, status:"Overdue" as FollowUpStatus};
      return f;
    }));
  },[]);

  // hero count-up + typewriter
  useEffect(()=>{
    if(currentPage!=="dashboard") return;
    let start = performance.now();
    const dur = 1200;
    const targetAI = 12, targetVoice = 8, targetTime = 3.2;
    let raf = 0;
    const animate = (now:number)=>{
      const prog = Math.min((now-start)/dur,1);
      const ease = 1 - Math.pow(1-prog,3);
      setCountAI(Math.round(ease*targetAI));
      setCountVoice(Math.round(ease*targetVoice));
      setCountTime(Number((ease*targetTime).toFixed(1)));
      if(prog<1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    const full = "AI Assistant is monitoring 4 invoices • 2 follow-ups due today";
    let idx=0;
    setTypedSubtitle("");
    const typeInterval = setInterval(()=>{
      idx++;
      setTypedSubtitle(full.slice(0,idx));
      if(idx>=full.length) clearInterval(typeInterval);
    }, 22);
    return ()=>{ cancelAnimationFrame(raf); clearInterval(typeInterval); };
  },[currentPage]);

  const toggleTheme = () => setIsDark(!isDark);

  const filteredLeads = useMemo(()=>{
    if(!searchQuery) return leads;
    return leads.filter(l=> `${l.name} ${l.company} ${l.email}`.toLowerCase().includes(searchQuery.toLowerCase()));
  },[leads, searchQuery]);

  const kpis = useMemo(()=> {
    const total = leads.length;
    const totalInvoiced = invoices.reduce((s,i)=> s+i.total,0);
    const pending = invoices.filter(i=> i.status==="Sent").length;
    const overdue = followUps.filter(f=> f.status==="Overdue").length;
    return { total, totalInvoiced, pending, overdue };
  },[leads, invoices, followUps]);

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
    try {
      const response = await apiFetch("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          fullName: newLead.name, company: newLead.company || undefined, email: newLead.email || undefined,
          phone: newLead.phone || undefined, source: newLead.source, notes: newLead.notes || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save lead");
      setLeads([toLead(data.data), ...leads]);
    } catch {
      setLeads([newLead, ...leads]);
      setNotifications([{ id: Date.now().toString(), text: "Lead saved locally. It will sync when Neon is available.", time: "Just now", unread: true }, ...notifications]);
    }
    // auto create followup
    if(newLead.nextFollowUp){
      const d = new Date(newLead.nextFollowUp);
      const fu: FollowUp = {
        id:`F${String(followUps.length+1).padStart(3,"0")}`, leadId:newLead.id, leadName:newLead.name,
        company:newLead.company, property:`${newLead.propertyType} - ${newLead.location}`,
        type:newLead.followUpType, date:d.toISOString().split("T")[0], time:"10:00 AM",
        assignedTo:newLead.assignedTo, priority:newLead.priority, status:"Scheduled", notes:`Follow up for ${newLead.name}`
      };
      setFollowUps([fu, ...followUps]);
      setNotifications([{id:Date.now().toString(), text:`New follow-up scheduled: ${newLead.name}`, time:"Just now", unread:true}, ...notifications]);
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
      setFollowUps([toFollowUp(data.data), ...followUps]);
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
    } catch {
      const client: Client = {
        id: `C${String(clients.length + 1).padStart(3, "0")}`,
        businessName: clientForm.businessName,
        name: clientForm.name || clientForm.businessName,
        gstin: clientForm.gstin || "",
        email: clientForm.email || "",
        phone: clientForm.phone,
        address: clientForm.address || "",
        state: clientForm.state || "27-Maharashtra",
        creditLimit: clientForm.creditLimit || 0,
      };
      setClients([client, ...clients]);
      setShowCreateClient(false);
      setClientForm({ state: "27-Maharashtra" });
      setNotifications([{ id: Date.now().toString(), text: "Client saved locally. It will sync when Neon is available.", time: "Just now", unread: true }, ...notifications]);
    }
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
  const bgMain = isDark ? "bg-[#0a0a0f]" : "bg-[#f8fafc]";
  const bgCard = isDark ? "bg-[#14141f] border-[#23233a]" : "bg-white border-slate-200";
  const bgSidebar = isDark ? "bg-[#0f0f1a] border-[#23233a]" : "bg-white border-slate-200";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-zinc-400" : "text-slate-500";
  const borderC = isDark ? "border-[#23233a]" : "border-slate-200";
  const inputCls = isDark ? "bg-[#1c1c2e] border-[#2a2a40] text-white placeholder-zinc-500" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400";
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className={`premium-dashboard min-h-screen font-sans antialiased flex ${bgMain} ${textMain} transition-colors duration-300`}>
      

      {/* SIDEBAR */}
      <aside className={`w-[260px] shrink-0 hidden lg:flex flex-col ${bgSidebar} border-r sticky top-0 h-screen z-10`}>
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
            { id:"leads", label:"Leads", icon:UserPlus, badge:leads.length },
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
          <div className={`rounded-xl p-3 ${isDark?"bg-[#1c1c2e]":"bg-slate-50"} border ${borderC}`}>
            <div className="flex items-center gap-2 text-[12px] font-semibold"><Zap size={14} className="text-cyan-400"/> AI Automation {automationOn?"ON":"OFF"}</div>
            <div className={`text-[11px] ${textMuted} mt-1`}>Saved 23 hrs this week</div>
            <button onClick={()=> setAutomationOn(!automationOn)} className={`mt-2 w-full h-7 rounded-lg text-[11px] font-medium transition ${automationOn ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white" : isDark?"bg-[#23233a] text-zinc-400":"bg-slate-200 text-slate-600"}`}>{automationOn?"Disable":"Enable"} Workflow</button>
          </div>
          <button onClick={()=> setCurrentPage("settings")} className={`mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] ${textMuted} hover:bg-slate-100 dark:hover:bg-[#1a1a2a]`}><Settings size={18}/>Settings</button>
          <button onClick={logout} className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-red-400 hover:bg-red-500/10 transition"><LogOut size={18}/>Log out</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
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

          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-[420px] relative">
            <Search size={16} className={`absolute left-3 ${textMuted}`} />
            <input value={searchQuery} onChange={e=> setSearchQuery(e.target.value)} placeholder="Search leads, clients, invoices…" className={`w-full h-9 pl-9 pr-3 rounded-xl border text-[13px] outline-none ${inputCls}`} />
            {searchQuery && (
              <div className={`absolute top-11 left-0 w-full rounded-xl border shadow-xl z-30 max-h-[320px] overflow-auto ${bgCard} ${borderC} p-2`}>
                {filteredLeads.slice(0,5).map(l=> (
                  <button key={l.id} onClick={()=> { setSelectedLead(l); setSearchQuery(""); setCurrentPage("leads"); }} className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 hover:${isDark?"bg-[#1c1c2e]":"bg-slate-50"}`}>
                    <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">{l.avatar}</div>
                    <div><div className="text-[13px] font-medium">{l.name}</div><div className={`text-[11px] ${textMuted}`}>{l.company}</div></div>
                  </button>
                ))}
                {filteredLeads.length===0 && <div className={`p-3 text-[13px] ${textMuted}`}>No results</div>}
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

            <button onClick={()=> setVoiceActive(!voiceActive)} className={`h-10 w-10 rounded-xl border flex items-center justify-center ${voiceActive ? "bg-gradient-to-br from-cyan-500 to-indigo-600 text-white border-transparent" : bgCard}`}>
              <Mic size={18}/>
            </button>

            <div className="relative">
              <button onClick={()=> setNotifOpen(!notifOpen)} className={`h-10 w-10 rounded-xl border flex items-center justify-center relative ${bgCard}`}>
                <Bell size={18}/>
                {notifications.filter(n=> n.unread).length>0 && <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{notifications.filter(n=> n.unread).length}</span>}
              </button>
              {notifOpen && (
                <div className={`absolute right-0 top-12 w-[360px] rounded-2xl border shadow-xl z-40 ${bgCard} overflow-hidden`}>
                  <div className={`p-4 flex items-center justify-between border-b ${borderC}`}><div className="font-semibold text-[14px]">Notifications</div><button onClick={()=> setNotifications(notifications.map(n=> ({...n, unread:false})))} className={`text-[11px] ${textMuted} hover:underline`}>Mark all as read</button></div>
                  <div className="max-h-[360px] overflow-auto">
                    {notifications.map(n=> (
                      <div key={n.id} className={`p-3.5 flex gap-3 border-b last:border-0 ${borderC} ${n.unread? (isDark?"bg-[#1a1a2e]":"bg-indigo-50/50"):""}`}>
                        <div className={`h-2 w-2 mt-2 rounded-full ${n.unread?"bg-indigo-600":"bg-transparent"}`} />
                        <div className="flex-1"><div className="text-[13px]">{n.text}</div><div className={`text-[11px] ${textMuted} mt-1`}>{n.time}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`h-9 w-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-[12px] font-bold`}>RR</div>
            <button onClick={logout} title="Log out" className={`h-10 px-3 rounded-xl border flex items-center gap-2 text-[13px] font-medium text-red-400 transition hover:bg-red-500/10 ${bgCard}`}><LogOut size={17}/><span className="hidden xl:inline">Log out</span></button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-4 lg:p-6">
          {/* DASHBOARD */}
          {currentPage==="dashboard" && (
            <div className="space-y-6 max-w-[1600px] mx-auto">
              {/* HERO CARD with animations */}
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-[24px] opacity-60 group-hover:opacity-100 transition-opacity duration-700 blur-[0.5px]" style={{background:'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #6366f1)', backgroundSize:'300% 100%', animation:'border-glow 5s ease infinite'}}/>
                <div className={`relative rounded-[22px] border overflow-hidden ${isDark ? "bg-[#14141f] border-[#23233a] shadow-[0_0_60px_rgba(99,102,241,0.18)]" : "bg-white border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.07)]"}`}>
                  <div className="absolute inset-0">
                    <div className={`absolute inset-0 ${isDark ? "opacity-[0.04]" : "opacity-[0.05]"}`} style={{backgroundImage:`linear-gradient(${isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"} 1px, transparent 1px)`, backgroundSize:"28px 28px"}}/>
                    <div className="absolute -top-28 -left-16 w-[320px] h-[320px] rounded-full blur-[70px] opacity-30" style={{background:"radial-gradient(circle, #6366f1 0%, transparent 65%)", animation:"floatY 6s ease-in-out infinite"}}/>
                    <div className="absolute -top-12 right-0 w-[260px] h-[260px] rounded-full blur-[60px] opacity-25" style={{background:"radial-gradient(circle, #8b5cf6 0%, transparent 70%)", animation:"floatY2 7s ease-in-out infinite"}}/>
                    <div className="absolute bottom-[-60px] left-[35%] w-[420px] h-[220px] rounded-full blur-[80px] opacity-20" style={{background:"radial-gradient(circle, #06b6d4 0%, transparent 70%)", animation:"floatY3 8s ease-in-out infinite"}}/>
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(14)].map((_,i)=>(
                        <div key={i} className={`absolute w-[2.5px] h-[2.5px] rounded-full ${isDark ? "bg-indigo-300/40" : "bg-indigo-500/25"}`} style={{left:`${6+i*6.5}%`, top:`${18+(i%5)*15}%`, animation:`floatY ${4+i%3}s ease-in-out infinite`, animationDelay:`${i*0.35}s`}}/>
                      ))}
                    </div>
                  </div>
                  <div className="relative z-10 p-5 lg:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-[22px] lg:text-[28px] font-bold tracking-tight leading-tight">Good morning, Team ZootechX <span className="inline-block" style={{animation:"floatY 2s ease-in-out infinite"}}>👋</span></h1>
                        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${isDark ? "bg-[#1c1c2e] border-[#2a2a40] text-zinc-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"/><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/></span>
                          AI Live
                        </div>
                      </div>
                      <div className={`mt-2 flex flex-wrap items-center gap-2 text-[13px] ${textMuted}`}>
                        <span className="flex items-center gap-1.5"><Bot size={14} className="text-indigo-500"/>{typedSubtitle}<span className="inline-block w-[2px] h-3 bg-indigo-500 ml-0.5 animate-pulse translate-y-[1px]"/></span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className={`h-7 px-2.5 rounded-full border text-[11px] flex items-center gap-1.5 ${isDark ? "bg-[#1c1c2e] border-[#2a2a40]" : "bg-white border-slate-200"}`}><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/>AI Assistant active</div>
                        <div className={`h-7 px-2.5 rounded-full border text-[11px] flex items-center gap-1.5 ${isDark ? "bg-[#1c1c2e] border-[#2a2a40]" : "bg-white border-slate-200"}`}><Zap size={12} className="text-amber-500"/>Auto-pilot ON</div>
                        <div className={`hidden md:flex h-7 px-2.5 rounded-full border text-[11px] items-center gap-1.5 ${isDark ? "bg-[#1c1c2e] border-[#2a2a40]" : "bg-white border-slate-200"}`}><Sparkles size={12} className="text-violet-500"/>AI saved 12.4h this week</div>
                      </div>
                    </div>
                    <div className="flex gap-3 lg:gap-4 shrink-0">
                      <div className={`min-w-[108px] lg:min-w-[132px] rounded-2xl border p-3 lg:p-3.5 ${isDark ? "bg-[#0f0f1a]/70 border-[#23233a] backdrop-blur-xl" : "bg-white/80 border-slate-200 backdrop-blur-xl shadow-sm"} hover:scale-[1.02] transition-transform`}>
                        <div className="flex items-center justify-between"><span className={`text-[10px] uppercase tracking-widest ${textMuted}`}>AI Automations</span><span className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center"><TrendingUp size={12}/></span></div>
                        <div className="mt-1 flex items-end gap-1"><span className="text-[22px] font-bold leading-none">{countAI}</span><span className={`text-[11px] ${textMuted} mb-0.5`}>today</span><span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/></div>
                        <div className="mt-2 h-1 rounded-full bg-slate-200 dark:bg-[#23233a] overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700" style={{width:`${(countAI/12)*100}%`}}/></div>
                      </div>
                      <div className={`min-w-[108px] lg:min-w-[132px] rounded-2xl border p-3 lg:p-3.5 ${isDark ? "bg-[#0f0f1a]/70 border-[#23233a] backdrop-blur-xl" : "bg-white/80 border-slate-200 backdrop-blur-xl shadow-sm"} hover:scale-[1.02] transition-transform`}>
                        <div className="flex items-center justify-between"><span className={`text-[10px] uppercase tracking-widest ${textMuted}`}>Voice AI Calls</span><span className="h-5 w-5 rounded-full bg-cyan-500/15 text-cyan-600 flex items-center justify-center"><Mic size={11}/></span></div>
                        <div className="mt-1 flex items-end gap-2"><span className="text-[22px] font-bold leading-none">{countVoice}</span>
                          <div className="flex items-end gap-[2px] h-[14px] mb-1">{[0,1,2].map(i=><div key={i} className="w-[3px] rounded-full bg-gradient-to-t from-cyan-500 to-indigo-500" style={{animation:`waveBar 0.9s ease-in-out infinite`, animationDelay:`${i*0.15}s`}}/> )}</div>
                        </div>
                        <div className={`text-[10px] ${textMuted} mt-1`}>3 via WhatsApp</div>
                      </div>
                      <div className={`min-w-[108px] lg:min-w-[132px] rounded-2xl border p-3 lg:p-3.5 ${isDark ? "bg-[#0f0f1a]/70 border-[#23233a] backdrop-blur-xl" : "bg-white/80 border-slate-200 backdrop-blur-xl shadow-sm"} hover:scale-[1.02] transition-transform`}>
                        <div className="flex items-center justify-between"><span className={`text-[10px] uppercase tracking-widest ${textMuted}`}>Time Saved</span><span className="h-5 w-5 rounded-full bg-violet-500/15 text-violet-600 flex items-center justify-center"><Clock size={11} style={{animation:"clock-tick 1.2s ease-in-out infinite alternate"}}/></span></div>
                        <div className="mt-1 flex items-end gap-1"><span className="text-[22px] font-bold leading-none">{countTime}h</span><span className={`text-[11px] ${textMuted} mb-0.5`}>week</span></div>
                        <div className={`text-[10px] ${textMuted} mt-1 flex items-center gap-1`}><Sparkles size={10} className="text-violet-500"/>94% on track</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                onMouseEnter={()=> setMarqueePaused(true)}
                onMouseLeave={()=> setMarqueePaused(false)}
                className={`relative rounded-full border h-9 flex items-center overflow-hidden ${isDark ? "bg-[#0f0f1a]/80 border-[#23233a]" : "bg-white border-slate-200 shadow-sm"} backdrop-blur-xl`}
              >
                <div className="shrink-0 h-full px-3 flex items-center gap-1.5 text-[11px] font-bold tracking-widest bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                  <Zap size={12}/> LIVE
                </div>
                <div className="flex-1 overflow-hidden relative h-full flex items-center">
                  <div className="flex items-center whitespace-nowrap will-change-transform" style={{animation:`marquee 38s linear infinite`, animationPlayState: marqueePaused ? 'paused' as any : 'running' as any}}>
                    {[
                      "🤖 AI: Rahul Sharma invoice predicted to be paid tomorrow",
                      "⚡ Workflow: Auto-reminder sent to Neha Patel",
                      "🎙️ Voice AI processed 3 invoices via WhatsApp",
                      "📊 GST compliance 98% • All invoices verified",
                      "🔔 2 overdue follow-ups • AI rescheduling suggested",
                      "💸 ₹4.2L collected this week • +12% vs last week",
                    ].concat([
                      "🤖 AI: Rahul Sharma invoice predicted to be paid tomorrow",
                      "⚡ Workflow: Auto-reminder sent to Neha Patel",
                      "🎙️ Voice AI processed 3 invoices via WhatsApp",
                      "📊 GST compliance 98% • All invoices verified",
                      "🔔 2 overdue follow-ups • AI rescheduling suggested",
                      "💸 ₹4.2L collected this week • +12% vs last week",
                    ]).map((txt,i)=>(
                      <span key={i} className={`mx-6 text-[12px] ${textMuted} flex items-center gap-2`}><span className="h-1 w-1 rounded-full bg-indigo-500"/>{txt}</span>
                    ))}
                  </div>
                </div>
                <div className={`hidden md:flex items-center gap-2 px-3 text-[11px] ${textMuted} border-l ${borderC} h-full shrink-0`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/>Updated just now
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {[
                  { label:"Total Leads", value:kpis.total, change:"+12%", up:true, icon:UserPlus, color:"from-indigo-600 to-violet-600" },
                  { label:"Total Invoiced", value:`₹${(kpis.totalInvoiced/100000).toFixed(1)}L`, change:"+8.2%", up:true, icon:CreditCard, color:"from-emerald-600 to-teal-600" },
                  { label:"Pending", value:kpis.pending, change:"-2", up:false, icon:Clock, color:"from-amber-500 to-orange-500" },
                  { label:"Overdue", value:kpis.overdue, change:"+3", up:false, icon:AlertCircle, color:"from-red-500 to-pink-500" },
                ].map(k=> (
                  <div key={k.label} className={`rounded-2xl border p-4 ${bgCard}`}>
                    <div className="flex items-center justify-between">
                      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${k.color} text-white flex items-center justify-center`}><k.icon size={16}/></div>
                      <div className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 ${k.up?"bg-emerald-500/10 text-emerald-600":"bg-red-500/10 text-red-600"}`}>{k.up?<TrendingUp size={12}/>:<TrendingDown size={12}/>}{k.change}</div>
                    </div>
                    <div className="mt-3 text-[24px] font-bold">{k.value}</div>
                    <div className={`text-[12px] ${textMuted}`}>{k.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                <div className={`rounded-2xl border p-4 ${bgCard}`}>
                  <div className="font-semibold text-[14px] mb-3">Lead Pipeline</div>
                  <div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={pipelineData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={isDark?"#23233a":"#e2e8f0"} horizontal={false}/><XAxis type="number" tick={{fontSize:10, fill:isDark?"#71717a":"#64748b"}}/><YAxis dataKey="name" type="category" width={80} tick={{fontSize:11, fill:isDark?"#a1a1aa":"#475569"}}/><Tooltip contentStyle={{background:isDark?"#14141f":"#fff", border:`1px solid ${isDark?"#23233a":"#e2e8f0"}`, borderRadius:12, fontSize:12}}/><Bar dataKey="value" fill="#6366f1" radius={[0,8,8,0]}/></BarChart></ResponsiveContainer></div>
                </div>
                <div className={`rounded-2xl border p-4 ${bgCard}`}>
                  <div className="font-semibold text-[14px] mb-3">Revenue Overview <span className={`text-[11px] ml-2 ${textMuted}`}>AI forecast dotted</span></div>
                  <div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke={isDark?"#23233a":"#e2e8f0"}/><XAxis dataKey="month" tick={{fontSize:11, fill:isDark?"#71717a":"#64748b"}}/><YAxis tick={{fontSize:11, fill:isDark?"#71717a":"#64748b"}}/><Tooltip contentStyle={{background:isDark?"#14141f":"#fff", borderRadius:12, fontSize:12, border:`1px solid ${isDark?"#23233a":"#e2e8f0"}`}}/><Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2}/><Area type="monotone" dataKey="forecast" stroke="#06b6d4" strokeDasharray="6 6" fill="transparent" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
                </div>
                <div className={`rounded-2xl border p-4 ${bgCard}`}>
                  <div className="font-semibold text-[14px] mb-3">Invoice Status</div>
                  <div className="h-[200px] flex items-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>{statusData.map((e,i)=> <Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={{background:isDark?"#14141f":"#fff", borderRadius:12, fontSize:12, border:`1px solid ${isDark?"#23233a":"#e2e8f0"}`}}/></PieChart></ResponsiveContainer>
                    <div className="space-y-2 ml-2">{statusData.map(s=> <div key={s.name} className="flex items-center gap-2 text-[11px]"><span className="h-2 w-2 rounded-full" style={{background:s.color}}/><span className={textMuted}>{s.name}</span><span className="font-medium">{s.value}%</span></div>)}</div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                <div className={`rounded-2xl border ${bgCard} overflow-hidden`}>
                  <div className={`p-4 flex items-center justify-between border-b ${borderC}`}><div className="font-semibold text-[14px]">Follow-ups Today • {todayFollowUps.length}</div><button onClick={()=> setCurrentPage("followups")} className={`text-[12px] ${textMuted} hover:underline`}>View All</button></div>
                  <div className="divide-y divide-inherit">
                    {todayFollowUps.slice(0,4).map(f=> (
                      <div key={f.id} className="p-3.5 flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isDark?"bg-[#23233a]":"bg-slate-100"}`}><Phone size={14}/></div>
                        <div className="flex-1 min-w-0"><div className="text-[13px] font-medium truncate">{f.leadName} • {f.type}</div><div className={`text-[11px] ${textMuted} truncate`}>{f.time} • {f.property}</div></div>
                        <button onClick={()=> setFollowUps(followUps.map(x=> x.id===f.id? {...x, status:"Completed" as FollowUpStatus}: x))} className="h-7 px-2.5 rounded-lg bg-emerald-600 text-white text-[11px] font-medium flex items-center gap-1"><Check size={12}/>Done</button>
                      </div>
                    ))}
                    {todayFollowUps.length===0 && <div className={`p-6 text-center text-[13px] ${textMuted}`}>No follow-ups today 🎉</div>}
                  </div>
                </div>

                <div className={`rounded-2xl border ${bgCard} overflow-hidden`}>
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

                <div className={`rounded-2xl border p-4 ${bgCard}`}>
                  <div className="font-semibold text-[14px] mb-3 flex items-center gap-2"><Sparkles size={14} className="text-cyan-400"/>AI Insights</div>
                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl border ${isDark?"bg-[#1c1c2e] border-[#23233a]":"bg-indigo-50 border-indigo-100"}`}><div className="text-[12px] font-medium">Automation saved 23 hrs</div><div className={`text-[11px] ${textMuted} mt-1`}>Follow-ups auto-scheduled + invoices auto-sent</div></div>
                    <div className={`p-3 rounded-xl border ${isDark?"bg-[#1c1c2e] border-[#23233a]":"bg-cyan-50 border-cyan-100"}`}><div className="text-[12px] font-medium">Voice AI processed 42 calls</div><div className={`text-[11px] ${textMuted} mt-1`}>Avg sentiment positive • 3 leads qualified</div></div>
                    <div className={`p-3 rounded-xl border ${isDark?"bg-[#1c1c2e] border-[#23233a]":"bg-emerald-50 border-emerald-100"}`}><div className="text-[12px] font-medium">Payment prediction: 94% on time</div><div className={`text-[11px] ${textMuted} mt-1`}>INV-2026-001 likely paid within 5 days</div></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LEADS */}
          {currentPage==="leads" && (
            <div className="max-w-[1600px] mx-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h1 className="text-[22px] font-bold">Leads</h1><p className={`text-[13px] ${textMuted}`}>Track and manage potential clients</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => exportCsv("zootechx-leads.csv", filteredLeads.map((lead) => ({ Name: lead.name, Company: lead.company, Email: lead.email, Phone: lead.phone, Status: lead.status, Source: lead.source })))} className={`h-9 px-3 rounded-xl border text-[13px] flex items-center gap-2 ${bgCard}`}><Download size={16}/>Export</button>
                  <button onClick={()=> setShowAddLead(true)} className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-medium flex items-center gap-2"><Plus size={16}/>Add Lead</button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label:"Total Leads", value:leads.length },
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
                      {filteredLeads.map(l=> (
                        <tr key={l.id} className={`hover:${isDark?"bg-[#1a1a2e]":"bg-slate-50"} transition`}>
                          <td className="p-3 flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-[11px] font-bold">{l.avatar}</div><span className="text-[13px] font-medium">{l.name}</span></td>
                          <td className="p-3 text-[13px]">{l.company}</td>
                          <td className="p-3 text-[12px]"><div>{l.phone}</div><div className={`${textMuted} text-[11px] truncate max-w-[140px]`}>{l.email}</div></td>
                          <td className="p-3 text-[12px]">{l.propertyType} • {l.location}</td>
                          <td className="p-3 text-[12px]"><span className={`px-2 py-1 rounded-full border text-[11px] ${bgCard}`}>{l.source}</span></td>
                          <td className="p-3 text-[12px]">{l.assignedTo}</td>
                          <td className="p-3"><span className={`inline-flex items-center gap-1 text-[11px] ${l.priority==="High"?"text-red-600": l.priority==="Medium"?"text-amber-600":"text-zinc-500"}`}><span className={`h-2 w-2 rounded-full ${l.priority==="High"?"bg-red-500": l.priority==="Medium"?"bg-amber-500":"bg-zinc-400"}`}/>{l.priority}</span></td>
                          <td className="p-3"><span className={`text-[11px] px-2 py-1 rounded-full border ${
                            l.status==="New"?"bg-blue-500/10 text-blue-600 border-blue-500/20":
                            l.status==="Contacted"?"bg-slate-500/10 text-slate-600 border-slate-500/20":
                            l.status==="Follow-up"?"bg-amber-500/10 text-amber-600 border-amber-500/20":
                            l.status==="Qualified"?"bg-violet-500/10 text-violet-600 border-violet-500/20":
                            l.status==="Negotiation"?"bg-orange-500/10 text-orange-600 border-orange-500/20":
                            l.status==="Converted"?"bg-emerald-500/10 text-emerald-600 border-emerald-500/20":"bg-red-500/10 text-red-600 border-red-500/20"
                          }`}>{l.status}</span></td>
                          <td className="p-3 text-[12px]">{new Date(l.nextFollowUp).toLocaleDateString()}</td>
                          <td className="p-3 flex items-center gap-1">
                            <button onClick={()=> setSelectedLead(l)} className={`h-7 w-7 rounded-lg border flex items-center justify-center ${bgCard}`}><Eye size={14}/></button>
                            <button onClick={()=> {
                              const existing = clients.find(c=> c.businessName===l.company);
                              if(!existing){
                                const newClient: Client = { id:`C${String(clients.length+1).padStart(3,"0")}`, businessName:l.company||l.name, name:l.name, gstin:"", email:l.email, phone:l.phone, address:l.location, state:"27-Maharashtra", creditLimit:0 };
                                setClients([newClient, ...clients]);
                              }
                              setLeads(leads.map(x=> x.id===l.id? {...x, status:"Converted" as LeadStatus}: x));
                            }} className="h-7 px-2 rounded-lg bg-emerald-600 text-white text-[11px]">Convert</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* FOLLOW-UPS */}
          {currentPage==="followups" && (
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
                            <button onClick={()=> setFollowUps(followUps.map(x=> x.id===f.id? {...x, status:"Completed" as FollowUpStatus}: x))} className="h-7 px-2 rounded-lg bg-emerald-600 text-white text-[11px]">Complete</button>
                            <button onClick={()=> setFollowUps(followUps.filter(x=> x.id!==f.id))} className={`h-7 w-7 rounded-lg border flex items-center justify-center ${bgCard}`}><Trash2 size={12}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* INVOICES LIST */}
          {currentPage==="invoices" && (
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
          )}

          {/* CREATE NEW INVOICE PAGE - DEDICATED */}
          {currentPage==="invoices/new" && (
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
          )}

          {/* QUOTATIONS */}
          {currentPage==="quotations" && (
            <div className="max-w-[1200px] mx-auto space-y-4">
              <div className="flex items-center justify-between"><div><h1 className="text-[22px] font-bold">Quotations</h1><p className={`text-[13px] ${textMuted}`}>Manage quotes</p></div><button onClick={()=> setShowCreateQuote(true)} className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-medium flex items-center gap-2"><Plus size={16}/>Create Quotation</button></div>
              <div className={`rounded-2xl border overflow-hidden ${bgCard}`}><table className="w-full"><thead className={`${isDark?"bg-[#0f0f1a]":"bg-slate-50"} border-b ${borderC} text-[11px] ${textMuted} uppercase tracking-widest`}><tr><th className="text-left p-3">Quote ID</th><th className="text-left p-3">Client</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Valid Until</th><th className="text-left p-3">Status</th><th className="text-left p-3">Actions</th></tr></thead><tbody className={`divide-y ${borderC}`}>{quotations.map(q=> <tr key={q.id}><td className="p-3 mono text-[13px]">{q.id}</td><td className="p-3 text-[13px]">{q.clientName}</td><td className="p-3 font-semibold">₹{q.amount.toLocaleString()}</td><td className="p-3 text-[12px]">{q.validUntil}</td><td className="p-3"><span className={`text-[11px] px-2 py-1 rounded-full border ${q.status==="Sent"?"bg-blue-500/10 text-blue-600":"bg-slate-500/10 text-slate-600"}`}>{q.status}</span></td><td className="p-3 flex gap-1"><button onClick={()=> { const c = clients.find(x=> x.businessName===q.clientName); setNewInvoice({ number:`INV-2026-${String(invoices.length+1).padStart(3,"0")}`, date:new Date().toISOString().split("T")[0], dueDate:new Date(Date.now()+30*86400000).toISOString().split("T")[0], placeOfSupply:"27-Maharashtra", items:[{id:"1", name:`Services for ${q.clientName}`, hsn:"9972", qty:1, unit:"Nos", rate:q.amount/1.18, discount:0, gst:18}], amountPaid:0, clientId:c?.id||"", clientName:q.clientName, status:"Draft" }); setCurrentPage("invoices/new"); }} className="h-7 px-2 rounded-lg bg-indigo-600 text-white text-[11px]">Convert to Invoice</button></td></tr>)}</tbody></table></div>
            </div>
          )}

          {/* CLIENTS */}
          {currentPage==="clients" && (
            <div className="max-w-[1200px] mx-auto space-y-4">
              <div className="flex items-center justify-between"><div><h1 className="text-[22px] font-bold">Clients</h1><p className={`text-[13px] ${textMuted}`}>Manage your clients</p></div><button onClick={()=> setShowCreateClient(true)} className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[13px] font-medium flex items-center gap-2"><Plus size={16}/>Add Client</button></div>
              <div className={`rounded-2xl border overflow-hidden ${bgCard}`}><div className="overflow-x-auto"><table className="w-full min-w-[700px]"><thead className={`${isDark?"bg-[#0f0f1a]":"bg-slate-50"} border-b ${borderC} text-[11px] ${textMuted} uppercase tracking-widest`}><tr><th className="text-left p-3">Business</th><th className="text-left p-3">Contact</th><th className="text-left p-3">GSTIN</th><th className="text-left p-3">State</th><th className="text-left p-3">Credit Limit</th></tr></thead><tbody className={`divide-y ${borderC}`}>{clients.map(c=> <tr key={c.id}><td className="p-3"><div className="font-medium text-[13px]">{c.businessName}</div><div className={`text-[11px] ${textMuted}`}>{c.name}</div></td><td className="p-3 text-[12px]"><div>{c.email}</div><div className={textMuted}>{c.phone}</div></td><td className="p-3 mono text-[11px]">{c.gstin||"—"}</td><td className="p-3 text-[12px]">{c.state}</td><td className="p-3 text-[13px]">₹{c.creditLimit.toLocaleString()}</td></tr>)}</tbody></table></div></div>
            </div>
          )}

          {currentPage==="developers" && <DeveloperWorkspace admin />}

          {currentPage === "payments" && <div className="max-w-[1000px] mx-auto"><h1 className="text-[22px] font-bold mb-5">Payments</h1><div className={`rounded-2xl border overflow-hidden ${bgCard}`}><table className="w-full text-sm"><thead className={`${isDark?"bg-[#0f0f1a]":"bg-slate-50"}`}><tr><th className="p-3 text-left">Invoice</th><th className="p-3 text-left">Method</th><th className="p-3 text-right">Amount</th></tr></thead><tbody>{payments.map(payment => <tr key={payment.id} className={`border-t ${borderC}`}><td className="p-3">{payment.invoice_number}</td><td className="p-3">{payment.method}</td><td className="p-3 text-right font-semibold">₹{Number(payment.amount).toLocaleString()}</td></tr>)}{payments.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500">No payments recorded yet.</td></tr>}</tbody></table></div></div>}
          {currentPage === "expenses" && <div className="max-w-[1000px] mx-auto"><h1 className="text-[22px] font-bold mb-5">Expenses</h1><div className={`rounded-2xl border overflow-hidden ${bgCard}`}><table className="w-full text-sm"><thead className={`${isDark?"bg-[#0f0f1a]":"bg-slate-50"}`}><tr><th className="p-3 text-left">Expense</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Method</th><th className="p-3 text-right">Amount</th></tr></thead><tbody>{expenses.map(expense => <tr key={expense.id} className={`border-t ${borderC}`}><td className="p-3">{expense.title}</td><td className="p-3">{expense.category}</td><td className="p-3">{expense.payment_method || "—"}</td><td className="p-3 text-right font-semibold">₹{Number(expense.amount).toLocaleString()}</td></tr>)}{expenses.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No expenses recorded yet.</td></tr>}</tbody></table></div></div>}
          {currentPage === "settings" && (
            <div className="max-w-[800px] mx-auto text-center py-20">
              <div className={`h-16 w-16 mx-auto rounded-2xl flex items-center justify-center ${isDark?"bg-[#1c1c2e]":"bg-slate-100"} mb-4`}><Building2 size={28} className={textMuted}/></div>
              <h2 className="text-[20px] font-bold capitalize">{currentPage}</h2><p className={`text-[13px] ${textMuted} mt-2`}>This module is part of ZootechX.ai ERP suite • Coming integrated with AI automation</p>
            </div>
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
                  <input type="date" value={leadForm.nextFollowUp? new Date(leadForm.nextFollowUp).toISOString().split("T")[0] : ""} onChange={e=> setLeadForm({...leadForm, nextFollowUp:new Date(e.target.value).toISOString()})} className={`h-9 rounded-xl border px-2 text-[12px] ${inputCls}`}/>
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
              <div><label className="text-[11px] font-medium">Lead / Client</label><select value={followUpForm.leadId||""} onChange={e=> { const l = leads.find(x=> x.id===e.target.value); setFollowUpForm({...followUpForm, leadId:e.target.value, leadName:l?.name||"", company:l?.company||"", property:`${l?.propertyType} - ${l?.location}`}); }} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option value="">Select lead</option>{leads.map(l=> <option key={l.id} value={l.id}>{l.name} - {l.company}</option>)}</select></div>
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
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] font-medium">Valid Until</label><input type="date" value={quoteForm.validUntil||""} onChange={e=> setQuoteForm({...quoteForm, validUntil:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}/></div><div><label className="text-[11px] font-medium">Status</label><select value={quoteForm.status} onChange={e=> setQuoteForm({...quoteForm, status:e.target.value})} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] ${inputCls}`}><option>Draft</option><option>Sent</option><option>Accepted</option></select></div></div>
              <button onClick={()=> { if(!quoteForm.clientName||!quoteForm.amount) return; const q: Quotation = { id:`Q${String(quotations.length+1).padStart(3,"0")}`, clientName:quoteForm.clientName!, amount:quoteForm.amount!, validUntil:quoteForm.validUntil||new Date(Date.now()+15*86400000).toISOString().split("T")[0], status:quoteForm.status||"Draft" }; setQuotations([q, ...quotations]); setShowCreateQuote(false); setQuoteForm({ status:"Draft" }); }} className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-[13px]">Save Quotation</button>
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
              <button onClick={()=> { const existing = clients.find(c=> c.businessName===selectedLead.company); if(!existing){ const newClient: Client = { id:`C${String(clients.length+1).padStart(3,"0")}`, businessName:selectedLead.company||selectedLead.name, name:selectedLead.name, gstin:"", email:selectedLead.email, phone:selectedLead.phone, address:selectedLead.location, state:"27-Maharashtra", creditLimit:0 }; setClients([newClient, ...clients]); } setLeads(leads.map(x=> x.id===selectedLead.id? {...x, status:"Converted" as LeadStatus}: x)); setSelectedLead(null); }} className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-[13px]">Convert to Client</button>
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
