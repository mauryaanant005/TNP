import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";

export default function StudentInternships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchInternships = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/student/internships/`);
        if (res.data && res.data.length > 0) {
          setInternships(res.data);
          (res.data as any).isDummy = false;
        } else {
          // Empty, inject dummy
          throw new Error("EmptyData");
        }
      } catch (err: any) {
        const dummyInternships = [
          {
            id: 1,
            company_name: "Demo Solutions Pvt Ltd",
            domain_name: "Web Development",
            type: "Technical",
            offer_type: "Full Time Internship",
            start_date: "2026-01-10",
            completion_date: "2026-06-10",
            salary: 15000,
            is_verified: true,
          },
          {
            id: 2,
            company_name: "Sample Innovations",
            domain_name: "Data Science",
            type: "Research",
            offer_type: "Part Time",
            start_date: "2025-06-01",
            completion_date: "2025-08-30",
            salary: 10000,
            is_verified: false,
          }
        ];
        (dummyInternships as any).isDummy = true;
        setInternships(dummyInternships as any);
        toast.error("No internships found. Displaying sample data.");
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center  bg-muted/30 p-6">
      {(internships as any).isDummy && (
        <div className="w-full mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-sm" role="alert">
          <p className="font-bold">Displaying Sample Data</p>
          <p>You do not have any internship records yet. Showing fallback content for demonstration.</p>
        </div>
      )}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Student Internships</CardTitle>
        </CardHeader>
        <CardContent>
          {internships.length > 0 ? (
            <Table>
              <TableCaption>
                List of internships completed by the student
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Offer Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {internships.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.company_name}</TableCell>
                    <TableCell>{item.domain_name}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.offer_type}</TableCell>
                    <TableCell>{item.start_date}</TableCell>
                    <TableCell>{item.completion_date}</TableCell>
                    <TableCell>{item.salary}</TableCell>
                    <TableCell>
                      {item.is_verified ? (
                        <span className="text-green-600 font-semibold">
                          ✅ Yes
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">
                          ❌ No
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            !loading && (
              <p className="text-center text-muted-foreground">
                No internship data to display
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
