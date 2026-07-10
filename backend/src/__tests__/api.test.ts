import { unlink } from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

const historyPath = path.join(process.cwd(), "data", "import-history.json");
const app = createApp();

async function clearHistory() {
  await unlink(historyPath).catch(() => undefined);
}

describe("import API", () => {
  beforeEach(clearHistory);
  afterEach(clearHistory);

  it("returns health metadata", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      service: "groweasy-ai-crm-importer-api"
    });
    expect(response.body.provider).toBeTruthy();
    expect(response.headers["x-request-id"]).toBeTruthy();
  });

  it("validates and previews uploaded CSV files", async () => {
    const response = await request(app)
      .post("/upload")
      .attach("file", Buffer.from("Name,Email,Phone\nRohit,rohit@example.com,+91 9876543210"), {
        filename: "leads.csv",
        contentType: "text/csv"
      })
      .expect(200);

    expect(response.body.filename).toBe("leads.csv");
    expect(response.body.headers).toEqual(["Name", "Email", "Phone"]);
    expect(response.body.statistics).toMatchObject({
      totalRows: 1,
      totalColumns: 3
    });
    expect(response.body.preview[0]).toMatchObject({
      Name: "Rohit",
      Email: "rohit@example.com"
    });
  });

  it("rejects missing and invalid upload files", async () => {
    const missingFile = await request(app).post("/upload").expect(400);
    expect(missingFile.body.error.code).toBe("FILE_REQUIRED");

    const invalidFile = await request(app)
      .post("/upload")
      .attach("file", Buffer.from("hello"), {
        filename: "leads.txt",
        contentType: "text/plain"
      })
      .expect(400);
    expect(invalidFile.body.error.code).toBe("INVALID_FILE_TYPE");

    const spoofedFile = await request(app)
      .post("/upload")
      .attach("file", Buffer.from("hello"), {
        filename: "leads.txt",
        contentType: "text/csv"
      })
      .expect(400);
    expect(spoofedFile.body.error.code).toBe("INVALID_FILE_TYPE");
  });

  it("imports rows, persists history, and returns import details", async () => {
    const importResponse = await request(app)
      .post("/import")
      .send({
        filename: "agency-export.csv",
        headers: ["Customer Name", "Cell Number", "Primary Email", "Lead Status"],
        rows: [
          {
            "Customer Name": "Rohit Sharma",
            "Cell Number": "+91 9876543210",
            "Primary Email": "rohit@example.com",
            "Lead Status": "Good follow up"
          },
          {
            "Customer Name": "No Contact",
            "Cell Number": "",
            "Primary Email": "",
            "Lead Status": ""
          }
        ]
      })
      .expect(201);

    expect(importResponse.body.statistics).toMatchObject({
      totalRows: 2,
      imported: 1,
      skipped: 1,
      failed: 0,
      status: "completed"
    });
    expect(importResponse.body.records[0]).toMatchObject({
      name: "Rohit Sharma",
      email: "rohit@example.com",
      crm_status: "GOOD_LEAD_FOLLOW_UP"
    });
    expect(importResponse.body.skippedRecords[0].reason).toBe("Missing email and mobile number");

    const historyResponse = await request(app).get("/history").expect(200);
    expect(historyResponse.body.history).toHaveLength(1);
    expect(historyResponse.body.history[0]).toMatchObject({
      id: importResponse.body.id,
      filename: "agency-export.csv",
      imported: 1,
      skipped: 1
    });

    const detailResponse = await request(app).get(`/import/${importResponse.body.id}`).expect(200);
    expect(detailResponse.body.id).toBe(importResponse.body.id);
    expect(detailResponse.body.records).toHaveLength(1);

    await request(app).delete(`/import/${importResponse.body.id}`).expect(204);
    await request(app).get(`/import/${importResponse.body.id}`).expect(404);
  });
});
