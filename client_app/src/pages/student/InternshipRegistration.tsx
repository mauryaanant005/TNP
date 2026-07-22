import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import {
  SelectItem,
  SelectContent,
  Select,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getCookie } from "@/utils";
import toast from "react-hot-toast";
interface Company {
  name: string;
  min_tenth_marks: number;
  min_higher_secondary_marks: number;
  min_cgpa: number;
  min_attendance: number;
  is_kt: boolean;
  is_backLog: boolean;
  domain: string;
  Departments: string;
  is_pli: boolean;
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
  const [data, setData] = useState<CompanyData>();
  const [selectedOffer, setSelectedOffer] = useState<string>("");
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/internship/company/${id}`);
        const data = await response.json();
        console.log(data);
        setData(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/internship/job_application/create/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken") || "",
      },
      credentials: "include",
      body: JSON.stringify({ offer_id: selectedOffer }),
    });
    if (res.status === 401) {
      toast.error("You are not eligible for this offer");
    } else if (res.status === 200) {
      toast.success("Application submitted successfully");
      navigate("/student");
    } else {
      toast.error("Something went wrong");
    }
    // Here you would typically send this data to your backend
  };
  if (!data) return <div>Loading...</div>;
  return (
    <div className="flex flex-col md:flex-row gap-6 p-6">
      <Card className="w-full md:w-1/2">
        <CardHeader>
          <CardTitle>Company Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Company: {data?.company.name}</li>
            <li>Minimum 10th Marks: {data?.company?.min_tenth_marks}%</li>
            <li>
              Minimum 12th Marks: {data?.company?.min_higher_secondary_marks}%
            </li>
            <li>Minimum CGPA: {data?.company?.min_cgpa}</li>
            <li>Minimum Attendance: {data?.company?.min_attendance}%</li>
            <li>KT Allowed: {data?.company?.is_kt ? "Yes" : "No"}</li>
            <li>Backlog Allowed: {data?.company?.is_backLog ? "Yes" : "No"}</li>
            <li>Domain: {data?.company.domain}</li>
            <li>Departments: {data?.company?.Departments}</li>
            <li>PLI: {data?.company?.is_pli ? "Yes" : "No"}</li>
            <li>Batch: {data?.company.batch}</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="w-full md:w-1/2">
        <CardHeader>
          <CardTitle>Apply for Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select onValueChange={setSelectedOffer} value={selectedOffer}>
              <SelectTrigger className="text-black">
                <SelectValue
                  placeholder="Select an offer"
                  className="text-black"
                />
              </SelectTrigger>
              <SelectContent className="text-black">
                {data?.offers.map((offer) => (
                  <SelectItem key={offer.id} value={offer.id}>
                    {offer.type} - {offer.position} (₹
                    {offer.stipend?.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full">
              Submit Application
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InternshipRegistration;
