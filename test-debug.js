async function test() {
  try {
    const res = await fetch("https://evalix-o7pd.onrender.com/api/auth/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "debuguser",
        email: "debug@test.com",
        password: "testpass123",
        password2: "testpass123",
        role: "student"
      }),
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text.substring(0, 3000));
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
