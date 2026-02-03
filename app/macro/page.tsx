export const dynamic = 'force-dynamic';
import MacroLineChart from '@/components/MacroLineChart';

async function fetchSeries(slug: string) {
  try {
    const res = await fetch(`https://macro-api-l59k.onrender.com/series/${slug}`, { 
      cache: 'no-store' 
    });

    if (!res.ok) {
      console.error(`API Error: ${res.status}`);
      return { data: [] };
    }

    const json = await res.json();

    // SAFETY CHECK: This prevents the 'map' error by ensuring data exists
    if (!json || !json.data || !Array.isArray(json.data)) {
      console.error(`Invalid data format for ${slug}:`, json);
      return { data: [] };
    }

    const cleanData = json.data.map((item: any) => ({
      time: item.date,
      value: item.value
    }));

    return { ...json, data: cleanData };
  } catch (error) {
    console.error(`Fetch failed for ${slug}:`, error);
    return { data: [] };
  }
}

export default async function MacroPage() {
  const [gdp, unemployment] = await Promise.all([
      fetchSeries('real_gdp'), 
      fetchSeries('unemployment_rate')
  ]);

  return (
    <main className="macro-grid">
      {/* SIDEBAR (Watchlist) */}
      <aside className="card">
        <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.5, marginBottom: 16, letterSpacing: 1 }}>
          WATCHLIST
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <WatchlistItem label="S&P 500" value="4,783.45" change="+0.54%" isPositive={true} />
          <WatchlistItem label="10Y Yield" value="4.12%" change="-0.05%" isPositive={false} />
          <WatchlistItem label="USD Index" value="103.40" change="+0.12%" isPositive={true} />
          <div style={{ height: 1, background: '#1b2226', margin: '8px 0' }} />
          <WatchlistItem label="Real GDP" value="27.6T" change="+3.3%" isPositive={true} />
          <WatchlistItem label="Unemployment" value="3.7%" change="0.0%" isPositive={true} />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <section style={{ display: 'grid', gap: 20 }}>
        {/* Header with DEBUG RED TEXT */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>Sage's Terminal</h1>
            <span style={{ color: 'red', fontSize: 10, fontWeight: 'bold' }}>VERSION 2.0 (LIVE)</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.5 }}>LIVE CONNECTION: ACTIVE</div>
        </div>

        {/* Charts */}
        <div className="card">
          <MacroLineChart
            title="Economic Output"
            subtitle="Real GDP (Billions)"
            series={[{ id: 'gdp', name: 'Real GDP', data: gdp.data }]}
            defaultRange="MAX"
          />
        </div>

        <div className="card">
          <MacroLineChart
            title="Labor Market"
            subtitle="Unemployment Rate (%)"
            series={[{ id: 'ur', name: 'Unemployment', data: unemployment.data, unit: '%' }]}
            defaultRange="5Y"
          />
        </div>
      </section>
    </main>
  );
}

// Helper Component for the Watchlist items
function WatchlistItem({ label, value, change, isPositive }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <div>{value}</div>
        <div style={{ fontSize: 11, color: isPositive ? '#4caf50' : '#ff5252' }}>{change}</div>
      </div>
    </div>
  );
}