async function test() {
  // Try login as admin with correct password
  const res = await fetch("https://evalix-o7pd.onrender.com/api/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "20082008o" }),
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}
test();
