import React, { useState, useEffect } from 'react';

export default function PlantMonitor() {
  const [data, setData] = useState({
    temp: 25,
    humidity: 60,
    soil: 45,
    light: 70,
    moisture: 55
  });

  const [history, setHistory] = useState([]);
  const [actions, setActions] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const limits = {
    temp: 30,
    humidity: 80,
    soil: 70,
    light: 90,
    moisture: 80
  };

  const colors = {
    temp: '#f59e0b',
    humidity: '#3b82f6',
    soil: '#8b5cf6',
    light: '#eab308',
    moisture: '#06b6d4'
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setData(prev => {
        const newData = {
          temp: Math.max(15, Math.min(40, prev.temp + (Math.random() - 0.5) * 3)),
          humidity: Math.max(30, Math.min(95, prev.humidity + (Math.random() - 0.5) * 5)),
          soil: Math.max(20, Math.min(90, prev.soil + (Math.random() - 0.5) * 4)),
          light: Math.max(40, Math.min(100, prev.light + (Math.random() - 0.5) * 6)),
          moisture: Math.max(30, Math.min(95, prev.moisture + (Math.random() - 0.5) * 4))
        };
        
        setHistory(prev => {
          const newHistory = [...prev, { ...newData, time: Date.now() }];
          return newHistory.slice(-30);
        });
        
        return newData;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const newActions = [];
    if (data.temp > limits.temp && !actions.find(a => a.type === 'temp')) {
      newActions.push({ type: 'temp', msg: 'Turn on fan?' });
    }
    if (data.humidity > limits.humidity && !actions.find(a => a.type === 'humidity')) {
      newActions.push({ type: 'humidity', msg: 'Increase ventilation?' });
    }
    if (data.soil > limits.soil && !actions.find(a => a.type === 'soil')) {
      newActions.push({ type: 'soil', msg: 'Reduce watering?' });
    }
    if (data.light > limits.light && !actions.find(a => a.type === 'light')) {
      newActions.push({ type: 'light', msg: 'Add shade?' });
    }
    if (newActions.length > 0) {
      setActions(prev => [...prev, ...newActions]);
    }
  }, [data]);

  const RadarChart = () => {
    const params = ['temp', 'humidity', 'soil', 'light', 'moisture'];
    const labels = ['Temp', 'Humidity', 'Soil', 'Light', 'Moisture'];
    const cx = 200;
    const cy = 200;
    const r = 150;

    const getPoint = (index, value) => {
      const angle = (Math.PI * 2 * index / 5) - Math.PI / 2;
      const radius = (value / 100) * r;
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      };
    };

    const safePoints = params.map((p, i) => getPoint(i, limits[p]));
    const dataPoints = params.map((p, i) => getPoint(i, data[p]));

    const safePath = safePoints.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ') + ' Z';

    const dataPath = dataPoints.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ') + ' Z';

    return (
      <svg width="400" height="400" style={{background: '#1a1a2e', borderRadius: '10px'}}>
        {[0.25, 0.5, 0.75, 1].map(ratio => (
          <circle key={ratio} cx={cx} cy={cy} r={r * ratio} fill="none" stroke="rgba(255,255,255,0.1)" />
        ))}
        {params.map((_, i) => {
          const p = getPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.1)" />;
        })}
        <path d={safePath} fill="rgba(74,222,128,0.1)" stroke="#4ade80" strokeWidth="2" />
        <path d={dataPath} fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth="3" />
        {dataPoints.map((p, i) => {
          const isAlert = data[params[i]] > limits[params[i]];
          return (
            <circle key={i} cx={p.x} cy={p.y} r="6" fill={isAlert ? '#f87171' : '#3b82f6'} stroke="white" strokeWidth="2" />
          );
        })}
        {labels.map((label, i) => {
          const p = getPoint(i, 110);
          return <text key={i} x={p.x} y={p.y} fill="white" fontSize="14" textAnchor="middle">{label}</text>;
        })}
      </svg>
    );
  };

  const CombinedLineGraph = () => {
    const width = 1200;
    const height = 400;
    const padding = 60;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    if (history.length < 2) {
      return (
        <div style={{height: '400px', background: '#1a1a2e', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'}}>
          Collecting data... Wait a few seconds
        </div>
      );
    }

    const params = ['temp', 'humidity', 'soil', 'light', 'moisture'];
    const maxValue = 100;
    const minValue = 0;

    const allPaths = params.map(param => {
      const points = history.map((h, i) => {
        const x = padding + (i / (history.length - 1)) * graphWidth;
        const y = padding + graphHeight - ((h[param] - minValue) / (maxValue - minValue)) * graphHeight;
        return { x, y, value: h[param], time: h.time, param };
      });
      const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      return { param, pathData, points, color: colors[param] };
    });

    const thresholdLines = params.map(param => {
      const threshold = limits[param];
      const thresholdY = padding + graphHeight - ((threshold - minValue) / (maxValue - minValue)) * graphHeight;
      return { param, threshold, y: thresholdY, color: colors[param] };
    });

    return (
      <div style={{position: 'relative'}}>
        <svg 
          width={width} 
          height={height} 
          style={{background: '#1a1a2e', borderRadius: '10px'}}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          
          {[0, 25, 50, 75, 100].map(val => {
            const y = padding + graphHeight - ((val - minValue) / (maxValue - minValue)) * graphHeight;
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2,2" />
                <text x={padding - 10} y={y + 5} fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="end">{val}</text>
              </g>
            );
          })}

          {thresholdLines.map(line => (
            <line 
              key={line.param} 
              x1={padding} 
              y1={line.y} 
              x2={width - padding} 
              y2={line.y} 
              stroke={line.color} 
              strokeWidth="1" 
              strokeDasharray="5,5" 
              opacity="0.5"
            />
          ))}

          {allPaths.map(path => (
            <path 
              key={path.param} 
              d={path.pathData} 
              fill="none" 
              stroke={path.color} 
              strokeWidth="3"
              opacity="0.8"
            />
          ))}

          {allPaths.map(path => 
            path.points.map((p, i) => (
              <circle 
                key={`${path.param}-${i}`}
                cx={p.x} 
                cy={p.y} 
                r="5" 
                fill={path.color}
                stroke="white"
                strokeWidth="2"
                style={{cursor: 'pointer'}}
                onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, index: i })}
              />
            ))
          )}

          {hoveredPoint && (
            <line 
              x1={hoveredPoint.x} 
              y1={padding} 
              x2={hoveredPoint.x} 
              y2={height - padding} 
              stroke="white" 
              strokeWidth="2" 
              strokeDasharray="4,4"
              opacity="0.5"
            />
          )}

          <text x={padding} y={padding - 20} fill="white" fontSize="16" fontWeight="bold">All Sensor Data</text>
          <text x={width / 2} y={height - 10} fill="rgba(255,255,255,0.6)" fontSize="14" textAnchor="middle">Time →</text>
          <text x={15} y={height / 2} fill="rgba(255,255,255,0.6)" fontSize="14" transform={`rotate(-90, 15, ${height / 2})`}>Value</text>
        </svg>

        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            left: hoveredPoint.x + 70,
            top: hoveredPoint.y - 80,
            background: 'rgba(0, 0, 0, 0.9)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '10px',
            padding: '15px',
            color: 'white',
            fontSize: '14px',
            pointerEvents: 'none',
            minWidth: '150px'
          }}>
            <div style={{fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '5px'}}>
              Point {hoveredPoint.index + 1}
            </div>
            {params.map(param => {
              const value = history[hoveredPoint.index][param];
              const isAlert = value > limits[param];
              return (
                <div key={param} style={{marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{color: colors[param], fontWeight: 'bold'}}>{param.toUpperCase()}:</span>
                  <span style={{color: isAlert ? '#f87171' : 'white', fontWeight: 'bold'}}>
                    {value.toFixed(1)}{param === 'temp' ? '°C' : '%'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px', flexWrap: 'wrap'}}>
          {params.map(param => (
            <div key={param} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <div style={{width: '20px', height: '3px', background: colors[param]}}></div>
              <span style={{fontSize: '14px'}}>{param.toUpperCase()}</span>
              <span style={{fontSize: '12px', opacity: 0.7}}>(limit: {limits[param]})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', padding: '20px', color: 'white', fontFamily: 'Arial'}}>
      <div style={{maxWidth: '1400px', margin: '0 auto'}}>
        <h1 style={{textAlign: 'center', fontSize: '2.5em'}}>🌱 Plant Health Monitor</h1>
        <p style={{textAlign: 'center', opacity: 0.9, marginBottom: '30px'}}>Real-time AI monitoring with timeline tracking</p>
        
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
          <div style={{background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '20px'}}>
            <h2>Health Radar</h2>
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <RadarChart />
            </div>
          </div>
          
          <div>
            <div style={{background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '20px', marginBottom: '20px'}}>
              <h2>Live Readings</h2>
              {Object.entries(data).map(([key, val]) => {
                const isAlert = val > limits[key];
                return (
                  <div key={key} style={{display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '10px'}}>
                    <span>{key.toUpperCase()}</span>
                    <span style={{fontWeight: 'bold', fontSize: '1.2em', color: isAlert ? '#f87171' : '#4ade80'}}>
                      {val.toFixed(1)}{key === 'temp' ? '°C' : '%'}
                    </span>
                  </div>
                );
              })}
            </div>

            {Object.entries(data).some(([k, v]) => v > limits[k]) ? (
              <div style={{background: 'rgba(248,113,113,0.2)', border: '2px solid #f87171', borderRadius: '15px', padding: '20px', marginBottom: '20px'}}>
                <h3>🚨 Alerts</h3>
                {Object.entries(data).map(([k, v]) => {
                  if (v > limits[k]) {
                    return <div key={k}>⚠️ {k.toUpperCase()} too high: {v.toFixed(1)}</div>;
                  }
                  return null;
                })}
              </div>
            ) : (
              <div style={{background: 'rgba(74,222,128,0.2)', border: '2px solid #4ade80', borderRadius: '15px', padding: '20px', marginBottom: '20px'}}>
                <h3>✓ All Systems Normal</h3>
                <p>Plant is healthy! 🌿</p>
              </div>
            )}

            {actions.length > 0 && (
              <div style={{background: 'rgba(74,222,128,0.2)', border: '2px solid #4ade80', borderRadius: '15px', padding: '20px'}}>
                <h3>🤖 AI Recommendations</h3>
                {actions.map((action, i) => (
                  <div key={i} style={{background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '10px'}}>
                    <p>{action.msg}</p>
                    <button onClick={() => {
                      alert('Action approved: ' + action.type);
                      setActions(actions.filter((_, idx) => idx !== i));
                    }} style={{padding: '8px 20px', margin: '5px', background: '#4ade80', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'}}>
                      ✓ Yes
                    </button>
                    <button onClick={() => setActions(actions.filter((_, idx) => idx !== i))} style={{padding: '8px 20px', margin: '5px', background: '#94a3b8', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', color: 'white'}}>
                      ✗ No
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '20px'}}>
          <h2>📈 Sensor Data Over Time</h2>
          <CombinedLineGraph />
        </div>
      </div>
    </div>
  );
}
