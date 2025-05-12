import { useState } from "react";
import {
  TextField,
  Button,
  Paper,
  Container,
  Typography,
  Divider,
  Box,
  Chip,
  Stack,
  Card,
  CardContent,
  Alert,
} from "@mui/material";

interface Question {
  _id: string;
  question: string;
  keyword: string[];
  answer: string;
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [keyword, setKeyword] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleQuestionSubmit = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setHasSearched(true);
    setSelectedKeywords([]); // Reset selected keywords
    setQuestions([]); // Reset questions
    try {
      console.log("Submitting question:", question);
      const response = await fetch(
        `/api/questions/keyword?question=${encodeURIComponent(question)}`
      );
      const data = await response.json();
      console.log("Keywords API response:", data);

      if (response.ok) {
        setKeyword(data);
      } else {
        console.error("Keyword search failed:", data.error);
        setError(data.error || "Failed to fetch keywords");
      }
    } catch (error) {
      console.error("Keyword search error:", error);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordToggle = async (keyword: string) => {
    setLoading(true);
    setError("");
    try {
      // Toggle keyword selection
      const newSelectedKeywords = selectedKeywords.includes(keyword)
        ? selectedKeywords.filter((k) => k !== keyword)
        : [...selectedKeywords, keyword];

      setSelectedKeywords(newSelectedKeywords);

      if (newSelectedKeywords.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      // Tìm kiếm với tất cả keywords đã chọn
      const keywordsParam = newSelectedKeywords
        .map((k) => encodeURIComponent(k))
        .join(",");
      const response = await fetch(
        `/api/questions/search?keywords=${keywordsParam}`
      );
      const data = await response.json();
      console.log("Search API response:", data);

      if (response.ok) {
        setQuestions(data);
      } else {
        console.error("Search failed:", data.error);
        setError(data.error || "Failed to fetch questions");
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuestion("");
    setKeyword([]);
    setSelectedKeywords([]);
    setQuestions([]);
    setError("");
    setHasSearched(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography
        variant="h5"
        component="h1"
        gutterBottom
        align="center"
        sx={{ fontSize: "1.5rem" }}
      >
        Question Search
      </Typography>

      {/* Question Input Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Enter your question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleQuestionSubmit()}
          placeholder="Type your question and press Enter..."
          multiline
          rows={2}
          sx={{
            mb: 2,
            "& .MuiInputBase-input": {
              fontSize: "0.875rem",
            },
            "& .MuiInputLabel-root": {
              fontSize: "0.875rem",
            },
          }}
        />
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleQuestionSubmit}
            disabled={loading}
            fullWidth
            sx={{ fontSize: "0.875rem" }}
          >
            {loading ? "Searching..." : "Find Keywords"}
          </Button>
          {hasSearched && (
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={loading}
              sx={{ fontSize: "0.875rem" }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, "& .MuiAlert-message": { fontSize: "0.875rem" } }}
        >
          {error}
        </Alert>
      )}

      {/* No Results Message */}
      {hasSearched && !loading && keyword.length === 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2, "& .MuiAlert-message": { fontSize: "0.875rem" } }}
        >
          No keywords found for your question. Please try a different question.
        </Alert>
      )}

      {/* Keywords Section */}
      {keyword.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: "1rem" }}>
            Related Keywords ({keyword.length}) - Selected:{" "}
            {selectedKeywords.length}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {keyword.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                color={selectedKeywords.includes(kw) ? "primary" : "default"}
                onClick={() => handleKeywordToggle(kw)}
                clickable
                sx={{ fontSize: "0.875rem" }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Questions Section */}
      {questions.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: "1rem" }}>
            Questions ({questions.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            {questions.map((q) => (
              <Card key={q._id}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {q.question}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Keywords: {q.keyword.join(", ")}
                  </Typography>
                  <Typography variant="body1">{q.answer}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>
      )}
    </Container>
  );
} 