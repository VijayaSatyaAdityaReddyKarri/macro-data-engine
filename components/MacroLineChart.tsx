'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Custom plugin to draw the gray recession bars
const recessionPlugin = {
  id: 'recessionBars',
  beforeDraw: (chart: any, args: any, options: any) => {
    const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
    const recessionData = options.data;

    if (!recessionData || recessionData.length === 0) return;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // Very subtle gray for dark mode

    recessionData.forEach((point: any, index: number) => {
      if (point.value === 1) {
        const xPos = x.getPixelForValue(point.time);
        const nextXPos = x.getPixelForValue(recessionData[index + 1]?.time || point.time);
        const width = Math.max(nextXPos - xPos, 2); // Ensure bar is visible
        ctx.fillRect(xPos, top, width, bottom - top);
      }
    });
    ctx.restore();
  }
};

interface MacroLineChartProps {
  title: string;
  subtitle?: string;
  series: {
    id: string;
    name?: string;
    data: { time: string; value: number }[];
    unit?: string;
  }[];
  recessions?: { time: string; value: number }[];
}

export default function MacroLineChart({ title, subtitle, series, recessions }: MacroLineChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1b2226',
        titleColor: '#888',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
      // Passing recession data into our custom plugin
      recessionBars: {
        data: recessions || []
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#444', maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
      },
      y: {
        grid: { color: '#1b2226' },
        ticks: { color: '#888' }
      }
    }
  };

  const data = {
    labels: series[0]?.data.map(d => d.time) || [],
    datasets: series.map(s => ({
      label: s.name || s.id,
      data: s.data.map(d => d.value),
      borderColor: '#fccb0b', // Sage Gold
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.1,
    }))
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' }}>{title}</h3>
        {subtitle && <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{subtitle}</p>}
      </div>
      <Line options={options as any} data={data} plugins={[recessionPlugin]} />
    </div>
  );
}