export default async function handler(req, res) {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6&orientation=portrait`,
    { headers: { Authorization: 'VCGnJuEsUVYESjj3cvAPFsYSINI3alfKGu0TjXZoUadgEs2xn9xi9ypE' } }
  );

  const data = await response.json();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(data);
}
