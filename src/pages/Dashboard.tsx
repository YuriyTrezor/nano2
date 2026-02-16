import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import OverviewTab from "@/components/dashboard/OverviewTab";
import TransfersTab from "@/components/dashboard/TransfersTab";
import CardsTab from "@/components/dashboard/CardsTab";
import DepositsTab from "@/components/dashboard/DepositsTab";
import CreditsTab from "@/components/dashboard/CreditsTab";
import AdminTab from "@/components/dashboard/AdminTab";
import SupportTab from "@/components/dashboard/SupportTab";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<OverviewTab />} />
        <Route path="transfers" element={<TransfersTab />} />
        <Route path="cards" element={<CardsTab />} />
        <Route path="deposits" element={<DepositsTab />} />
        <Route path="credits" element={<CreditsTab />} />
        <Route path="admin" element={<AdminTab />} />
        <Route path="support" element={<SupportTab />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
