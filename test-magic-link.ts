async function main() {
  const res = await fetch("https://course.aimodelmethods.com/api/auth/magic-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "chiconouer2004@gmail.com" }),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(data, null, 2));
}

main();
