import { useState } from 'react';
import GlobalFilters from './components/GlobalFilters';
import AggregateAnalytics from './components/AggregatedAnalytics';
import StudentAnalytics from './components/StudentAnalytics';
export default function AnalyticsDashboard() {
  const [filters, setFilters] = useState({
    batch: '',
    department: '',
    semester: '',
    groupBy: 'batch',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor student performance and attendance metrics</p>
        </div>

        <GlobalFilters filters={filters} setFilters={setFilters} />
        <AggregateAnalytics groupBy={filters.groupBy} batch={filters.batch}
  department={filters.department}
  semester={filters.semester} />
        <StudentAnalytics
          batch={filters.batch}
          department={filters.department}
          semester={filters.semester}
        />
      </div>
    </div>
  );
}