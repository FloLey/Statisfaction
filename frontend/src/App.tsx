import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Activities from "./pages/Activities";
import ActivityDetail from "./pages/ActivityDetail";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/users/:userId" element={<Activities />} />
        <Route
          path="/activities/:activityId"
          element={<ActivityDetail />}
        />
      </Route>
    </Routes>
  );
}
