import { useEffect, useState } from "react";
import axios from "axios";
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
        const res = await axios.get(`/api/student/internships/`);
        setInternships(res.data);
        toast.success("Internship data fetched successfully");
      } catch (err: any) {
        if (err.response?.status === 404) {
          toast.error("No internships found for this student");
        } else {
          toast.error("Failed to fetch internships");
        }
        setInternships([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center  bg-muted/30 p-6">
      <Card >
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
