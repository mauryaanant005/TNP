import React from "react";
import TCETResumeHeader from "@/assets/img/tcet_resume_header.jpeg";
import { ResumeData } from "../../types";

interface ResumeDisplayProps {
  resumeData: ResumeData;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="break-inside-avoid-page bg-white shadow-none mb-4">
    <h2 className="text-[11pt] font-bold uppercase tracking-wide text-black mb-1">
      {title}
    </h2>
    <hr className="border-[#4A72B2] border-t-[1.5px] mb-2" />
    {children}
  </div>
);

const HtmlContent: React.FC<{ content?: string }> = ({ content }) => (
  <div
    className="text-[10pt] leading-tight text-black [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:mt-1 [&_li]:mb-0.5"
    dangerouslySetInnerHTML={{ __html: content || "" }}
  />
);

const ResumeDisplay: React.FC<ResumeDisplayProps> = ({ resumeData }) => {
  const formatContactUrl = (url?: string) => {
    if (!url) return "";
    try {
      const { hostname, pathname } = new URL(url);
      return `${hostname.replace("www.", "")}${pathname.replace(/\/$/, "")}`;
    } catch {
      return url;
    }
  };

  const parseSkill = (skillString?: string) => {
    if (!skillString) return { category: "Skills", list: "" };
    const parts = skillString.split(":");
    if (parts.length < 2) return { category: "Skills", list: skillString };
    return { category: parts[0].trim(), list: parts.slice(1).join(":").trim() };
  };

  return (
    <div
      className="mx-auto bg-white resume-container"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "10pt",
        lineHeight: "1",
        maxWidth: "8.5in",
        padding: "0.5in 0.5in",
        minHeight: "11in",
      }}
    >
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .resume-container {
            font-size: 10pt !important;
            line-height: 1.15 !important;
            font-family: 'Times New Roman', Times, serif !important;
          }
          .break-inside-avoid-page { break-inside: avoid; page-break-inside: avoid; }
          p { color: black !important; }
        }
      `}</style>

      {/* HEADER */}
      <header className="flex justify-between items-center mb-4">
        <div className="flex-shrink-0">
          <img
            src={TCETResumeHeader}
            alt="TCET Header"
            className="w-[100px] h-[100px] object-contain"
          />
        </div>

        <div className="flex-1 mx-4 text-center">
          <h1 className="text-[18pt] font-bold text-black mb-1 uppercase">
            {resumeData.name || ""}
          </h1>
          {resumeData.address && (
            <div className="text-[11pt] text-black mb-1 uppercase">
              {resumeData.address}
            </div>
          )}
          <div className="text-[11pt] text-black leading-tight">
            <span>
              {resumeData.phone_no ? `+91${resumeData.phone_no}` : ""}
              {resumeData.phone_no && resumeData.email ? " | " : ""}
              {resumeData.email || ""}
            </span>
            {(resumeData.contacts || []).map((contact, index) => (
              <React.Fragment key={index}>
                {" | "}
                <a
                  href={contact}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black no-underline"
                >
                  {formatContactUrl(contact)}
                </a>
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* EDUCATION */}
      {(resumeData.education || []).length > 0 && (
        <Section title="Education">
          {(resumeData.education || []).map((edu, idx) => (
            <div key={edu.id || idx} className="mb-2">
              <div className="flex justify-between items-baseline">
                <div className="text-[11pt] font-bold text-black">
                  {edu.institution || ""}
                </div>
                <div className="text-[11pt] font-bold text-black whitespace-nowrap ml-1">
                  {edu.start_date || ""} – {edu.end_date || ""}
                </div>
              </div>
              <div className="flex justify-between items-baseline">
                <div className="text-[11pt] text-black">
                  {edu.degree || ""}{edu.percentage ? ` – ${edu.percentage} CGPA` : ""}
                </div>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* TECHNICAL SKILLS */}
      {(resumeData.skills || []).length > 0 && (
        <Section title="Technical Skills">
          <div className="grid grid-cols-1 gap-1">
            {(resumeData.skills || []).map((skill, index) => {
              const { category, list } = parseSkill(skill);
              return (
                <div key={index} className="flex text-[11pt] leading-tight">
                  <div className="font-bold text-black w-1/4 shrink-0">{category}:</div>
                  <div className="text-black w-3/4">{list}</div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* PROJECTS */}
      {(resumeData.projects || []).length > 0 && (
        <Section title="Projects">
          {(resumeData.projects || []).map((proj, idx) => (
            <div key={proj.id || idx} className="mb-3">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-[11pt] font-bold text-black">
                  {proj.title || ""}
                </h3>
              </div>
              <HtmlContent content={proj.description || ""} />
            </div>
          ))}
        </Section>
      )}

      {/* EXPERIENCE */}
      {(resumeData.workExperience || []).length > 0 && (
        <Section title="Internship">
          {(resumeData.workExperience || []).map((work, idx) => (
            <div key={work.id || idx} className="mb-3">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="text-[11pt] text-black">
                  {work.company || ""}
                </h3>
                <span className="text-[11pt] font-bold text-black whitespace-nowrap ml-2">
                  {work.start_date || ""} – {work.end_date || ""}
                </span>
              </div>
              <h4 className="text-[11pt] text-black mb-1">
                {work.position || ""}
              </h4>
              <HtmlContent content={work.description || ""} />
            </div>
          ))}
        </Section>
      )}

      {/* ACTIVITIES & ACHIEVEMENTS */}
      {(resumeData.activitiesAndAchievements || []).length > 0 && (
        <Section title="Extracurricular">
          {(resumeData.activitiesAndAchievements || []).map((act, idx) => (
            <div key={act.id || idx} className="mb-3">
              <h3 className="text-[11pt] font-bold text-black mb-0.5">
                {act.title || ""}
              </h3>
              <HtmlContent content={act.description || ""} />
            </div>
          ))}
        </Section>
      )}
    </div>
  );
};

export default ResumeDisplay;
