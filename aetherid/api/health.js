export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: "ok",
    protocol: "Amane Protocol",
    model: "Liaison Model (tive-ai)",
    network: "Base L2",
    chainId: 8453,
    timestamp: new Date().toISOString()
  });
}