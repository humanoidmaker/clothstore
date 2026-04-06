export function generateOrderNumber(): string {
  const now = new Date();
  const istDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day = String(istDate.getDate()).padStart(2, "0");

  const random = String(Math.floor(1000 + Math.random() * 9000));

  return `ORD-${year}${month}${day}-${random}`;
}
