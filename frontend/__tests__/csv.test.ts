import { describe, expect, it } from "vitest";
import { templateCsv, toCsv } from "@/lib/csv";
import type { ParsedCrmLead } from "@/types/import";

describe("CSV helpers", () => {
  it("exports CRM records as valid CSV text", () => {
    const records: ParsedCrmLead[] = [
      {
        sourceRowIndex: 0,
        created_at: "2026-06-29T10:00:00.000Z",
        name: "Rohit Sharma",
        email: "rohit@example.com",
        country_code: "91",
        mobile_without_country_code: "9876543210",
        company: "GrowEasy",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        lead_owner: "VK Test",
        crm_status: "GOOD_LEAD_FOLLOW_UP",
        crm_note: "Follow up",
        data_source: "leads_on_demand",
        possession_time: "Ready",
        description: "Follow-up note"
      }
    ];

    expect(toCsv(records)).toContain("rohit@example.com");
    expect(templateCsv()).toContain("created_at");
  });
});
