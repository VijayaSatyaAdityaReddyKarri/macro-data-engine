import MacroLineChart from '@/components/MacroLineChart';

// Force the page to always fetch fresh data from the API
export const dynamic = 'force-dynamic';

async function fetchSeries(slug: string) {
  try {
    const res = await fetch(`https://macro-api-l59k.onrender.com/series/${slug}`, { 
      cache: 'no-store' 
    });

    if (!res.ok) return { data: [] };
    const json = await res.json();

    if (!json || !json.data || !Array.isArray(json.data)) return { data: [] };

    // DATA FIX: Formats the data correctly for the chart library
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
  // Parallel Fetching: Grabbing 4 series from your database
  const [gdp, unemployment, cpi, fedFunds] = await Promise.all([
    fetchSeries('real_gdp'),
    fetchSeries('unemployment_rate'),
    fetchSeries('cpi_headline'),
    fetchSeries('fed_funds')
  ]);

  // DYNAMIC WATCHLIST LOGIC: 
  // We grab the very last entry in the data arrays to show the "Latest" value in the sidebar
  const latestGDPValue = gdp.data.length > 0 ? gdp.data[gdp.data.length - 1].value : "---";
  const latestUnemploymentValue = unemployment.data.length > 0 ? unemployment.data[unemployment.data.length - 1].value : "---";

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', backgroundColor: 'transparent', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* TERMINAL HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #1b2226', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>SAGE TERMINAL</h1>
          <span style={{ color: '#ff5252', fontSize: '10px', fontWeight: 'bold' }}>VERSION 2.7 (LIVE)</span>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', opacity: 0.5 }}>
          <div>LIVE CONNECTION: <span style={{ color: '#4caf50' }}>ACTIVE</span></div>
          <div>REGION: US_MACRO</div>
        </div>
      </header>

      {/* GRID CONTAINER */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '25px' }}>
        
        {/* WATCHLIST */}
        <aside className="card" style={{ height: 'fit-content' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5, marginBottom: '20px', letterSpacing: '1px' }}>WATCHLIST</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Market data (Still static for now, we'll fix these next) */}
            <WatchlistItem label="S&P 500" value="4,906.19" change="+1.12%" isPositive={true} />
            <WatchlistItem label="US 10Y Yield" value="4.155%" change="-0.02%" isPositive={false} />
            <WatchlistItem label="DXY Index" value="104.12" change="+0.08%" isPositive={true} />
            
            <div style={{ height: '1px', background: '#1b2226', margin: '5px 0' }} />
            
            {/* DYNAMIC MACRO DATA: Pulling from your fetch calls above */}
            <WatchlistItem 
               label="Real GDP" 
               value={typeof latestGDPValue === 'number' ? `${(latestGDPValue / 1000).toFixed(1)}T` : "---"} 
               change="Latest" 
               isPositive={true} 
            />
            <WatchlistItem 
               label="Unemployment" 
               value={`${latestUnemploymentValue}%`} 
               change="Latest" 
               isPositive={false} 
            />
          </div>
        </aside>

        {/* MAIN CHART GRID */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
          
          <div className="card">
            <MacroLineChart 
              title="Inflation Monitor" 
              subtitle="Consumer Price Index (Headline)" 
              series={[{ id: 'cpi', name: 'CPI Index', data: cpi.data }]} 
            />
          </div>

          <div className="card">
            <MacroLineChart 
              title="Interest Rates" 
              subtitle="Effective Federal Funds Rate (%)" 
              series={[{ id: 'fed', name: 'Fed Funds', data: fedFunds.data, unit: '%' }]} 
            />
          </div>

          <div className="card">
            <MacroLineChart 
              title="Economic Growth" 
              subtitle="Real GDP (Billions)" 
              series={[{ id: 'gdp', name: 'Real GDP', data: gdp.data }]} 
            />
          </div>

          <div className="card">
            <MacroLineChart 
              title="Labor Market" 
              subtitle="Unemployment Rate (%)" 
              series={[{ id: 'ur', name: 'Unemployment', data: unemployment.data, unit: '%' }]} 
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function WatchlistItem({ label, value, change, isPositive }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 600, fontSize: '13px' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{value}</div>
        <div style={{ fontSize: '11px', color: isPositive ? '#4caf50' : '#ff5252' }}>{change}</div>
      </div>
    </div>
  );
}