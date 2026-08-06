import { apiFetch } from "@/lib/api";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router";
import { PrinterIcon } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { getCookie } from "../../utils";
import { ResumeData } from "./types";
import ResumeDisplay from "./components/resume/ResumeDisplay";

const ResumePreview = () => {
  const location = useLocation();
  const stateResumeData = location.state?.resumeData as ResumeData | undefined;

  const [resumeData, setResume] = useState<ResumeData | null>(stateResumeData || null);
  const [loading, setLoading] = useState(!stateResumeData);
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  useEffect(() => {
    if (stateResumeData) {
      return;
    }

    // Fetch resume data from API
    const fetchResume = async () => {
      try {
        const res = await apiFetch("/api/student/resume/", {
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRF-Token": getCookie("csrftoken") || "",
          },
        });

        if (res.ok) {
          const data = await res.json();

          // Make sure optional fields exist
          const safeData: ResumeData = {
            ...data,
            profile_image: data.profile_image || "",
            activitiesAndAchievements: data.activitiesAndAchievements || [],
          };

          setResume(safeData);
          (safeData as any).isDummy = false;
        } else {
          throw new Error("Failed to fetch resume");
        }
      } catch (error) {
        console.error(error);
        
        // Dummy data injection
        const dummyResume: ResumeData = {
          name: "John Doe",
          email: "john.doe@example.com",
          phone_no: "+91 9876543210",
          profile_image: "",
          contacts: ["https://linkedin.com/in/johndoe", "https://github.com/johndoe"],
          skills: ["React.js", "TypeScript", "Node.js", "Python"],
          education: [
            {
              id: "1",
              institution: "Demo University",
              degree: "B.Tech Computer Science",
              start_date: "2022-08-01",
              end_date: "2026-05-30",
              percentage: "8.5 CGPA"
            }
          ],
          workExperience: [
            {
              id: "1",
              company: "Tech Solutions Inc.",
              position: "Frontend Intern",
              start_date: "2025-05-01",
              end_date: "2025-07-31",
              description: "<p>Worked on building responsive UI components using React and Tailwind CSS.</p>"
            }
          ],
          projects: [
            {
              id: "1",
              title: "E-commerce Dashboard",
              description: "<p>A full-stack dashboard for managing products and orders.</p>"
            }
          ],
          activitiesAndAchievements: [
            {
              id: "1",
              title: "Hackathon Winner",
              description: "<p>Secured 1st place in the university hackathon.</p>"
            }
          ]
        };
        (dummyResume as any).isDummy = true;
        setResume(dummyResume);
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!resumeData) return null;

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        {(resumeData as any).isDummy && (
          <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-sm" role="alert">
            <p className="font-bold">Displaying Sample Data</p>
            <p>You have not created a resume yet. Showing a sample resume template.</p>
          </div>
        )}
        <Button onClick={() => handlePrint()} className="mb-6">
          <PrinterIcon className="mr-2 h-4 w-4" />
          Download PDF
        </Button>

        <div ref={componentRef}>
          <ResumeDisplay resumeData={resumeData as any} />
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
