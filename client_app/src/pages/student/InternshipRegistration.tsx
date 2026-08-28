import { apiFetch } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from "@/components/ui/card";
import {
  SelectItem,
  SelectContent,
  Select,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getCookie } from "@/utils";
import toast from "react-hot-toast";
import {
  Building2,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Award,
  ArrowLeft,
  Users,
  ShieldCheck,
} from "lucide-react";

interface Company {
  id?: string;
  name: string;
  min_tenth_marks: number;
  min_higher_secondary_marks: number;
  min_cgpa: number;
  min_attendance: number;
  is_kt: boolean;
  is_backLog: boolean;
  domain: string;
  departments?: string;
  Departments?: string;
  batch: string;
}

interface Offer {
  id: string;
  type: string;
  stipend: number;
  position: string;
}

export type CompanyData = {
  company: Company;
  offers: Offer[];
};

const InternshipRegistration = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CompanyData | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`/api/internship/company/${id}`);
        if (!response.ok) throw new Error("Failed to fetch company");
        const companyData = await response.json();
        setData(companyData);
        if (companyData.offers && companyData.offers.length > 0) {
          setSelectedOffer(companyData.offers[0].id);
        }
      } catch (error: any) {
        console.error(error);
        const dummyData: CompanyData & { isDummy?: boolean } = {
          company: {
            name: "Demo Internship Corp",
            min_tenth_marks: 60,
            min_higher_secondary_marks: 60,
            min_cgpa: 6.5,
            min_attendance: 75,
            is_kt: false,
            is_backLog: false,
            domain: "Software Development",
            departments: "CS, IT, AI & DS",
            batch: "2028",
          },
          offers: [
            {
              id: "offer1",
              type: "Full Time",
              stipend: 25000,
              position: "Software Engineering Intern",
            },
            {
              id: "offer2",
              type: "Part Time",
              stipend: 15000,
              position: "Cloud Operations Intern",
            },
          ],
          isDummy: true,
        };
        setData(dummyData);
        toast.error("Company details could not be loaded. Showing sample view.");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOffer) {
      toast.error("Please select an available internship position.");
      return;
    }

    if (!confirmed) {
      toast.error("Please confirm that you satisfy the eligibility requirements.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/internship/job_application/create/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        credentials: "include",
        body: JSON.stringify({ offer_id: selectedOffer }),
      });

      if (res.status === 401 || res.status === 403) {
        toast.error("You are not eligible for this offer based on department/batch rules.");
      } else if (res.ok) {
        toast.success(`Application submitted successfully for ${data?.company.name}!`);
        navigate("/student/internships");
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(errJson.error || "Failed to submit application. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Building2 className="h-10 w-10 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground font-medium">Loading drive requirements...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg font-semibold text-foreground">Drive not found or inactive.</p>
        <Link to="/student">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const { company, offers } = data;
  const deptString = company.departments || company.Departments || "";
  const deptList = deptString
    ? deptString.split(",").map((d) => d.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/internships"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Internships
        </Link>
        <Badge variant="outline" className="px-3 py-1 font-semibold text-primary border-primary/30">
          Target Batch: {company.batch || "All"}
        </Badge>
      </div>

      {/* Hero Header Card */}
      <Card className="border-border/60 shadow-sm bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-background dark:from-slate-900/60 dark:to-slate-950">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Building2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {company.name}
                  </h1>
                  <Badge variant="secondary" className="font-semibold text-xs">
                    {company.domain?.toUpperCase() || "CORE"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Official Corporate Internship Drive
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Available Positions</p>
                <p className="text-lg font-bold text-foreground">{offers.length} Opening{offers.length === 1 ? "" : "s"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Eligibility on Left, Application on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Requirements & Eligibility */}
        <div className="lg:col-span-7 space-y-6">
          {/* Academic Criteria Card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Academic & Eligibility Criteria
              </CardTitle>
              <CardDescription>
                Ensure your academic profile meets the cutoffs set by {company.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* 4 Stat Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg border bg-card text-center space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Min CGPA</p>
                  <p className="text-xl font-bold text-primary">{company.min_cgpa ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground">Out of 10.0</p>
                </div>

                <div className="p-3.5 rounded-lg border bg-card text-center space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Attendance</p>
                  <p className="text-xl font-bold text-indigo-600">{company.min_attendance ?? 0}%</p>
                  <p className="text-[11px] text-muted-foreground">Min. Required</p>
                </div>

                <div className="p-3.5 rounded-lg border bg-card text-center space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">10th Grade</p>
                  <p className="text-xl font-bold text-foreground">{company.min_tenth_marks ?? 0}%</p>
                  <p className="text-[11px] text-muted-foreground">Aggregate</p>
                </div>

                <div className="p-3.5 rounded-lg border bg-card text-center space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">12th / Dip.</p>
                  <p className="text-xl font-bold text-foreground">{company.min_higher_secondary_marks ?? 0}%</p>
                  <p className="text-[11px] text-muted-foreground">Aggregate</p>
                </div>
              </div>

              {/* Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                  <span className="text-sm font-medium text-foreground">Live KT Allowed:</span>
                  {company.is_kt ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Allowed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      <XCircle className="h-3.5 w-3.5" /> Not Allowed
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                  <span className="text-sm font-medium text-foreground">Dead Backlogs Allowed:</span>
                  {company.is_backLog ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Allowed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      <XCircle className="h-3.5 w-3.5" /> Not Allowed
                    </span>
                  )}
                </div>
              </div>

              {/* Eligible Departments */}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Eligible Branches & Departments
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {deptList.length > 0 ? (
                    deptList.map((dept, i) => (
                      <Badge key={i} variant="secondary" className="px-2.5 py-1 text-xs font-semibold">
                        {dept}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      All TCET Engineering Departments
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Application Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/60 shadow-md sticky top-6">
            <CardHeader className="pb-3 border-b bg-card">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Apply for Position
              </CardTitle>
              <CardDescription>
                Select your preferred opening and submit your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Available Offers */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Select Position / Role *
                  </label>
                  {offers.length > 0 ? (
                    <Select onValueChange={setSelectedOffer} value={selectedOffer}>
                      <SelectTrigger className="w-full h-11 text-foreground">
                        <SelectValue placeholder="Choose an opening..." />
                      </SelectTrigger>
                      <SelectContent>
                        {offers.map((offer) => (
                          <SelectItem key={offer.id} value={offer.id}>
                            {offer.position} — {offer.type} (₹{offer.stipend?.toLocaleString()}/mo)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific openings listed for this company.</p>
                  )}
                </div>

                {/* Selected Offer Highlights */}
                {selectedOffer && (
                  <div className="p-3.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 space-y-1.5 text-xs">
                    {(() => {
                      const cur = offers.find((o) => o.id === selectedOffer);
                      if (!cur) return null;
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Role:</span>
                            <span className="font-semibold text-foreground">{cur.position}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Stipend:</span>
                            <span className="font-bold text-primary">₹{cur.stipend?.toLocaleString()} / month</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Engagement:</span>
                            <span className="font-semibold text-foreground">{cur.type || "Full Time"}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Confirmation Checkbox */}
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="confirmEligibility"
                    checked={confirmed}
                    onCheckedChange={(c) => setConfirmed(!!c)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="confirmEligibility"
                    className="text-xs leading-relaxed text-muted-foreground cursor-pointer select-none"
                  >
                    I certify that my academic records (CGPA, marks, attendance, and branch) satisfy the minimum criteria defined for this drive.
                  </label>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={submitting || offers.length === 0}
                  className="w-full h-11 text-sm font-semibold gap-2 shadow-sm"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {submitting ? "Submitting Application..." : "Submit Application"}
                </Button>

                <p className="text-[11px] text-center text-muted-foreground">
                  Your student profile & resume will be shared with the Training & Placement Cell and {company.name}.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InternshipRegistration;

