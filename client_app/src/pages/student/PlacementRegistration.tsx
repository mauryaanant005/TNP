/* eslint-disable @typescript-eslint/no-explicit-any */
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
import Notice from "../staff/components/placement/notice_preview";
import { FormDataType, NoticeType } from "../staff/placement_company";

const PlacementRegistration = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const NoticeData: NoticeType = {
    subject: "",
    date: "",
    intro: "",
    about: "",
    company_registration_link: "",
    note: "",
    location: "",
    deadline: "",
  };

  const [data, setData] = useState<FormDataType>({
    id: 0, // Add default value for id
    name: "",
    min_tenth_marks: "",
    min_higher_secondary_marks: "",
    min_cgpa: "",
    accepted_kt: false,
    domain: "core",
    departments: "all",
    is_aedp_or_pli: false,
    is_aedp_or_ojt: false,
    selected_departments: [],
    job_offers: [{ role: "", salary: "", skills: "" }],
    batch: "",
    notice: NoticeData,
  });

  const [interest, setInterest] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [selectedOffer, setSelectedOffer] = useState<string>("");

  const notInterestedReasons = [
    "Bond",
    "Salary",
    "Role not relevant",
  ];

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await fetch(`/api/staff/placement/company/${id}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch company data");

        const data = await response.json();
        setData({
          id: data.id,
          name: data.name,
          min_tenth_marks: data.min_tenth_marks,
          min_higher_secondary_marks: data.min_higher_secondary_marks,
          min_cgpa: data.min_cgpa,
          accepted_kt: data.accepted_kt,
          domain: data.domain,
          departments: data.departments,
          is_aedp_or_pli: data.is_aedp_or_pli,
          is_aedp_or_ojt: data.is_aedp_or_ojt,
          selected_departments: data.selected_departments,
          job_offers:
            data.job_offers.length > 0
              ? data.job_offers
              : [{ role: "", salary: "", skills: "" }],
          batch: data.batch,
          notice: data.notice || NoticeData,
        });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Error fetching company data:", error);
        toast.error(error.message || "Something went wrong");
      }
    };

    fetchCompanyData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      if (!reason && interest === "no") {
        toast.error("Please select a reason");
        return;
      }
      if (!selectedOffer && interest === "yes") {
        toast.error("Please select an offer to apply for");
        return;
      }
      const res = await fetch(`/api/student/company/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        credentials: "include",
        body: JSON.stringify({ reason, company_id: id, offer_role: selectedOffer, interest }),
      });

      if (res.ok) {
        toast.success("Response recorded successfully");
        navigate("/student");
      } else {
        toast.error("Failed to record response");
      }
      return;

  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 bg-gray-50 min-h-screen">
      {/* Left Card - Notice Preview */}
      <Card className="w-full md:w-1/2 shadow-lg border border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
          <CardTitle className="text-lg font-semibold text-blue-900">
            Company Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Notice formData={data as any} isPlacement />
        </CardContent>
      </Card>
      <Card className="w-full md:w-1/2 shadow-lg border border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
          <CardTitle className="text-lg font-semibold text-blue-900">
            Placement Registration
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Are you interested in applying?
              </label>
              <Select onValueChange={setInterest} value={interest}>
                <SelectTrigger className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black">
                  <SelectValue placeholder="Select your interest"  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I am interested</SelectItem>
                  <SelectItem value="no">No, I am not interested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {interest === "no" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please select a reason
                </label>
                <Select onValueChange={setReason} value={reason}>
                  <SelectTrigger className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black">
                    <SelectValue placeholder="Select reason" className="text-black" />
                  </SelectTrigger>
                  <SelectContent>
                    {notInterestedReasons.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Offer Selection */}
            {interest === "yes" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose the offer you want to apply for
                </label>
                <Select
                  onValueChange={setSelectedOffer}
                  value={selectedOffer}
                >
                  <SelectTrigger className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black">
                    <SelectValue placeholder="Select an offer" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.job_offers.map((offer, idx) => (
                      <SelectItem
                        key={idx}
                        value={offer.role || `offer-${idx}`}
                      >
                        {offer.role} — ₹{offer.salary.toLocaleString()} LPA
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg shadow-md transition-all"
            >
              {interest === "no"
                ? "Submit Response"
                : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlacementRegistration;
