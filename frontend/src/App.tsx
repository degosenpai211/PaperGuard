import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import UploadPage from "./pages/UploadPage";
import StatusPage from "./pages/StatusPage";
import ReportPage from "./pages/ReportPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<UploadPage />} />
        <Route path="/status/:id" element={<StatusPage />} />
        <Route path="/report/:id" element={<ReportPage />} />
      </Route>
    </Routes>
  );
}
