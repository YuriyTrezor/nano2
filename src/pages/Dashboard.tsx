import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import OverviewTab from "@/components/dashboard/OverviewTab";
import TransfersTab from "@/components/dashboard/TransfersTab";
import CardsTab from "@/components/dashboard/CardsTab";
import DepositsTab from "@/components/dashboard/DepositsTab";
import CreditsTab from "@/components/dashboard/CreditsTab";
import AdminTab from "@/components/dashboard/AdminTab";
import SupportTab from "@/components/dashboard/SupportTab";
import SettingsTab from "@/components/dashboard/SettingsTab";
import VerificationTab from "@/components/dashboard/VerificationTab";
import AdminVerificationsTab from "@/components/dashboard/AdminVerificationsTab";
import CurrencyRatesWidget from "@/components/dashboard/CurrencyRatesWidget";


const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<OverviewTab />} />
        <Route path="transfers" element={<TransfersTab />} />
        <Route path="cards" element={<CardsTab />} />
        <Route path="deposits" element={<DepositsTab />} />
        <Route path="credits" element={<CreditsTab />} />
        <Route path="rates" element={<CurrencyRatesWidget />} />
        <Route path="admin" element={<AdminTab />} />
        <Route path="support" element={<SupportTab />} />
        <Route path="settings" element={<SettingsTab />} />
        <Route path="verification" element={<VerificationTab />} />
        <Route path="verifications" element={<AdminVerificationsTab />} />
      </Routes>
      
    </DashboardLayout>
  );
};

export default Dashboard;
