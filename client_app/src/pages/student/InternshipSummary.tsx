import { useEffect, useState } from "react";
import { api, apiFetch, getMediaUrl, toList } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { getCookie } from "@/utils";
import { PlusCircle, UploadCloud, FileText, CheckCircle2, Clock } from "lucide-react";

export default function StudentInternships() {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    domain: "Software Development",
    year: "TE",
    selectOption: "corporate",
    startDate: "",
    endDate: "",
    stipend: "",
  });
  const [offerLetterFile, setOfferLetterFile] = useState<File | null>(null);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/student/internships/`);
      const rows = toList(res.data);
      setInternships(rows || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load your internship records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.selectOption === "corporate" && !offerLetterFile) {
      toast.error("Please upload your official Offer Letter (PDF/Image).");
      return;
    }

    if (!formData.companyName.trim()) {
      toast.error("Please enter the company or organization name.");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select both start and completion dates.");
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("companyName", formData.companyName);
      data.append("domain", formData.domain);
      data.append("year", formData.year);
      data.append("selectOption", formData.selectOption);
      data.append("startDate", formData.startDate);
      data.append("endDate", formData.endDate);
      data.append("stipend", formData.stipend || "0");
      if (offerLetterFile) {
        data.append("offerLetter", offerLetterFile);
      }

      const res = await apiFetch("/api/internship/job_acceptance/create/", {
        method: "POST",
        headers: {
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        credentials: "include",
        body: data,
      });

      if (!res.ok) {
        let errMsg = "Failed to submit offer letter.";
        try {
          const errJson = await res.json();
          errMsg = errJson.error || errJson.message || JSON.stringify(errJson);
        } catch (_) {}
        throw new Error(errMsg);
      }

      toast.success("Offer letter submitted successfully! It is now pending officer verification.");
      setDialogOpen(false);
      setFormData({
        companyName: "",
        domain: "Software Development",
        year: "TE",
        selectOption: "corporate",
        startDate: "",
        endDate: "",
        stipend: "",
      });
      setOfferLetterFile(null);
      fetchInternships();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit offer letter.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-muted/30 p-6 min-h-[calc(100vh-80px)]">
      <Card className="w-full max-w-6xl shadow-md border-border/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              My Internship Records
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              View your completed, ongoing, and verified internship records or upload a new offer letter.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground gap-2">
                <PlusCircle className="h-4 w-4" />
                Upload Offer Letter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Submit Internship Offer Letter
                </DialogTitle>
                <DialogDescription>
                  Enter the details of your secured internship and upload your official offer letter for coordinator verification.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="font-semibold">
                    Company / Organization Name *
                  </Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    placeholder="e.g. TechNova Solutions, Amazon, TCS"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="domain" className="font-semibold">
                      Domain *
                    </Label>
                    <Input
                      id="domain"
                      name="domain"
                      placeholder="e.g. Web Dev, AI/ML, Core"
                      value={formData.domain}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="year" className="font-semibold">
                      Academic Year *
                    </Label>
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="FE">First Year (FE)</option>
                      <option value="SE">Second Year (SE)</option>
                      <option value="TE">Third Year (TE)</option>
                      <option value="BE">Final Year (BE)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate" className="font-semibold">
                      Start Date *
                    </Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="font-semibold">
                      Completion Date *
                    </Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="stipend" className="font-semibold">
                      Monthly Stipend (₹)
                    </Label>
                    <Input
                      id="stipend"
                      name="stipend"
                      type="number"
                      placeholder="e.g. 25000 (0 if unpaid)"
                      value={formData.stipend}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="selectOption" className="font-semibold">
                      Internship Type *
                    </Label>
                    <select
                      id="selectOption"
                      name="selectOption"
                      value={formData.selectOption}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="corporate">Corporate / Industry</option>
                      <option value="in_house">In-House College R&D</option>
                      <option value="startup">Startup / Research</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="offerLetter" className="font-semibold">
                    Offer Letter Document (PDF / Image) *
                  </Label>
                  <Input
                    id="offerLetter"
                    name="offerLetter"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setOfferLetterFile(e.target.files?.[0] || null)}
                    required={formData.selectOption !== "in_house"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload official proof containing your name, dates, stipend, and authorized signature.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="gap-2">
                    <UploadCloud className="h-4 w-4" />
                    {submitting ? "Submitting..." : "Submit for Verification"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">
              Loading your internship records...
            </div>
          ) : internships.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Company</TableHead>
                  <TableHead className="font-bold">Domain</TableHead>
                  <TableHead className="font-bold">Academic Year</TableHead>
                  <TableHead className="font-bold">Start Date</TableHead>
                  <TableHead className="font-bold">End Date</TableHead>
                  <TableHead className="font-bold">Monthly Stipend</TableHead>
                  <TableHead className="font-bold">Offer Letter</TableHead>
                  <TableHead className="font-bold">Verification Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {internships.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold">
                      {item.company_name || "Thakur College of Engg."}
                    </TableCell>
                    <TableCell>{item.domain_name || item.domain || "N/A"}</TableCell>
                    <TableCell>{item.year || "TE"}</TableCell>
                    <TableCell>{item.start_date || "N/A"}</TableCell>
                    <TableCell>{item.completion_date || "N/A"}</TableCell>
                    <TableCell>
                      {item.salary || item.stipend ? `₹${Number(item.salary || item.stipend).toLocaleString()}` : "Unpaid"}
                    </TableCell>
                    <TableCell>
                      {item.offer_letter ? (
                        <a
                          href={getMediaUrl(item.offer_letter)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-semibold"
                        >
                          <FileText className="h-3.5 w-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.is_verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          Pending Verification
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-base font-medium text-foreground">No internship records found</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                You have not submitted any internship offer letters yet.
              </p>
              <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Upload Your First Offer Letter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
