import { useState } from "react";

function App() {
  const [prompt, setPrompt] = useState("");
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({});

  async function generateForm() {
    try {
      const res = await fetch("http://localhost:8000/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      console.log("RAW RESPONSE FROM BACKEND:", data);

      // ---- CASE 1: Gemini wrapped output ----
      if (data.raw_output) {
        try {
          const parsed = JSON.parse(data.raw_output);
          setSchema(parsed);
          return;
        } catch (e) {
          console.error("Failed to parse raw_output:", data.raw_output);
          alert("Backend returned invalid JSON. Check console.");
          return;
        }
      }

      // ---- CASE 2: Gemini returned stringified JSON ----
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          setSchema(parsed);
          return;
        } catch (e) {
          console.error("Failed to parse string JSON:", data);
          alert("Backend returned invalid JSON string.");
          return;
        }
      }

      // ---- CASE 3: Correct schema ----
      if (data && Array.isArray(data.fields)) {
        setSchema(data);
        return;
      }

      // ---- Fallback ----
      console.error("Unexpected schema format:", data);
      alert("Unexpected schema format. Check console.");

    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to connect to backend.");
    }
  }

  function handleChange(name, value) {
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleSubmit() {
    if (!schema || !Array.isArray(schema.fields)) {
      alert("No valid schema to submit.");
      return;
    }

    const payload = {};
    schema.fields.forEach(field => {
      payload[field.name] = {
        value: formData[field.name] || "",
        meta: field.meta
      };
    });

    console.log("FINAL SUBMITTED PAYLOAD:", payload);
    alert("Form submitted. Check console.");
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Dynamic Form Generator</h2>

      <input
        className="form-control mb-3"
        placeholder="Describe the form you need"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
      />

      <button className="btn btn-primary mb-4" onClick={generateForm}>
        Generate Form
      </button>

      {/* ---- SAFE RENDERING ---- */}
      {schema && Array.isArray(schema.fields) && (
        <div className="card p-4">
          <h4 className="mb-3">
            {schema.title || "Generated Form"}
          </h4>

          {schema.fields.map(field => (
            <div className="mb-3" key={field.name}>
              <label className="form-label">{field.label}</label>

              {field.type === "textarea" ? (
                <textarea
                  className="form-control"
                  onChange={e => handleChange(field.name, e.target.value)}
                />
              ) : (
                <input
                  type={field.type || "text"}
                  className="form-control"
                  onChange={e => handleChange(field.name, e.target.value)}
                />
              )}
            </div>
          ))}

          <button className="btn btn-success" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
