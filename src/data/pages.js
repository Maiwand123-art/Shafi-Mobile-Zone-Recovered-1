export const publicPages = [
  ["Home", "/"], ["All Mobiles", "/mobiles"], ["Latest Mobiles", "/latest"], ["Featured Mobiles", "/featured"],
  ["Popular Mobiles", "/popular"], ["Best Rated", "/best-rated"], ["New Phones", "/new-phones"], ["Used Phones", "/used-phones"],
  ["Apple", "/brands/apple"], ["Samsung", "/brands/samsung"], ["Google", "/brands/google"], ["Xiaomi", "/brands/xiaomi"],
  ["Oppo", "/brands/oppo"], ["Vivo", "/brands/vivo"], ["Realme", "/brands/realme"], ["Mobile Compare", "/compare"],
  ["Offers", "/offers"], ["About Us", "/about"], ["Contact", "/contact"], ["FAQ", "/faq"],
  ["Privacy Policy", "/privacy"], ["Terms", "/terms"], ["Warranty", "/warranty"], ["Store Location", "/location"]
];
export const userPages = [
  ["Sign Up", "/signup"], ["Login", "/login"], ["Forgot Password", "/forgot-password"], ["My Account", "/account"],
  ["My Profile", "/account/profile"], ["My Requests", "/account/requests"], ["My Messages", "/account/messages"],
  ["Saved Mobiles", "/account/saved"], ["Notifications", "/account/notifications"], ["Change Password", "/account/password"],
  ["Account Settings", "/account/settings"]
];
export const adminPages = [
  ["Admin Dashboard", "/admin"], ["Manage Mobiles", "/admin/mobiles"], ["Add Mobile", "/admin/mobiles/new"],
  ["Requests", "/admin/requests"], ["Messages", "/admin/messages"], ["Customers", "/admin/customers"],
  ["Sales", "/admin/sales"], ["Analytics", "/admin/analytics"], ["Ratings", "/admin/ratings"],
  ["Inventory", "/admin/inventory"], ["Settings", "/admin/settings"]
];
export const allPages = [...publicPages, ...userPages, ...adminPages];
