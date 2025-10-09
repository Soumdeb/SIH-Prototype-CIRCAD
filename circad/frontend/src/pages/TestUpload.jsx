import React, { useState } from "react";
import { uploadFile, analyzeFile } from "../api/uploadService";

const TestUpload = () => {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please choose a file first!");

    try {
        console.log("Uploading file:", file.name);
        const uploadData = await uploadFile(file);
        console.log("Upload successful:", uploadData);
        alert("✅ File uploaded successfully!");

        // Now trigger the analysis
        const analysisData = await analyzeFile(uploadData.file_id);
        console.log("Analysis result:", analysisData);
        setResponse(analysisData);

        alert("📊 Analysis complete! Scroll down to see results.");
    } catch (error) {
        console.error("Process failed:", error);
        alert("❌ Something went wrong during upload or analysis.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Test File Upload</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginRight: "1rem" }}
        />
        <button type="submit">Upload</button>
      </form>

      {response && (
        <pre style={{ marginTop: "1rem" }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default TestUpload;
