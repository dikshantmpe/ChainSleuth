export const riskColor = (risk) => (risk === "high" || risk === "flagged" ? "#b6ff00" : risk === "suspicious" || risk === "medium" ? "#ffbd4a" : "#718087");
export const riskLabel = (risk) => (risk === "high" || risk === "flagged" ? "HIGH" : risk === "suspicious" || risk === "medium" ? "MEDIUM" : "LOW");
