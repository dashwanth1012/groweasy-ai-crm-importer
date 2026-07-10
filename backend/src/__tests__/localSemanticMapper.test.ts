import { describe, expect, it } from "vitest";
import { LocalSemanticMapper } from "../services/localSemanticMapper.js";

describe("LocalSemanticMapper", () => {
  it("maps common lead data into CRM records and skips empty contacts", async () => {
    const mapper = new LocalSemanticMapper();
    const result = await mapper.mapRows({
      headers: ["Customer Name", "Cell Number", "Primary Email", "Lead Status"],
      rows: [
        {
          sourceRowIndex: 0,
          "Customer Name": "Rohit Sharma",
          "Cell Number": "+91 9876543210",
          "Primary Email": "rohit@example.com",
          "Lead Status": "Good follow up"
        },
        {
          sourceRowIndex: 1,
          "Customer Name": "No Contact",
          "Cell Number": "",
          "Primary Email": "",
          "Lead Status": ""
        }
      ]
    });

    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      name: "Rohit Sharma",
      email: "rohit@example.com",
      country_code: "91",
      mobile_without_country_code: "9876543210",
      crm_status: "GOOD_LEAD_FOLLOW_UP"
    });
    expect(result.skippedRecords).toHaveLength(1);
  });

  it("does not use phone numbers or locations as lead names", async () => {
    const mapper = new LocalSemanticMapper();
    const result = await mapper.mapRows({
      headers: ["Lead", "Mobile", "State", "Email", "Remarks"],
      rows: [
        {
          sourceRowIndex: 0,
          Lead: "9988112233,8877665544",
          Mobile: "9988112233",
          State: "Karnataka",
          Email: "michael@example.com"
        },
        {
          sourceRowIndex: 1,
          Lead: "Karnataka",
          Mobile: "8877665544",
          State: "Karnataka",
          Email: "",
          Remarks: "Location only"
        },
        {
          sourceRowIndex: 2,
          Lead: "Michael Thomas",
          Mobile: "9988112233",
          State: "Karnataka",
          Email: "michael.thomas@example.com"
        }
      ]
    });

    expect(result.records).toHaveLength(3);
    expect(result.records[0].name).toBe("");
    expect(result.records[1].name).toBe("");
    expect(result.records[2].name).toBe("Michael Thomas");
  });
});
