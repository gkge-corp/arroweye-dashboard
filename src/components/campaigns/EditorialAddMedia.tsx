"use client";
import { Input } from "@/components/ui/input";
import { CreateMedia } from "@/services";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { SelectInput } from "@/components/ui/selectinput";
import { toast } from "sonner";

interface FormData {
  channel: string;
  editorial_link: string;
  publication: string;
}

interface FormErrors {
  channel: string;
  editorial_link: string;
  publication: string;
}

interface TableData {
  channel: string;
  publication: string;
  editorial_link: string;
}

interface EditorialAddMediaProps {
  onSuccess?: () => void;
}

const EditorialAddMedia: React.FC<EditorialAddMediaProps> = ({ onSuccess }) => {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [formData, setFormData] = useState<FormData>({
    channel: "",
    editorial_link: "",
    publication: "",
  });

  const [tableData, setTableData] = useState<TableData[]>([]);

  const [errors, setErrors] = useState<FormErrors>({
    channel: "",
    editorial_link: "",
    publication: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  const channelOptions = [
    "Website",
    "Newsletter",
    "Instagram",
    "Twitter",
    "Facebook",
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      channel: "",
      editorial_link: "",
      publication: "",
    };

    let isValid = true;

    if (!formData.channel) {
      newErrors.channel = "Channel is required";
      isValid = false;
    }

    if (!formData.editorial_link.trim()) {
      newErrors.editorial_link = "Source link is required";
      isValid = false;
    }

    if (!formData.publication.trim()) {
      newErrors.publication = "Publication is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsUploading(true);

    try {
      const payload = {
        channel: formData.channel,
        editorial_link: formData.editorial_link.trim(),
        publication: formData.publication.trim(),
        type: "Editorial",
      };

      await CreateMedia(id, payload);
      setTableData((prev) => [
        ...prev,
        {
          channel: payload.channel,
          publication: payload.publication,
          editorial_link: payload.editorial_link,
        },
      ]);
      resetForm();
      onSuccess?.();
    } catch (err) {
      // CreateMedia's request layer has already shown the error toast.
      console.error("Editorial media creation failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      channel: "",
      editorial_link: "",
      publication: "",
    });
    setErrors({
      channel: "",
      editorial_link: "",
      publication: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleExportCSV = () => {
    if (tableData.length === 0) {
      toast.error("No data available to export");
      return;
    }

    // Create CSV content
    const headers = ["Publication,Channel,Link"];
    const rows = tableData.map(
      (item) =>
        `${item.publication.replace(/,/g, ";")},${item.channel.replace(/,/g, ";")},${item.editorial_link.replace(/,/g, ";")}`,
    );
    const csvContent = headers.concat(rows).join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "editorial_media.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="px-5 mt-5">
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="space-y-4">
          <div>
            <SelectInput
              name="channel"
              value={formData.channel}
              onChange={(value: any) => {
                setFormData((prev) => ({
                  ...prev,
                  channel: value,
                }));
                setErrors((prev) => ({
                  ...prev,
                  channel: "",
                }));
              }}
              placeholder="Select Channel"
              options={[
                { value: "Website", label: "Website" },
                { value: "NewsLetter", label: "NewsLetter" },
                { value: "Instagram", label: "Instagram" },
                { value: "Twitter", label: "Twitter" },
                { value: "Facebook", label: "Facebook" },
              ]}
            />
            {errors.channel && (
              <p className="text-red-500 text-xs mt-1">{errors.channel}</p>
            )}
          </div>
          <div>
            <Input
              type="text"
              name="editorial_link"
              placeholder="Link *"
              value={formData.editorial_link}
              onChange={handleInputChange}
              className={errors.editorial_link ? "border-red-500" : ""}
              disabled={isUploading}
            />
            {errors.editorial_link && (
              <p className="text-red-500 text-xs mt-1">
                {errors.editorial_link}
              </p>
            )}
          </div>
          <div>
            <Input
              type="text"
              name="publication"
              placeholder="Publication"
              value={formData.publication}
              onChange={handleInputChange}
              className={errors.publication ? "border-red-500" : ""}
              disabled={isUploading}
            />
            {errors.publication && (
              <p className="text-red-500 text-xs mt-1">{errors.publication}</p>
            )}
          </div>

          <div className="mt-5">
            <button
              type="submit"
              disabled={isUploading}
              className="font-SansFlex text-sm text-white hover:text-white bg-black border border-black hover:bg-orange-500 hover:border-none py-2 px-5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Submit"}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-8">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left border border-gray-200 font-medium">
                Publication
              </th>
              <th className="px-4 py-2 text-left border border-gray-200 font-medium">
                Channel
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td
                  className="px-4 py-2 border border-gray-200 cursor-pointer text-blue-500"
                  onClick={() => window.open(item.editorial_link, "_blank")}
                >
                  {item.publication}
                </td>
                <td className="px-4 py-2 border border-gray-200">
                  {item.channel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">
          <button
            onClick={handleExportCSV}
            disabled={tableData.length === 0}
            className="font-SansFlex text-sm text-white hover:text-white bg-black border border-black hover:bg-orange-500 hover:border-none py-2 px-5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorialAddMedia;
