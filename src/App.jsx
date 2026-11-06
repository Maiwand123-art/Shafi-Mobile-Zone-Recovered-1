import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import { Home, Mobiles, PhoneDetails } from "./pages/Store";
import { Login, Signup, ForgotPassword } from "./pages/Auth";
import { Account, AccountList, Profile } from "./pages/Account";

import {
  AdminHome,
  AdminMobiles,
  MobileEditor,
  AdminRequests,
  AdminMessages,
  AdminSales,
  AdminSoldMobiles,
  AdminLoans,
} from "./pages/Admin";

import Generic from "./pages/Generic";
import { allPages } from "./data/pages";
import { isSupabaseConfigured } from "./lib/supabase";

function ConfigNotice() {
  return !isSupabaseConfigured ? (
    <div className="config-notice">
      <b>Setup required:</b> Add your Supabase URL and publishable/anon key to{" "}
      <code>.env</code>, then run the SQL in <code>supabase/schema.sql</code>.
    </div>
  ) : null;
}

export default function App() {
  return (
    <>
      <ConfigNotice />

      <Routes>
        <Route element={<Layout />}>
          {/* STORE */}
          <Route index element={<Home />} />
          <Route path="/mobiles" element={<Mobiles />} />
          <Route path="/mobiles/:id" element={<PhoneDetails />} />

          {/* AUTHENTICATION */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* CUSTOMER ACCOUNT */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account/requests"
            element={
              <ProtectedRoute>
                <AccountList kind="requests" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account/messages"
            element={
              <ProtectedRoute>
                <AccountList kind="messages" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account/saved"
            element={
              <ProtectedRoute>
                <AccountList kind="saved mobiles" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account/:section"
            element={
              <ProtectedRoute>
                <Generic />
              </ProtectedRoute>
            }
          />

          {/* ADMIN DASHBOARD */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute admin>
                <AdminHome />
              </ProtectedRoute>
            }
          />

          {/* MOBILE MANAGEMENT */}
          <Route
            path="/admin/mobiles"
            element={
              <ProtectedRoute admin>
                <AdminMobiles />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/mobiles/new"
            element={
              <ProtectedRoute admin>
                <MobileEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/mobiles/:id/edit"
            element={
              <ProtectedRoute admin>
                <MobileEditor edit />
              </ProtectedRoute>
            }
          />

          {/* CUSTOMER REQUESTS */}
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute admin>
                <AdminRequests />
              </ProtectedRoute>
            }
          />

          {/* CUSTOMER MESSAGES */}
          <Route
            path="/admin/messages"
            element={
              <ProtectedRoute admin>
                <AdminMessages />
              </ProtectedRoute>
            }
          />

          {/* SALES MANAGEMENT */}
          <Route
            path="/admin/sales"
            element={
              <ProtectedRoute admin>
                <AdminSales />
              </ProtectedRoute>
            }
          />

          {/* SOLD MOBILES HISTORY */}
          <Route
            path="/admin/sold-mobiles"
            element={
              <ProtectedRoute admin>
                <AdminSoldMobiles />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/loans"
            element={
              <ProtectedRoute admin>
                <AdminLoans />
              </ProtectedRoute>
            }
          />
          {/* OTHER ADMIN PAGES */}
          <Route
            path="/admin/:section"
            element={
              <ProtectedRoute admin>
                <Generic />
              </ProtectedRoute>
            }
          />

          {/* OTHER PAGES */}
          {allPages
            .filter(
              ([, p]) =>
                ![
                  "/",
                  "/mobiles",
                  "/login",
                  "/signup",
                  "/forgot-password",
                  "/account",
                  "/account/profile",
                  "/account/requests",
                  "/account/messages",
                  "/account/saved",
                  "/admin",
                  "/admin/mobiles",
                  "/admin/mobiles/new",
                  "/admin/requests",
                  "/admin/messages",
                  "/admin/sales",
                  "/admin/sold-mobiles",
                  "/admin/loans",
                ].includes(p),
            )
            .map(([n, p]) => (
              <Route key={p} path={p} element={<Generic />} />
            ))}

          <Route path="*" element={<Generic />} />
        </Route>
      </Routes>
    </>
  );
}
