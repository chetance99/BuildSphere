import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import DashboardLayout from "./layout/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import WorkList from "./pages/WorkItems/WorkList";
import WorkDetails from "./pages/WorkItems/WorkDetails";
import WorkResourceDetails from "./pages/WorkItems/WorkResourceDetails";
import ResourcesList from "./pages/Resources/ResourcesList";
import ResourceDetails from "./pages/Resources/ResourcesDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Login />} />

        {/* DASHBOARD LAYOUT */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/worklist" element={<WorkList />} />

          {/* WORK DETAILS (PARENT LAYOUT) */}
          <Route path="/workdetails/:id" element={<WorkDetails />}>
            {/* default work details view */}
            <Route index element={null} />

            {/* NESTED: work resources */}
            <Route
              path="workresources"
              element={<WorkResourceDetails />}
            />
          </Route>

          {/* RESOURCES MASTER */}
          <Route path="/resources" element={<ResourcesList />} />
          <Route path="/resources/:id" element={<ResourceDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
