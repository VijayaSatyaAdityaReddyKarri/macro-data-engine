import MacroLineChart from '@/components/MacroLineChart';

// Force the page to always fetch fresh data
export const dynamic = 'force-dynamic';

const ALPHA_VANTAGE_KEY = 'G3MRG40E7MG8QEOB';

/**
 * Fetches Live Market Data from Alpha Vantage
 * Uses SPY (S&P 500), UUP (Dollar Index), and IEF (Treasury Yield Proxy)
 */
async function fetchMarketPrice(symbol: string) {
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`,
      { next: { revalidate: 60 } } // Refresh data every minute
    );
    const data = await res.json();
    const quote = data["Global Quote"];
    
    if (!quote || !quote["05. price"]) {
      return { price: "---", change: "0.00%", pos: true };
    }

    const price = parseFloat(quote["05. price"]);
    const changePercent = quote["10. change percent"];
    
    return {
      price: price.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      change: changePercent,
      pos: !changePercent.startsWith('-')
    };
  } catch (error) {
    console.error(`Market fetch failed for ${symbol}:`, error);
    return { price: "ERR", change: "0.00%", pos: true };
  }
}

/**
 * Fetches Macro Series from your Render API
 */
async function fetchSeries(slug: string) {
  try {
    const res = await fetch(`https://macro-api-l59k.onrender.com/series/${slug}`, { 
      cache: 'no-store' 
    });

    if (!res.ok) return { data: [] };
    const json = await res.json();

    if (!json || !json.data || !Array.isArray(json.data)) return { data: [] };

    const cleanData = json.data.map((item: any) => ({
      time: item.date,
      value: item.value
    }));

    return { ...json, data: cleanData };
  } catch (error) {
    console.error(`Macro fetch failed for ${slug}:`, error);
    return { data: [] };
  }
}

export default async function MacroPage() {
  // 1. PARALLEL FETCHING: Market Data + Macro Database Data
  const [
    gdp, 
    unemployment, 
    cpi, 
    fedFunds, 
    recessions,
    sp500,
    dxy,
    yields
  ] = await Promise.all([
    fetchSeries('real_gdp'),
    fetchSeries('unemployment_rate'),
    fetchSeries('cpi_headline'),
    fetchSeries('fed_funds'),
    fetchSeries('recessions'),
    fetchMarketPrice('SPY'),  // S&P 500 Proxy
    fetchMarketPrice('UUP'),  // Dollar Index Proxy
    fetchMarketPrice('IEF')   // 7-10Y Treasury Proxy
  ]);

  // 2. DYNAMIC SIDEBAR LOGIC (Database values)
  const latestGDPValue = gdp.data.length > 0 ? gdp.data[gdp.data.length - 1].value : null;
  const latestUnemploymentValue = unemployment.data.length > 0 ? unemployment.data[unemployment.data.length - 1].value : null;

  return (
    <main style={{ maxWidth: '1450px', margin: '0 auto', padding: '20px', backgroundColor: 'transparent', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* TERMINAL HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #1b2226', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>SAGE TERMINAL</h1>
          <span style={{ color: '#ff5252', fontSize: '10px', fontWeight: 'bold' }}>VERSION 3.1 (TERMINAL GRID)</span>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', opacity: 0.5 }}>
          <div>LIVE CONNECTION: <span style={{ color: '#4caf50' }}>ACTIVE</span></div>
          <div>REGION: US_MACRO</div>
        </div>
      </header>

      {/* GRID CONTAINER */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '25px' }}>
        
        {/* WATCHLIST */}
        <aside className="card" style={{ height: 'fit-content', background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5, marginBottom: '20px', letterSpacing: '1px' }}>WATCHLIST</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Real-Time Market Assets from Alpha Vantage */}
            <WatchlistItem label="S&P 500 (SPY)" value={sp500.price} change={sp500.change} isPositive={sp500.pos} />
            <WatchlistItem label="US 10Y Yield (IEF)" value={yields.price} change={yields.change} isPositive={yields.pos} />
            <WatchlistItem label="DXY Index (UUP)" value={dxy.price} change={dxy.change} isPositive={dxy.pos} />
            
            <div style={{ height: '1px', background: '#1b2226', margin: '5px 0' }} />
            
            {/* Dynamic Macro Data from Database */}
            <WatchlistItem 
               label="Real GDP" 
               value={typeof latestGDPValue === 'number' ? `${(latestGDPValue / 1000).toFixed(1)}T` : "---"} 
               change="Latest" 
               isPositive={true} 
            />
            <WatchlistItem 
               label="Unemployment" 
               value={latestUnemploymentValue ? `${latestUnemploymentValue}%` : "---"} 
               change="Latest" 
               isPositive={latestUnemploymentValue < 5} 
            />
          </div>
        </aside>

        {/* MAIN TERMINAL GRID */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
          
          {/* BIG CHART: Inflation vs Policy (Spans 2 columns) */}
          <div className="card" style={{ gridColumn: '1 / -1', background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px' }}>
            <MacroLineChart 
              title="Monetary Policy & Inflation" 
              subtitle="CPI Headline Index vs. Effective Federal Funds Rate" 
              series={[
                { id: 'cpi', name: 'CPI Index', data: cpi.data },
                { id: 'fed', name: 'Fed Funds', data: fedFunds.data }
              ]} 
              recessions={recessions.data}
            />
          </div>

          {/* SECONDARY CHARTS */}
          <div className="card" style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px' }}>
            <MacroLineChart 
              title="Economic Growth" 
              subtitle="Real GDP (Billions)" 
              series={[{ id: 'gdp', name: 'Real GDP', data: gdp.data }]} 
              recessions={recessions.data}
            />
          </div>

          <div className="card" style={{ background: '#0b0f0f', border: '1px solid #1b2226', borderRadius: '16px', padding: '20px' }}>
            <MacroLineChart 
              title="Labor Market" 
              subtitle="Unemployment Rate (%)" 
              series={[{ id: 'ur', name: 'Unemployment', data: unemployment.data, unit: '%' }]} 
              recessions={recessions.data}
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
      <span style={{ fontWeight: 600, fontSize: '13px', color: '#aaa' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{value}</div>
        <div style={{ fontSize: '11px', color: isPositive ? '#4caf50' : '#ff5252' }}>{change}</div>
      </div>
    </div>
  );
}