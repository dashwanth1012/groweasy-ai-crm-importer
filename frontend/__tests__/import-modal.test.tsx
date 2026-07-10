import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { ImportModal } from "@/components/importer/import-modal";
import type { CsvPreview } from "@/types/import";

const preview: CsvPreview = {
  filename: "CRM_leads_import.csv",
  headers: ["Lead Name", "Email", "Contact"],
  rows: [
    {
      "Lead Name": "Rohit Sharma",
      Email: "rohit@example.com",
      Contact: "+91 9876543210"
    }
  ],
  preview: [
    {
      "Lead Name": "Rohit Sharma",
      Email: "rohit@example.com",
      Contact: "+91 9876543210"
    }
  ],
  statistics: {
    totalRows: 1,
    totalColumns: 3
  }
};

describe("ImportModal", () => {
  it("renders the dropzone state with upload disabled until a CSV is parsed", () => {
    const onClose = vi.fn();

    render(createElement(ImportModal, { open: true, preview: null, loading: false, onClose, onPreview: vi.fn(), onConfirm: vi.fn() }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Drop your CSV file here")).toBeTruthy();
    expect(screen.getByText("Download CSV Template")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Upload File" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders preview details and enables confirmation after parsing", () => {
    const onConfirm = vi.fn();

    render(createElement(ImportModal, { open: true, preview, loading: false, onClose: vi.fn(), onPreview: vi.fn(), onConfirm }));

    expect(screen.getByText("CRM_leads_import.csv")).toBeTruthy();
    expect(screen.getByText("1 rows - 3 columns")).toBeTruthy();
    expect(screen.getByText("Detected headers")).toBeTruthy();

    const uploadButton = screen.getByRole("button", { name: "Upload File" }) as HTMLButtonElement;
    expect(uploadButton.disabled).toBe(false);
    fireEvent.click(uploadButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
