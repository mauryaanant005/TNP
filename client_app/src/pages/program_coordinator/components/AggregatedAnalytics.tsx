import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, AlertCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f43f5e'];

interface AttendanceSummary {
  average_attendance: number;
  late_percentage: number;
  absent_percentage: number;
  total_students_attended: number;
  total_sessions: number;
  late_sessions: number;
  absent_sessions: number;
}

interface PerformanceOverview {
  average_score: number;
  min_score: number;
  max_score: number;
  std_dev_score: number;
  total_students_tested: number;
}

interface PerformanceByCategory {
  [key: string]: number;
}

interface BatchData {
  batch: string;
  department: string;
  semester: string;
  attendance_summary: AttendanceSummary;
  performance_overview: PerformanceOverview;
  performance_by_category: PerformanceByCategory;
}

interface Props {
  groupBy: string;
  batch?: string;
  department?: string;
  semester?: string;
}

export default function AcademicDashboard({ groupBy, batch, department, semester }: Props) {
  const [data, setData] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ group_by: groupBy });
        if (batch) params.append('batch', batch);
        if (department) params.append('department', department);
        if (semester) params.append('semester', semester);

        const response = await fetch(
          `/api/program_coordinator/aggregate-analytics/?${params}`
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();

        setData(result);
        // Set first batch as selected by default
        if (result.length > 0 && !selectedBatch) {
          setSelectedBatch(result[0].batch);
        }
      } catch (err) {
        setError('Failed to fetch summary data. ' + ((err as Error).message || ''));
      }
      setLoading(false);
    };

    fetchData();
  }, [batch, department, semester, groupBy,selectedBatch]);

  const hasAttendance = (item: BatchData) => item.attendance_summary && Object.keys(item.attendance_summary).length > 0;
  const hasPerformance = (item: BatchData) => item.performance_overview && Object.keys(item.performance_overview).length > 0;

  const prepareAttendanceComparisonData = () => {
    return data.map(item => ({
      name: item.batch,
      attendance: item.attendance_summary?.average_attendance || 0,
      absent: item.attendance_summary?.absent_percentage || 0,
      late: item.attendance_summary?.late_percentage || 0
    }));
  };

  const preparePerformanceComparisonData = () => {
    return data.map(item => ({
      name: item.batch,
      avgScore: item.performance_overview?.average_score || 0,
      minScore: item.performance_overview?.min_score || 0,
      maxScore: item.performance_overview?.max_score || 0
    }));
  };

  const prepareAttendancePieData = (batchName: string | null) => {
    if (!batchName) return [];
    const item = data.find(d => d.batch === batchName);
    if (!item?.attendance_summary) return [];

    return [
      { name: 'Present', value: item.attendance_summary.average_attendance },
      { name: 'Absent', value: item.attendance_summary.absent_percentage },
      { name: 'Late', value: item.attendance_summary.late_percentage }
    ];
  };

  const prepareCategoryData = (batchName: string | null) => {
    if (!batchName) return [];
    const item = data.find(d => d.batch === batchName);
    if (!item?.performance_by_category) return [];

    return Object.entries(item.performance_by_category).map(([category, score]) => ({
      category,
      score
    }));
  };

  const prepareRadarData = (batchName: string | null) => {
    if (!batchName) return [];
    const item = data.find(d => d.batch === batchName);
    if (!item?.performance_by_category) return [];

    return Object.entries(item.performance_by_category).map(([subject, score]) => ({
      subject: subject.length > 10 ? subject.substring(0, 10) + '...' : subject,
      score,
      fullMark: 100
    }));
  };

  const selectedBatchData = data.find(d => d.batch === selectedBatch);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error loading data: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No data available for the selected filters.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const attendanceData = prepareAttendanceComparisonData();
  const performanceData = preparePerformanceComparisonData();
  const hasAttendanceData = attendanceData.some(d => d.attendance > 0 || d.absent > 0 || d.late > 0);
  const hasPerformanceData = performanceData.some(d => d.avgScore > 0 || d.minScore > 0 || d.maxScore > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Academic Performance Dashboard</h1>
          <p className="text-slate-600">Comprehensive analytics across all batches</p>
        </div>

        {/* Batch Comparison Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Batch Comparison</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasAttendanceData ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Attendance Comparison</CardTitle>
                  <CardDescription>Average attendance across all batches</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="attendance" fill="#10b981" name="Attendance %" />
                      <Bar dataKey="absent" fill="#ef4444" name="Absent %" />
                      <Bar dataKey="late" fill="#f59e0b" name="Late %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Attendance Comparison</CardTitle>
                  <CardDescription>No attendance data available</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                  <p className="text-slate-500">No attendance data to display</p>
                </CardContent>
              </Card>
            )}

            {hasPerformanceData ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Performance Comparison</CardTitle>
                  <CardDescription>Score distribution across batches</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={2} name="Average" />
                      <Line type="monotone" dataKey="maxScore" stroke="#10b981" strokeWidth={2} name="Maximum" />
                      <Line type="monotone" dataKey="minScore" stroke="#ef4444" strokeWidth={2} name="Minimum" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Performance Comparison</CardTitle>
                  <CardDescription>No performance data available</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                  <p className="text-slate-500">No performance data to display</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Individual Batch Analysis */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Detailed Batch Analysis</h2>
            <Select value={selectedBatch || undefined} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {data.map(item => (
                  <SelectItem key={item.batch} value={item.batch}>
                    {item.batch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBatchData && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{selectedBatchData.batch}</CardTitle>
                    <CardDescription className="text-base mt-1">
                      {selectedBatchData.department} • {selectedBatchData.semester}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {hasAttendance(selectedBatchData) && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Users className="w-3 h-3 mr-1" />
                        Attendance
                      </Badge>
                    )}
                    {hasPerformance(selectedBatchData) && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Performance
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <Tabs defaultValue={hasAttendance(selectedBatchData) ? "attendance" : "performance"} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="attendance" disabled={!hasAttendance(selectedBatchData)}>
                      Attendance Analytics
                    </TabsTrigger>
                    <TabsTrigger value="performance" disabled={!hasPerformance(selectedBatchData)}>
                      Performance Analytics
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="attendance" className="space-y-6 mt-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-slate-600">Avg Attendance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-600">
                            {selectedBatchData.attendance_summary?.average_attendance?.toFixed(1) || 0}%
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-slate-600">Total Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-slate-900">
                            {selectedBatchData.attendance_summary?.total_sessions || 0}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-slate-600">Absent Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-red-600">
                            {selectedBatchData.attendance_summary?.absent_sessions || 0}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-slate-600">Late Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-orange-600">
                            {selectedBatchData.attendance_summary?.late_sessions || 0}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Attendance Distribution Pie Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Attendance Distribution</CardTitle>
                        <CardDescription>Breakdown of attendance status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={prepareAttendancePieData(selectedBatch)}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {prepareAttendancePieData(selectedBatch).map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#10b981', '#ef4444', '#f59e0b'][index]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="performance" className="space-y-6 mt-6">
                    {/* Performance Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-slate-600">Average Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-600">
                            {selectedBatchData.performance_overview?.average_score || 0}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-slate-600">Min Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-red-600">
                            {selectedBatchData.performance_overview?.min_score || 0}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-slate-600">Max Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-600">
                            {selectedBatchData.performance_overview?.max_score || 0}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-slate-600">Std Deviation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-slate-900">
                            {selectedBatchData.performance_overview?.std_dev_score || 0}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-slate-600">Students Tested</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-purple-600">
                            {selectedBatchData.performance_overview?.total_students_tested || 0}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Category Performance Charts */}
                    {prepareCategoryData(selectedBatch).length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Performance by Category</CardTitle>
                            <CardDescription>Score breakdown across subjects</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                              <BarChart data={prepareCategoryData(selectedBatch)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="category" type="category" width={120} />
                                <Tooltip />
                                <Bar dataKey="score" fill="#3b82f6">
                                  {prepareCategoryData(selectedBatch).map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Subject Performance Radar</CardTitle>
                            <CardDescription>Holistic view of all subjects</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                              <RadarChart data={prepareRadarData(selectedBatch)}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                                <Tooltip />
                              </RadarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {prepareCategoryData(selectedBatch).length === 0 && (
                      <Card>
                        <CardContent className="flex items-center justify-center h-[200px]">
                          <p className="text-slate-500">No category performance data available</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}