'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle, IChartApi, ISeriesApi } from 'lightweight-charts';

type Point = { time: string; value: number };

type SeriesDef = {
  id: string;
  name: string;
  unit?: string; // "YoY %" etc
  data: Point[];
};

type RangeKey = '1Y' | '5Y' | 'MAX';

function filterRange(data: Point[], range: RangeKey): Point[] {
  if (range === 'MAX') return data;
  const last = data[data.length - 1];
  if (!last) return data;
  
  const lastDate = new Date(last.time);
  const cutoff = new Date(lastDate);
  cutoff.setFullYear(lastDate.getFullYear() - (range === '1Y' ? 1 : 5));
  
  return data.filter(d => new Date(d.time) >= cutoff);
}

export default function MacroLineChart({
  title,
  subtitle,
  series,
  defaultRange = '5Y',
}: {
  title: string;
  subtitle?: string;
  series: SeriesDef[];
  defaultRange?: RangeKey;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Record<string, ISeriesApi<'Line'> | null>>({});

  const [range, setRange] = useState<RangeKey>(defaultRange);

  const ranged = useMemo(() => {
    return series.map(s => ({ ...s, data: filterRange(s.data, range) }));
  }, [series, range]);

  useEffect(() => {
    if (!hostRef.current) return;

    // Create chart once
    const chart = createChart(hostRef.current, {
      height: 420,
      layout: {
        background: { type: ColorType.Solid, color: '#0b0f0f' },
        textColor: '#e8ecf3',
        fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.06)' },
        horzLines: { color: 'rgba(255,255,255,0.06)' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.12)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.12)', timeVisible: true },
      crosshair: {
        vertLine: { style: LineStyle.Solid, labelBackgroundColor: '#d4af37' },
        horzLine: { style: LineStyle.Solid, labelBackgroundColor: '#d4af37' },
      },
    });

    chartRef.current = chart;

    // Responsive width
    const ro = new ResizeObserver(() => {
      if (!hostRef.current) return;
      chart.applyOptions({ width: hostRef.current.clientWidth });
    });

    ro.observe(hostRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = {};
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Remove old series (simple + robust)
    Object.values(seriesRefs.current).forEach(s => {
      if (s) chart.removeSeries(s);
    });
    seriesRefs.current = {};

    // Add series
    ranged.forEach((s, idx) => {
      const line = chart.addLineSeries({
        lineWidth: 2,
        lineStyle: idx === 0 ? LineStyle.Solid : LineStyle.Dashed,
        color: idx === 0 ? '#d4af37' : undefined, // Gold for primary, auto for others
      });
      
      // Fix: Typescript expects strict types, we cast if needed or ensure data is right
      line.setData(s.data as any); 
      seriesRefs.current[s.id] = line;
    });

    chart.timeScale().fitContent();
  }, [ranged]);

  return (
    <div style={{ border: '1px solid #1b2226', borderRadius: 16, overflow: 'hidden', background: '#0b0f0f' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '14px 14px 10px' }}>
        <div>
          <div style={{ fontWeight: 800, letterSpacing: 0.2, color: '#fff' }}>{title}</div>
          {subtitle && <div style={{ opacity: 0.7, fontSize: 13, color: '#ccc' }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['1Y', '5Y', 'MAX'] as RangeKey[]).map(k => (
            <button
              key={k}
              onClick={() => setRange(k)}
              style={{
                borderRadius: 10,
                padding: '8px 10px',
                border: '1px solid #2a2f33',
                background: k === range ? 'rgba(212,175,55,0.10)' : '#121619',
                color: '#e8ecf3',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <div ref={hostRef} style={{ width: '100%' }} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '10px 14px 14px', opacity: 0.85, fontSize: 12 }}>
        {series.map(s => (
          <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 10, height: 2, background: '#e8ecf3', display: 'inline-block' }} />
            <span style={{ fontWeight: 800, color: '#fff' }}>{s.name}</span>
            {s.unit && <span style={{ opacity: 0.7, color: '#ccc' }}>{s.unit}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}