'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

export default function MacroLineChart({ title, subtitle, series, defaultRange = 'MAX', unit = '' }: any) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'LEVEL' | 'YoY'>('LEVEL'); // The Toggle State

  useEffect(() => {
    if (!chartContainerRef.current || !series[0]?.data.length) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: 'rgba(42, 46, 57, 0.5)' }, horzLines: { color: 'rgba(42, 46, 57, 0.5)' } },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    const lineSeries = chart.addLineSeries({
      color: '#ffd700',
      lineWidth: 2,
    });

    // --- CALCULATION LOGIC ---
    let displayData = series[0].data;

    if (mode === 'YoY') {
      // Calculate % change from 1 year (12 months/4 quarters) ago
      const lookback = series[0].id === 'gdp' ? 4 : 12; 
      displayData = series[0].data.map((item: any, index: number) => {
        if (index < lookback) return null;
        const prevValue = series[0].data[index - lookback].value;
        const yoy = ((item.value / prevValue) - 1) * 100;
        return { time: item.time, value: yoy };
      }).filter((i: any) => i !== null);
    }

    lineSeries.setData(displayData);
    chart.timeScale().fitContent();

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [series, mode]);

  return (
    <div className="card-glass" style={{ padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{title}</div>
          <div style={{ fontSize: '12px', opacity: 0.6 }}>{subtitle}</div>
        </div>
        {/* THE TOGGLE BUTTONS */}
        <div style={{ display: 'flex', gap: '5px', background: '#1b2226', padding: '2px', borderRadius: '6px' }}>
          <button 
            onClick={() => setMode('LEVEL')}
            style={{ padding: '4px 8px', fontSize: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: mode === 'LEVEL' ? '#ffd700' : 'transparent', color: mode === 'LEVEL' ? 'black' : 'white' }}
          >LEVEL</button>
          <button 
            onClick={() => setMode('YoY')}
            style={{ padding: '4px 8px', fontSize: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: mode === 'YoY' ? '#ffd700' : 'transparent', color: mode === 'YoY' ? 'black' : 'white' }}
          >YoY %</button>
        </div>
      </div>
      <div ref={chartContainerRef} />
    </div>
  );
}