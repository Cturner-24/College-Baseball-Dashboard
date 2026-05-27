import { FormEvent, useState } from "react";
import { Loader, Placeholder } from "@aws-amplify/ui-react";
import "./App.css";
import { Amplify } from "aws-amplify";
import { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const amplifyClient = generateClient<Schema>({
  authMode: "userPool",
});

function App() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const team = formData.get("team")?.toString() || "";
      const opponent = formData.get("opponent")?.toString() || "";
      const date = formData.get("date")?.toString() || "";

      const query = `College baseball game summary and stats for ${team} vs ${opponent} on ${date}. Include score, hitting leaders, pitching summary, and key plays.`;

      const { data, errors } = await amplifyClient.queries.askBedrock({
        ingredients: [query],
      });

      if (!errors) {
        setResult(data?.body || "No data returned");
      } else {
        console.log(errors);
      }
    } catch (e) {
      alert(`An error occurred: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header-container">
        <h1 className="main-header">
          College Baseball
          <br />
          <span className="highlight">Game Dashboard</span>
        </h1>
        <p className="description">
          Enter two teams and a game date to get an AI-generated game summary,
          box score breakdown, and key player performances.
        </p>
      </div>

      <form onSubmit={onSubmit} className="form-container">
        <div className="search-container">
          <input
            type="text"
            className="wide-input"
            id="team"
            name="team"
            placeholder="Home Team (e.g. Vanderbilt Commodores)"
          />
          <input
            type="text"
            className="wide-input"
            id="opponent"
            name="opponent"
            placeholder="Away Team (e.g. Tennessee Volunteers)"
          />
          <input
            type="date"
            className="wide-input"
            id="date"
            name="date"
          />
          <button type="submit" className="search-button">
            Get Game Summary
          </button>
        </div>
      </form>

      <div className="result-container">
        {loading ? (
          <div className="loader-container">
            <p>Loading game data...</p>
            <Loader size="large" />
            <Placeholder size="large" />
            <Placeholder size="large" />
            <Placeholder size="large" />
          </div>
        ) : (
          result && <p className="result">{result}</p>
        )}
      </div>
    </div>
  );
}

export default App;