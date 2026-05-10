async function test() {
  console.log("=== Testing Render backend directly ===");
  
  // Test 1: Check if API responds
  try {
    const res = await fetch("https://evalix-o7pd.onrender.com/api/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    console.log("Status:", res.status);
    const data = await res.text();
    console.log("Response:", data.substring(0, 500));
  } catch (err) {
    console.error("Error:", err.message);
  }

  // Test 2: Try register
  console.log("\n=== Testing register ===");
  try {
    const res = await fetch("https://evalix-o7pd.onrender.com/api/auth/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "testprod", email: "test@prod.com", password: "testpass123", password2: "testpass123", role: "student" }),
    });
    console.log("Status:", res.status);
    const data = await res.text();
    console.log("Response:", data.substring(0, 500));
  } catch (err) {
    console.error("Error:", err.message);
  }

  // Test 3: Check Vercel proxy
  console.log("\n=== Testing Vercel proxy ===");
  try {
    const res = await fetch("https://evalix-bice.vercel.app/api/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    console.log("Status:", res.status);
    const data = await res.text();
    console.log("Response:", data.substring(0, 500));
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
