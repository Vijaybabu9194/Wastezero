import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Download, Users, ClipboardList, Heart, UserX } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Reports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');

  useEffect(() => {
    fetchReport();
  }, [range]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports/engagement', {
        params: { range },
      });
      setReport(response.data.report);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load engagement report');
    } finally {
      setLoading(false);
    }
  };

  const monthlyChartData = useMemo(() => {
    return (report?.monthlyEngagement || []).map((item) => ({
      month: item.label,
      newUsers: item.newUsers,
      opportunities: item.opportunities,
      volunteerResponses: item.volunteerResponses,
    }));
  }, [report]);

  const opportunityStatusData = useMemo(() => {
    return (report?.opportunityStatusBreakdown || []).map((item) => ({
      name: item._id || 'unknown',
      value: item.count,
    }));
  }, [report]);

  const responseStatusData = useMemo(() => {
    return (report?.volunteerResponseBreakdown || []).map((item) => ({
      status: item._id || 'unknown',
      count: item.count,
    }));
  }, [report]);

  const exportCsv = () => {
    if (!report) return;

    const rows = [
      ['Metric', 'Value'],
      ['Active Users', report.summary.activeUsers],
      ['Suspended Users', report.summary.suspendedUsers],
      ['Posted Opportunities', report.summary.postedOpportunities],
      ['Volunteer Responses', report.summary.volunteerResponses],
      [],
      ['Month', 'New Users', 'Opportunities', 'Volunteer Responses'],
      ...(report.monthlyEngagement || []).map((row) => [
        row.label,
        row.newUsers,
        row.opportunities,
        row.volunteerResponses,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `engagement-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="text-gray-600 mt-4">Loading engagement report...</p>
      </div>
    );
  }

  if (!report) {
    return <div className="text-center py-12 text-gray-600">No report data available.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Platform Engagement Report</h1>
          <p className="text-gray-600 mt-1">Active users, opportunities, and volunteer response analytics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-emerald-600">{report.summary.activeUsers}</p>
            </div>
            <Users className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Suspended Users</p>
              <p className="text-2xl font-bold text-red-600">{report.summary.suspendedUsers}</p>
            </div>
            <UserX className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Posted Opportunities</p>
              <p className="text-2xl font-bold text-indigo-600">{report.summary.postedOpportunities}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Volunteer Responses</p>
              <p className="text-2xl font-bold text-rose-600">{report.summary.volunteerResponses}</p>
            </div>
            <Heart className="w-8 h-8 text-rose-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Engagement</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newUsers" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="opportunities" stroke="#16a34a" strokeWidth={2} />
              <Line type="monotone" dataKey="volunteerResponses" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Opportunity Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={opportunityStatusData} dataKey="value" nameKey="name" outerRadius={100} label>
                {opportunityStatusData.map((item, index) => (
                  <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Volunteer Response Status</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={responseStatusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#7c3aed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Opportunity Creators</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posted Opportunities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(report.topOpportunityCreators || []).map((creator) => (
                <tr key={creator._id}>
                  <td className="px-4 py-3 text-sm text-gray-800">{creator.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{creator.email}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-indigo-600">{creator.postedOpportunities}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
