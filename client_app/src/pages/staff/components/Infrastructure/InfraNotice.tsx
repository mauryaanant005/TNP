import React, { useState, useRef } from "react";
import { Button } from "@mui/material";
import { useReactToPrint } from "react-to-print";
import NoticePreview from "./NoticePreview";

interface FormData {
  srNo: string;
  sender: string;
  senderAddLine1: string;
  senderAddLine2: string;
  senderAddLine3: string;
  senderAddLine4: string;
  receiver: string;
  receiverAddLine1: string;
  receiverAddLine2: string;
  receiverAddLine3: string;
  receiverAddLine4: string;
  subject: string;
  date: string;
  Note: string;
  From: string;
  From_designation: string;
  content?: string;
}

const InfrastructureBooking = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [content] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const reactPrintFn = useReactToPrint({ contentRef });

  const [formData, setFormData] = useState<FormData>({
    srNo: "",
    sender: "",
    senderAddLine1: "",
    senderAddLine2: "",
    senderAddLine3: "",
    senderAddLine4: "",
    receiver: "",
    receiverAddLine1: "",
    receiverAddLine2: "",
    receiverAddLine3: "",
    receiverAddLine4: "",
    subject: "",
    date: new Date().toISOString().split("T")[0],
    Note: "",
    From: "",
    From_designation: "",
    content: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-center text-2xl font-bold mb-6">
        NOTICE DETAILS: INFRASTRUCTURE BOOKING
      </h1>

      <form className="space-y-6">
        {/* Basic Details */}
        <div className="grid grid-cols-2 gap-10  text-black">
          <div className="space-y-2">
            <label className="block font-semibold">Serial No</label>
            <input
              type="text"
              name="srNo"
              value={formData.srNo}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="space-y-2 text-black">
            <label className="block font-semibold">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Sender Details */}
        <div className="grid grid-cols-2 gap-10 text-black">
          <div className="space-y-2">
            <label className="block font-semibold">Sender Information</label>
            <input
              type="text"
              name="sender"
              value={formData.sender}
              onChange={handleInputChange}
              placeholder="Sender Name"
              className="w-full p-2 border rounded"
            />
            {[
              "senderAddLine1",
              "senderAddLine2",
              "senderAddLine3",
              "senderAddLine4",
            ].map((field) => (
              <input
                key={field}
                type="text"
                name={field}
                value={formData[field as keyof FormData]}
                onChange={handleInputChange}
                placeholder={`Address Line ${field.slice(-1)}`}
                className="w-full p-2 border rounded"
              />
            ))}
          </div>

          {/* Receiver Details */}
          <div className="space-y-2 text-black">
            <label className="block font-semibold text-black">
              Receiver Information
            </label>
            <input
              type="text"
              name="receiver"
              value={formData.receiver}
              onChange={handleInputChange}
              placeholder="Receiver Name"
              className="w-full p-2 border rounded"
            />
            {[
              "receiverAddLine1",
              "receiverAddLine2",
              "receiverAddLine3",
              "receiverAddLine4",
            ].map((field) => (
              <input
                key={field}
                type="text"
                name={field}
                value={formData[field as keyof FormData]}
                onChange={handleInputChange}
                placeholder={`Address Line ${field.slice(-1)}`}
                className="w-full p-2 border rounded"
              />
            ))}
          </div>
        </div>

        {/* Subject and Note */}
        <div className="space-y-2">
          <label className="block font-semibold text-black">Subject</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="space-y-2">
          <label className="block font-semibold text-black">Note</label>
          <textarea
            name="Note"
            value={formData.Note}
            onChange={handleInputChange}
            className="w-full p-2 border rounded h-24"
          />
        </div>

        {/* From Details */}
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-2 text-black">
            <label className="block font-semibold">From</label>
            <input
              type="text"
              name="From"
              value={formData.From}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="space-y-2">
            <label className="block font-semibold text-black">
              Designation
            </label>
            <input
              type="text"
              name="From_designation"
              value={formData.From_designation}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </form>

      <div className="mt-6 space-x-4">
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowPreview(true)}
        >
          Preview Notice
        </Button>
      </div>

      {showPreview && (
        <div className="mt-6">
          <NoticePreview formData={{ ...formData, content }} ref={contentRef} />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => reactPrintFn()}
            className="mt-4"
          >
            Print Notice
          </Button>
        </div>
      )}
    </div>
  );
};

export default InfrastructureBooking;
