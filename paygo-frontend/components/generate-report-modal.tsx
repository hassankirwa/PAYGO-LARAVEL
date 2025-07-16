"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Calendar, BarChart3, Users, Zap, DollarSign } from "lucide-react";

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReportType = "clients" | "appliances" | "financial" | "analytics";
type DateRange = "today" | "week" | "month" | "quarter" | "year" | "all" | "custom";
type ExportFormat = "csv" | "excel" | "pdf";

export default function GenerateReportModal({ isOpen, onClose }: GenerateReportModalProps) {
  const [reportType, setReportType] = useState<ReportType>("clients");
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    {
      value: "clients" as const,
      label: "Clients Report",
      description: "Client information, payment status, and account details",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      value: "appliances" as const,
      label: "Appliances Report",
      description: "Device status, locations, and maintenance records",
      icon: Zap,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      value: "financial" as const,
      label: "Financial Report",
      description: "Revenue, payments, outstanding balances, and transactions",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      value: "analytics" as const,
      label: "Analytics Report",
      description: "Usage patterns, performance metrics, and trends",
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const dateRanges = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Time" },
    { value: "custom", label: "Custom Range" },
  ];

  const getDateRangeText = (range: DateRange) => {
    const now = new Date();
    switch (range) {
      case "today":
        return now.toLocaleDateString();
      case "week":
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        return `${weekStart.toLocaleDateString()} - ${new Date().toLocaleDateString()}`;
      case "month":
        return `${new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString()} - ${new Date().toLocaleDateString()}`;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        return `${quarterStart.toLocaleDateString()} - ${new Date().toLocaleDateString()}`;
      case "year":
        return `${new Date(now.getFullYear(), 0, 1).toLocaleDateString()} - ${new Date().toLocaleDateString()}`;
      case "all":
        return "All available data";
      case "custom":
        return customStartDate && customEndDate ? `${customStartDate} - ${customEndDate}` : "Select dates";
      default:
        return "";
    }
  };

  const getReportData = (type: ReportType) => {
    const baseData = {
      clients: [
        { id: "CL001", name: "John Doe", email: "john@example.com", phone: "+254700000001", status: "Active", balance: "0", lastPayment: "2024-01-15" },
        { id: "CL002", name: "Jane Smith", email: "jane@example.com", phone: "+254700000002", status: "Active", balance: "500", lastPayment: "2024-01-10" },
        { id: "CL003", name: "Mike Johnson", email: "mike@example.com", phone: "+254700000003", status: "Suspended", balance: "1200", lastPayment: "2023-12-20" },
        { id: "CL004", name: "Sarah Wilson", email: "sarah@example.com", phone: "+254700000004", status: "Active", balance: "0", lastPayment: "2024-01-18" },
        { id: "CL005", name: "David Brown", email: "david@example.com", phone: "+254700000005", status: "Active", balance: "300", lastPayment: "2024-01-12" },
      ],
      appliances: [
        { unitId: "KOYO001", serialNumber: "KY-BC90-001", type: "Business Cooler", model: "BC-90DC", status: "Online", location: "Shop A, Nairobi", client: "John Doe", installDate: "2023-06-15" },
        { unitId: "KOYO002", serialNumber: "KY-BC50-002", type: "Business Cooler", model: "BC-50DC", status: "Offline", location: "Shop B, Mombasa", client: "Jane Smith", installDate: "2023-07-20" },
        { unitId: "KOYO003", serialNumber: "KY-LC218-003", type: "Large Cooler", model: "LC-218DC", status: "Online", location: "Warehouse C, Kisumu", client: "Mike Johnson", installDate: "2023-08-10" },
        { unitId: "KOYO004", serialNumber: "KY-BC118-004", type: "Business Cooler", model: "BC-118DC", status: "Maintenance", location: "Shop D, Nakuru", client: "Sarah Wilson", installDate: "2023-09-05" },
        { unitId: "KOYO005", serialNumber: "KY-BC268-005", type: "Business Cooler", model: "BC-268DC", status: "Online", location: "Store E, Eldoret", client: "David Brown", installDate: "2023-10-12" },
      ],
      financial: [
        { date: "2024-01-15", client: "John Doe", amount: "1500", type: "Payment", status: "Completed", method: "M-Pesa" },
        { date: "2024-01-14", client: "Jane Smith", amount: "1200", type: "Payment", status: "Completed", method: "Bank Transfer" },
        { date: "2024-01-13", client: "Sarah Wilson", amount: "1500", type: "Payment", status: "Completed", method: "M-Pesa" },
        { date: "2024-01-12", client: "David Brown", amount: "1000", type: "Payment", status: "Pending", method: "M-Pesa" },
        { date: "2024-01-10", client: "Mike Johnson", amount: "2000", type: "Payment", status: "Failed", method: "Bank Transfer" },
      ],
      analytics: [
        { metric: "Total Revenue", value: "KES 125,000", change: "+12", period: "This Month" },
        { metric: "Active Clients", value: "89", change: "+5", period: "This Month" },
        { metric: "Online Devices", value: "156", change: "+8", period: "This Month" },
        { metric: "Payment Success Rate", value: "94.5", change: "+2.1", period: "This Month" },
        { metric: "Average Revenue per Client", value: "KES 1,404", change: "-3", period: "This Month" },
      ],
    };

    return baseData[type];
  };

  const generateCSV = (data: any[], type: ReportType) => {
    if (!data.length) return "";

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]?.toString() || "";
          // Escape commas and quotes in CSV
          return value.includes(",") || value.includes('"') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(",")
      )
    ].join("\n");

    return csvContent;
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const data = getReportData(reportType);
      const csvContent = generateCSV(data, reportType);
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");
      const filename = `${reportType}-report-${timestamp}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onClose();
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedReportType = reportTypes.find(type => type.value === reportType)!;
  const IconComponent = selectedReportType.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Generate Report
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Report Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.value}
                      className={`cursor-pointer transition-all duration-200 ${
                        reportType === type.value
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setReportType(type.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${type.bgColor}`}>
                            <Icon className={`w-4 h-4 ${type.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{type.label}</h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateRange">Date Range</Label>
                <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exportFormat">Export Format</Label>
                <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="excel" disabled>Excel (.xlsx) - Coming Soon</SelectItem>
                    <SelectItem value="pdf" disabled>PDF (.pdf) - Coming Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateRange === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Report Preview */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Report Preview</Label>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedReportType.bgColor}`}>
                      <IconComponent className={`w-4 h-4 ${selectedReportType.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{selectedReportType.label}</CardTitle>
                      <CardDescription className="text-xs">
                        {getDateRangeText(dateRange)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Format:</span>
                      <Badge variant="secondary" className="text-xs">
                        {exportFormat.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Records:</span>
                      <span className="font-medium">~{getReportData(reportType).length} items</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Data Included</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {Object.keys(getReportData(reportType)[0] || {}).map((key) => (
                    <div key={key} className="text-xs text-gray-600 capitalize">
                      • {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateReport} 
            disabled={isGenerating || (dateRange === "custom" && (!customStartDate || !customEndDate))}
            className="min-w-[120px]"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Generate Report
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 