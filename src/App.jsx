import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;
const views = { kpis: 'v_dash_kpis', monthly: 'v_dash_monthly', categories: 'v_dash_top_categories', states: 'v_dash_revenue_by_state', delivery: 'v_dash_delivery_monthly', reviews: 'v_dash_review_by_delay', payments: 'v_dash_payment_mix' };
const colors = ['#3867e8', '#24a58b', '#f2a84a', '#8169d8', '#e56d72', '#4b9bb8'];
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money2 = money;
const number = new Intl.NumberFormat('pt-BR');
const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const decimals = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bucketOrder = ['early', 'on time', '1–3 days late', '4–7 days late', '8+ days late'];

function useDashboard() {
  const [result, setResult] = useState({ loading: true, data: {}, errors: {} });
  useEffect(() => {
    let mounted = true;
    if (!supabase) {
      setResult({ loading: false, data: {}, errors: { config: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart Vite.' } });
      return () => { mounted = false; };
    }
    Promise.all(Object.entries(views).map(async ([name, view]) => {
      const { data, error } = await supabase.from(view).select('*');
      return [name, data, error?.message];
    })).then((rows) => {
      if (!mounted) return;
      const data = {}; const errors = {};
      rows.forEach(([name, records, error]) => error ? errors[name] = error : data[name] = records ?? []);
      setResult({ loading: false, data, errors });
    });
    return () => { mounted = false; };
  }, []);
  return result;
}

function Loading() { return <div className="loading"><i />Loading live data…</div>; }
function ErrorMessage({ message }) { return <div className="error"><b>Could not load this data</b><span>{message}</span></div>; }
function Panel({ title, subtitle, loading, error, empty, wide = false, children }) {
  return <section className={`panel${wide ? ' wide' : ''}`}><header className="panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div><span className="panel-accent" /></header><div className="plot">{loading ? <Loading /> : error ? <ErrorMessage message={error} /> : empty ? <div className="empty">No rows were returned by this view.</div> : children}</div></section>;
}
function Tip({ active, payload, label, payment = false }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (payment) return <div className="tip"><b>{row.payment_type?.replaceAll('_', ' ')}</b><span>Value: {money2.format(+row.payment_value)}</span><span>Share: {pct.format(+row.share_of_value)}</span><span>Avg. installments: {decimals.format(+row.avg_installments)}</span></div>;
  return <div className="tip"><b>{label}</b>{payload.map((p) => {
    const v = +p.value;
    const formatted = p.dataKey.includes('rate') ? pct.format(v) : ['revenue', 'payment_value'].includes(p.dataKey) ? money2.format(v) : p.dataKey === 'avg_review_score' ? decimals.format(v) : number.format(v);
    return <span key={p.dataKey} style={{ color: p.color }}>{p.name}: {formatted}</span>;
  })}</div>;
}
function Kpi({ title, value, format, note, icon, loading, error }) {
  return <section className="kpi"><div className="kpi-label">{title}<span>{icon}</span></div>{loading ? <div className="skeleton" /> : error ? <strong className="unavailable">Unavailable</strong> : <><strong className="kpi-value">{value == null ? '—' : format(value)}</strong><small>{note}</small></>}</section>;
}
const chartProps = { margin: { top: 10, right: 8, left: 0, bottom: 0 } };
const axisTick = { fill: '#8792a6', fontSize: 10 };
const grid = <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9edf4" />;

export default function App() {
  const { loading, data, errors } = useDashboard();
  const kpi = data.kpis?.[0];
  const monthly = useMemo(() => (data.monthly ?? []).map((r) => ({ ...r, monthLabel: new Date(`${r.month}T00:00:00`).toLocaleDateString('en', { month: 'short', year: '2-digit' }) })), [data.monthly]);
  const delivery = useMemo(() => (data.delivery ?? []).map((r) => ({ ...r, monthLabel: new Date(`${r.month}T00:00:00`).toLocaleDateString('en', { month: 'short', year: '2-digit' }) })), [data.delivery]);
  const categories = useMemo(() => [...(data.categories ?? [])].sort((a, b) => +b.revenue - +a.revenue), [data.categories]);
  const states = useMemo(() => [...(data.states ?? [])].sort((a, b) => +b.revenue - +a.revenue), [data.states]);
  const reviews = useMemo(() => [...(data.reviews ?? [])].sort((a, b) => bucketOrder.indexOf(a.delay_bucket) - bucketOrder.indexOf(b.delay_bucket)), [data.reviews]);
  const payments = useMemo(() => [...(data.payments ?? [])].sort((a, b) => +b.payment_value - +a.payment_value), [data.payments]);
  const dateAxis = <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} tick={axisTick} minTickGap={18} />;
  const tooltip = <Tooltip content={<Tip />} />;

  return <main className="shell">
    <header className="hero"><div className="hero-copy"><div className="eyebrow"><i /> COMMERCE INTELLIGENCE <span /> LIVE DATA</div><h1>Olist E-Commerce<br /><em>Performance</em></h1><p className="intro">A clear view of growth, fulfillment and customer experience.</p><div className="meta"><span className="date">▦ &nbsp;Date window: 2017-01-01 to 2018-08-31</span><span>Data: Olist (Kaggle), live from Supabase</span></div></div><div className="hero-art"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="snapshot"><small>PERFORMANCE SNAPSHOT</small><strong>01 <i>/</i> 18</strong><span>Jan 2017 — Aug 2018</span></div></div></header>
    {errors.config && <div className="setup-alert"><b>Connection setup needed</b><span>{errors.config}</span></div>}
    <div className="section-title"><span>AT A GLANCE</span><i /></div>
    <section className="kpi-grid">
      <Kpi title="Revenue" value={kpi?.total_revenue} format={(v) => money.format(+v)} note="Product sales · excludes freight" icon="↗" loading={loading} error={errors.kpis} />
      <Kpi title="Orders" value={kpi?.total_orders} format={(v) => number.format(+v)} note="Qualifying orders in window" icon="▤" loading={loading} error={errors.kpis} />
      <Kpi title="Average order value" value={kpi?.avg_order_value} format={(v) => money.format(+v)} note="Revenue per qualifying order" icon="◈" loading={loading} error={errors.kpis} />
      <Kpi title="On-time delivery" value={kpi?.on_time_rate} format={(v) => pct.format(+v)} note="Delivered by estimated date" icon="⌁" loading={loading} error={errors.kpis} />
      <Kpi title="Average review score" value={kpi?.avg_review_score} format={(v) => `${decimals.format(+v)} / 5`} note="Customer rating" icon="☆" loading={loading} error={errors.kpis} />
      <Kpi title="Repeat customers" value={kpi?.repeat_customer_rate} format={(v) => pct.format(+v)} note="Unique customers with 2+ orders" icon="⟳" loading={loading} error={errors.kpis} />
    </section>
    <div className="section-title chart-section-title"><span>SALES & EXPERIENCE</span><i /><small>2017 — 2018</small></div>
    <section className="charts">
      <Panel title="Monthly Revenue and Orders" subtitle="Revenue strengthened into 2018 while order volume shows seasonal peaks." loading={loading} error={errors.monthly} empty={!data.monthly?.length} wide>
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={monthly} {...chartProps}>{grid}{dateAxis}<YAxis yAxisId="orders" tickLine={false} axisLine={false} tick={axisTick} tickFormatter={(v) => `${Math.round(v / 1000)}k`} /><YAxis yAxisId="revenue" orientation="right" tickLine={false} axisLine={false} tick={axisTick} tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} />{tooltip}<Legend verticalAlign="top" align="right" height={28} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#7b879c' }} /><Bar yAxisId="orders" dataKey="orders" name="Orders" fill="#dce6ff" radius={[4, 4, 0, 0]} maxBarSize={22} /><Line yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue" stroke="#3867e8" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} /></ComposedChart></ResponsiveContainer>
      </Panel>
      <Panel title="Top Categories by Revenue" subtitle="Health & beauty leads the ranked categories; Other shows the remaining mix." loading={loading} error={errors.categories} empty={!categories.length}>
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={categories} layout="vertical" margin={{ top: 2, right: 8, left: 12, bottom: 0 }}><CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="#e9edf4" /><XAxis type="number" tickLine={false} axisLine={false} tick={axisTick} tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} /><YAxis type="category" dataKey="category" width={142} tickLine={false} axisLine={false} tick={{ ...axisTick, fill: '#68748a' }} tickFormatter={(v) => v.replaceAll('_', ' ')} />{tooltip}<Bar dataKey="revenue" name="Revenue" fill="#3867e8" radius={[0, 5, 5, 0]} maxBarSize={17}>{categories.map((r) => <Cell key={r.category} fill={r.category === 'Other' ? '#bac9eb' : '#3867e8'} />)}</Bar></ComposedChart></ResponsiveContainer>
      </Panel>
      <Panel title="Revenue by Customer State" subtitle="São Paulo contributes the most revenue among the leading states." loading={loading} error={errors.states} empty={!states.length}>
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={states} layout="vertical" margin={{ top: 2, right: 8, left: 15, bottom: 0 }}><CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="#e9edf4" /><XAxis type="number" tickLine={false} axisLine={false} tick={axisTick} tickFormatter={(v) => `R$${Math.round(v / 1000000)}m`} /><YAxis type="category" dataKey="customer_state" width={35} tickLine={false} axisLine={false} tick={{ ...axisTick, fill: '#68748a', fontWeight: 700 }} />{tooltip}<Bar dataKey="revenue" name="Revenue" fill="#24a58b" radius={[0, 5, 5, 0]} maxBarSize={19} /></ComposedChart></ResponsiveContainer>
      </Panel>
      <Panel title="Delivery Performance by Month" subtitle="Delivery times peaked in early 2018, then shortened through the summer." loading={loading} error={errors.delivery} empty={!data.delivery?.length}>
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={delivery} {...chartProps}>{grid}{dateAxis}<YAxis yAxisId="days" tickLine={false} axisLine={false} tick={axisTick} tickFormatter={(v) => `${v}d`} /><YAxis yAxisId="rate" orientation="right" domain={[0.7, 1]} tickLine={false} axisLine={false} tick={axisTick} tickFormatter={(v) => `${Math.round(v * 100)}%`} /><Tooltip content={<Tip />} /><Legend verticalAlign="top" align="right" height={28} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#7b879c' }} /><Area yAxisId="days" type="monotone" dataKey="avg_delivery_days" name="Average days" stroke="#f2a84a" fill="#fff2dd" strokeWidth={2.5} /><Line yAxisId="rate" type="monotone" dataKey="on_time_rate" name="On-time rate" stroke="#24a58b" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /></ComposedChart></ResponsiveContainer>
      </Panel>
      <Panel title="Review Score by Delivery Delay" subtitle="Late deliveries drive bad reviews." loading={loading} error={errors.reviews} empty={!reviews.length}>
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={reviews} margin={{ top: 8, right: 9, left: 0, bottom: 0 }}>{grid}<XAxis dataKey="delay_bucket" tickLine={false} axisLine={false} interval={0} tick={{ ...axisTick, fontSize: 9 }} /><YAxis domain={[0, 5]} tickLine={false} axisLine={false} tick={axisTick} />{tooltip}<Bar dataKey="avg_review_score" name="Average score" fill="#3867e8" radius={[5, 5, 0, 0]} maxBarSize={48}>{reviews.map((r) => <Cell key={r.delay_bucket} fill={r.delay_bucket.includes('late') ? '#e56d72' : '#3867e8'} />)}</Bar></ComposedChart></ResponsiveContainer>
      </Panel>
      <Panel title="Payment Mix by Value" subtitle="Credit cards represent the clear majority of payment value." loading={loading} error={errors.payments} empty={!payments.length}>
        <ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip content={<Tip payment />} /><Pie data={payments} dataKey="payment_value" nameKey="payment_type" cx="50%" cy="47%" innerRadius="53%" outerRadius="72%" paddingAngle={3} stroke="none" labelLine={false} label={({ cx, cy, midAngle, outerRadius, share_of_value }) => { const rad = Math.PI / 180; const radius = outerRadius + 17; const x = cx + radius * Math.cos(-midAngle * rad); const y = cy + radius * Math.sin(-midAngle * rad); return <text x={x} y={y} fill="#647087" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight={700}>{pct.format(+share_of_value)}</text>; }}>{payments.map((r, i) => <Cell key={r.payment_type} fill={colors[i % colors.length]} />)}</Pie><Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11, color: '#7b879c', textTransform: 'capitalize' }} formatter={(value) => value.replaceAll('_', ' ')} /></PieChart></ResponsiveContainer>
      </Panel>
    </section>
    <footer><span><i />Live Supabase connection</span><span>Olist E-Commerce Performance <b>·</b> 2017–2018</span></footer>
  </main>;
}
