import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const NEEDS_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'];

function buildNeedsData(families) {
  const counts = {};
  families.forEach((f) => {
    const needs = Array.isArray(f.needs) ? f.needs : f.needs ? [f.needs] : [];
    needs.forEach((n) => {
      const key = n?.trim?.() || String(n);
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function buildLast7DaysData(visits) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    days.push({ date: label, fullDate: d.getTime(), count: 0 });
  }
  const list = Array.isArray(visits) ? visits : [];
  list.forEach((v) => {
    if (!v.date) return;
    if (v.status === 'PLANNED') return;
    const visitDate = new Date(v.date);
    visitDate.setHours(0, 0, 0, 0);
    const found = days.find((d) => d.fullDate === visitDate.getTime());
    if (found) found.count += 1;
  });
  return days.map(({ date, count }) => ({ date, visites: count }));
}

function DashboardCharts({ families = [], visits = [] }) {
  const needsData = buildNeedsData(families);
  const weekData = buildLast7DaysData(visits);
  const hasNeedsData = needsData.length > 0;
  const hasWeekData = weekData.some((d) => d.visites > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Répartition des Besoins</h3>
        {hasNeedsData ? (
          <div className="h-[280px] min-h-[200px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={needsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {needsData.map((_, index) => (
                    <Cell key={index} fill={NEEDS_COLORS[index % NEEDS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} famille(s)`, 'Nombre']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm">
            Pas assez de données
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Visites cette semaine</h3>
        {hasWeekData ? (
          <div className="h-[280px] min-h-[200px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip
                  formatter={(value) => [value, 'Visites']}
                  labelFormatter={(label) => `Jour : ${label}`}
                />
                <Bar dataKey="visites" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Visites" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm">
            Pas assez de données
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardCharts;
