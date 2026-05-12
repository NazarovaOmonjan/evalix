async function fix() {
  // Login as admin (currently judge role)
  const loginRes = await fetch("https://evalix-o7pd.onrender.com/api/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "20082008o" }),
  });
  const loginData = await loginRes.json();
  const token = loginData.access;
  console.log("Logged in, current role:", loginData.user.role);

  // We need to fix the role directly in the database
  // Since admin API requires admin role, we need another approach
  // Let's update via the management command - update create_admin to force role
  console.log("User ID:", loginData.user.id);
  console.log("Need to fix role in database via management command");
}
fix();
