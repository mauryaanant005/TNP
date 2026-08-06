import { apiFetch } from "@/lib/api";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { getCookie } from "@/utils";
import { useNavigate } from "react-router";
import { SERVER_URL } from "@/constant";
const resumeSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  phone_no: z.string().min(10, "Invalid phone number"),
  profile_image: z.any().optional(),
  contacts: z
    .array(z.string().url("Must be a valid URL"))
    .min(1, "At least one contact"),
  skills: z.array(z.string().min(1)).min(1, "At least one skill"),

  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      start_date: z.string(),
      end_date: z.string(),
      percentage: z.string(),
    })
  ),

  workExperience: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      start_date: z.string(),
      end_date: z.string(),
      description: z.string().optional(),
    })
  ),

  projects: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
    })
  ),

  activitiesAndAchievements: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
});
type ResumeFormData = z.infer<typeof resumeSchema>;

export default function ResumeBuilderForm() {
  const navigate = useNavigate();
  const form = useForm<ResumeFormData>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone_no: "",
      profile_image: null, // Use null for file/empty default
      contacts: [""],
      skills: [""],
      education: [
        {
          institution: "",
          degree: "",
          start_date: "",
          end_date: "",
          percentage: "",
        },
      ],
      workExperience: [
        {
          company: "",
          position: "",
          start_date: "",
          end_date: "",
          description: "",
        },
      ],
      projects: [{ title: "", description: "" }],
      activitiesAndAchievements: [{ title: "", description: "" }],
    },
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = form;

  const contactFields = useFieldArray({ control, name: "contacts" });
  const skillFields = useFieldArray({ control, name: "skills" });
  const educationFields = useFieldArray({ control, name: "education" });
  const workFields = useFieldArray({ control, name: "workExperience" });
  const projectFields = useFieldArray({ control, name: "projects" });
  const activityFields = useFieldArray({
    control,
    name: "activitiesAndAchievements",
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [isUpdate, setIsUpdate] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      const res = await apiFetch("/api/student/resume/", {
        method: "GET",
        credentials: "include",
        headers: {
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setIsUpdate(true);
        const formattedData = {
          name: data.name,
          email: data.email,
          phone_no: data.phone_no,
          profile_image: null,
          contacts: data.contacts.length > 0 ? data.contacts : [""],
          skills: data.skills.length > 0 ? data.skills : [""],
          education:
            data.education.length > 0
              ? data.education
              : [
                  {
                    institution: "",
                    degree: "",
                    start_date: "",
                    end_date: "",
                    percentage: "",
                  },
                ],
          workExperience:
            data.workExperience.length > 0
              ? data.workExperience
              : [
                  {
                    company: "",
                    position: "",
                    start_date: "",
                    end_date: "",
                    description: "",
                  },
                ],
          projects:
            data.projects.length > 0
              ? data.projects
              : [{ title: "", description: "" }],
          activitiesAndAchievements:
            data.activitiesAndAchievements.length > 0
              ? data.activitiesAndAchievements
              : [{ title: "", description: "" }],
        };
        reset(formattedData);
        if (data.profile_image) {
          setPreview(data.profile_image);
        }
      }
    };
    fetchResume();
  }, []);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("profile_image", file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handlePreview = () => {
    const currentData = form.getValues();
    const previewData = {
      ...currentData,
      profile_image: preview,
    };
    navigate("/student/resume-preview", { state: { resumeData: previewData } });
  };

  const onSubmit = async (data: ResumeFormData) => {
    try {
      const formData = new FormData();
      const { profile_image, ...restOfData } = data;
      if (profile_image && profile_image instanceof File) {
        formData.append("profile_image", profile_image);
      }
      formData.append("data", JSON.stringify(restOfData));
      let res;
      if (isUpdate) {
        res = await apiFetch("/api/student/resume/", {
          method: "PUT",
          credentials: "include",
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
          body: formData,
        });
      } else {
        res = await apiFetch("/api/student/resume/", {
          method: "POST",
          headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
          },
          body: formData,
        });
      }
      if (!res.ok) throw new Error("Failed to save resume");
      toast.success("Resume saved successfully!");
    } catch (err: any) {
      toast.error(err.message); // Use toast.error for errors
    }
  };

  const onInvalid = () => {
    toast.error("Please fill out all required fields correctly.");
  };

  return (
    <div className="w-full md:w-[50dvw] mx-auto py-10">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input {...register("name")} />
            </div>
            <div>
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" {...register("email")} />
            </div>
            <div>
              <Label>Phone <span className="text-red-500">*</span></Label>
              <Input {...register("phone_no")} />
            </div>
            <div>
              <Label>Profile Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {preview && (
                <img
                  src={`${SERVER_URL}${preview}`}
                  alt="Profile preview"
                  className="mt-2 w-24 h-24 rounded-full object-cover"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Links <span className="text-sm font-normal text-red-500">* (At least 1)</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contactFields.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`contacts.${index}`)}
                  placeholder="https://github.com/yourname"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => contactFields.remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" onClick={() => contactFields.append("")}>
              Add Contact
            </Button>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills <span className="text-sm font-normal text-red-500">* (At least 1)</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {skillFields.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`skills.${index}`)}
                  placeholder="React.js"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => skillFields.remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" onClick={() => skillFields.append("")}>
              Add Skill
            </Button>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <CardTitle>Education <span className="text-sm font-normal text-red-500">*</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {educationFields.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 border p-3 rounded-md">
                <Label>Institution <span className="text-red-500">*</span></Label>
                <Input
                  {...register(`education.${index}.institution`)}
                  placeholder="Institution"
                />
                <Label>Degree <span className="text-red-500">*</span></Label>
                <Input
                  {...register(`education.${index}.degree`)}
                  placeholder="Degree"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Start Date <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      {...register(`education.${index}.start_date`)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>End Date <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      {...register(`education.${index}.end_date`)}
                    />
                  </div>
                </div>
                <Label>Percentage/CGPA <span className="text-red-500">*</span></Label>
                <Input
                  {...register(`education.${index}.percentage`)}
                  placeholder="Percentage/CGPA"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => educationFields.remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                educationFields.append({
                  institution: "",
                  degree: "",
                  start_date: "",
                  end_date: "",
                  percentage: "",
                })
              }
            >
              Add Education
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Work Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workFields.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 border p-3 rounded-md">
                <Label>Company <span className="text-red-500">*</span></Label>
                <Input
                  {...register(`workExperience.${index}.company`)}
                  placeholder="Company"
                />
                <Label>Position <span className="text-red-500">*</span></Label>
                <Input
                  {...register(`workExperience.${index}.position`)}
                  placeholder="Position"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Start Date <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      {...register(`workExperience.${index}.start_date`)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>End Date <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      {...register(`workExperience.${index}.end_date`)}
                    />
                  </div>
                </div>
                <Label>Description</Label>
                <ReactQuill
                  theme="snow"
                  value={form.getValues(`workExperience.${index}.description`)}
                  onChange={(val) =>
                    setValue(`workExperience.${index}.description`, val)
                  }
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => workFields.remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                workFields.append({
                  company: "",
                  position: "",
                  start_date: "",
                  end_date: "",
                  description: "",
                })
              }
            >
              Add Work Experience
            </Button>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectFields.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 border p-3 rounded-md">
                <Label>Project Title <span className="text-red-500">*</span></Label>
                <Input
                  {...register(`projects.${index}.title`)}
                  placeholder="Project Title"
                />
                <Label>Description</Label>
                <ReactQuill
                  theme="snow"
                  value={form.getValues(`projects.${index}.description`)}
                  onChange={(val) =>
                    setValue(`projects.${index}.description`, val)
                  }
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => projectFields.remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                projectFields.append({ title: "", description: "" })
              }
            >
              Add Project
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activities & Achievements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityFields.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 border p-3 rounded-md">
                <Label>Title <span className="text-red-500">*</span></Label>
                <Input
                  {...register(`activitiesAndAchievements.${index}.title`)}
                  placeholder="Title"
                />
                <Label>Description <span className="text-red-500">*</span></Label>
                <ReactQuill
                  theme="snow"
                  value={form.getValues(
                    `activitiesAndAchievements.${index}.description`
                  )}
                  onChange={(val) =>
                    setValue(
                      `activitiesAndAchievements.${index}.description`,
                      val
                    )
                  }
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => activityFields.remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                activityFields.append({ title: "", description: "" })
              }
            >
              Add Achievement
            </Button>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button
            onClick={handlePreview}
            type="button"
            className="mr-4"
          >
            Show Preview
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Resume"}
          </Button>
        </div>
      </form>
    </div>
  );
}
