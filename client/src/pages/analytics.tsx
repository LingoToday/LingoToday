import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, Eye, Calendar, Filter, TrendingUp, BookOpen, User, ChevronDown, LogOut } from "lucide-react";
import { Link } from "wouter";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface AnalyticsData {
  pageViews: { date: string; count: number; page?: string }[];
  pageBreakdown: { page: string; count: number }[];
  period: string;
  filters: {
    page?: string;
    startDate?: string;
    endDate?: string;
  };
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function AnalyticsPage() {
  const { user } = useAuth() as { user: any };
  const [selectedPeriod, setSelectedPeriod] = useState<string>("week");
  const [selectedPage, setSelectedPage] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Build query parameters based on filters
  const getQueryParams = () => {
    const params = new URLSearchParams();
    
    if (selectedPeriod !== "custom") {
      params.append("period", selectedPeriod);
    }
    
    if (selectedPage !== "all") {
      params.append("page", selectedPage);
    }
    
    if (selectedPeriod === "custom") {
      if (startDate) {
        params.append("startDate", startDate);
      }
      if (endDate) {
        params.append("endDate", endDate);
      }
    }
    
    return params.toString();
  };

  const { data: analyticsData, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", selectedPeriod, selectedPage, startDate, endDate],
    queryFn: async () => {
      const params = getQueryParams();
      const url = `/api/analytics${params ? `?${params}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  // Get unique pages for filter
  const uniquePages = analyticsData?.pageBreakdown?.map(item => item.page) || [];

  // Process data for different chart types
  const chartData = analyticsData?.pageViews?.map(item => ({
    date: format(new Date(item.date), "MMM dd"),
    views: parseInt(String(item.count)) || 0,
  })) || [];

  const pageBreakdownData = analyticsData?.pageBreakdown?.map((item, index) => ({
    name: item.page === "/" ? "Home" : item.page.replace(/^\//, "").replace(/-/g, " "),
    value: parseInt(String(item.count)) || 0,
    page: item.page,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  // Calculate totals - ensure numbers are properly converted
  const totalViews = analyticsData?.pageViews?.reduce((sum, item) => sum + (parseInt(String(item.count)) || 0), 0) || 0;
  const totalPages = uniquePages.length;
  const avgViewsPerDay = chartData.length > 0 ? Math.round(totalViews / chartData.length) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Error</h2>
            <p className="text-gray-600">Failed to load analytics data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartConfig = {
    views: {
      label: "Page Views",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-white text-sm" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">LingoToday</h1>
              </div>
              
              <nav className="flex space-x-8 ml-8">
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="ghost" className="text-blue-600">
                    Analytics
                  </Button>
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2" data-testid="account-dropdown">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{user?.firstName || 'Account'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/account">
                    <DropdownMenuItem data-testid="account-menu-item">
                      <User className="w-4 h-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/analytics">
                    <DropdownMenuItem data-testid="analytics-menu-item">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = "/api/logout"}
                    className="text-red-600 focus:text-red-600"
                    data-testid="logout-menu-item"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
            <CardDescription>
              Choose time period and page to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Period Filter */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48" data-testid="period-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {selectedPeriod === "custom" && (
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-48"
                    data-testid="start-date-input"
                  />
                </div>
              )}

              {selectedPeriod === "custom" && (
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-48"
                    data-testid="end-date-input"
                  />
                </div>
              )}

              {/* Page Filter */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Page</label>
                <Select value={selectedPage} onValueChange={setSelectedPage}>
                  <SelectTrigger className="w-64" data-testid="page-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pages</SelectItem>
                    {uniquePages.map((page) => (
                      <SelectItem key={page} value={page}>
                        {page === "/" ? "Home" : page.replace(/^\//, "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="total-views">{totalViews.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Pages</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="unique-pages">{totalPages}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Views/Day</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="avg-views">{avgViewsPerDay.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Page Views Over Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Page Views Over Time</CardTitle>
              <CardDescription>
                {selectedPage === "all" ? "All pages" : `Views for ${selectedPage === "/" ? "Home" : selectedPage}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-72">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Page Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Page Views Breakdown</CardTitle>
              <CardDescription>
                Distribution of views across different pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-72">
                <PieChart>
                  <Pie
                    data={pageBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pageBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Page Details Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Page Details</CardTitle>
            <CardDescription>
              Detailed breakdown of page views
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Page</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Views</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {pageBreakdownData.map((item, index) => (
                    <tr key={item.page} className="border-b hover:bg-gray-50" data-testid={`page-row-${index}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="font-medium">
                            {item.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.page}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono" data-testid={`page-views-${index}`}>
                        {item.value.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {totalViews > 0 ? `${Math.round((item.value / totalViews) * 100)}%` : "0%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {pageBreakdownData.length === 0 && (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No page views data available for the selected period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}