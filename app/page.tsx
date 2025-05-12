'use client';

import { useState } from 'react';
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
  Alert
} from '@mui/material';

interface Question {
  _id: string;
  question: string;
  keyword: string[];
  answer: string;
}

export default function Home() {
  const [question, setQuestion] = useState('');
  const [keyword, setKeyword] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleQuestionSubmit = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setHasSearched(true);
    setSelectedKeywords([]); // Reset selected keywords
    setQuestions([]); // Reset questions
    try {
      console.log('Submitting question:', question);
      const response = await fetch(`/api/questions/keyword?question=${encodeURIComponent(question)}`);
      const data = await response.json();
      console.log('Keywords API response:', data);

      if (response.ok) {
        setKeyword(data);
      } else {
        console.error('Keyword search failed:', data.error);
        setError(data.error || 'Failed to fetch keywords');
      }
    } catch (error) {
      console.error('Keyword search error:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordToggle = async (keyword: string) => {
    setLoading(true);
    setError('');
    try {
      // Toggle keyword selection
      const newSelectedKeywords = selectedKeywords.includes(keyword)
        ? selectedKeywords.filter(k => k !== keyword)
        : [...selectedKeywords, keyword];
      
      setSelectedKeywords(newSelectedKeywords);

      if (newSelectedKeywords.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      // Tìm kiếm với tất cả keywords đã chọn
      const keywordsParam = newSelectedKeywords.map(k => encodeURIComponent(k)).join(',');
      const response = await fetch(`/api/questions/search?keywords=${keywordsParam}`);
      const data = await response.json();
      console.log('Search API response:', data);

      if (response.ok) {
        setQuestions(data);
      } else {
        console.error('Search failed:', data.error);
        setError(data.error || 'Failed to fetch questions');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuestion('');
    setKeyword([]);
    setSelectedKeywords([]);
    setQuestions([]);
    setError('');
    setHasSearched(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ fontSize: '1.5rem' }}>
        Question Search
      </Typography>

      {/* Question Input Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Enter your question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleQuestionSubmit()}
          placeholder="Type your question and press Enter..."
          multiline
          rows={2}
          sx={{ 
            mb: 2,
            '& .MuiInputBase-input': {
              fontSize: '0.875rem',
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.875rem',
            }
          }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleQuestionSubmit}
            disabled={loading}
            fullWidth
            sx={{ fontSize: '0.875rem' }}
          >
            {loading ? 'Searching...' : 'Find Keywords'}
          </Button>
          {hasSearched && (
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={loading}
              sx={{ fontSize: '0.875rem' }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '0.875rem' } }}>
          {error}
        </Alert>
      )}

      {/* No Results Message */}
      {hasSearched && !loading && keyword.length === 0 && (
        <Alert severity="info" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '0.875rem' } }}>
          No keywords found for your question. Please try a different question.
        </Alert>
      )}

      {/* Keywords Section */}
      {keyword.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
            Related Keywords ({keyword.length}) - Selected: {selectedKeywords.length}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {keyword.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                onClick={() => handleKeywordToggle(kw)}
                clickable
                color={selectedKeywords.includes(kw) ? "primary" : "default"}
                variant={selectedKeywords.includes(kw) ? "filled" : "outlined"}
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Selected Keywords Section */}
      {selectedKeywords.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
            Selected Keywords:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {selectedKeywords.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                onDelete={() => handleKeywordToggle(kw)}
                color="primary"
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* No Questions Found Message */}
      {selectedKeywords.length > 0 && !loading && questions.length === 0 && (
        <Alert severity="info" sx={{ '& .MuiAlert-message': { fontSize: '0.875rem' } }}>
          No questions found for the selected keywords: <strong>{selectedKeywords.join(', ')}</strong>
        </Alert>
      )}

      {/* Results Section */}
      {questions.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
            Questions and Answers ({questions.length} results)
          </Typography>
          <Stack spacing={2}>
            {questions.map((question) => (
              <Card key={question._id}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
                    {question.question}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ fontSize: '0.75rem' }}>
                      Keywords:{' '}
                    </Typography>
                    {question.keyword.map((k, i) => (
                      <Chip
                        key={i}
                        label={k}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5, fontSize: '0.75rem' }}
                        onClick={() => !selectedKeywords.includes(k) && handleKeywordToggle(k)}
                        color={selectedKeywords.includes(k) ? "primary" : "default"}
                      />
                    ))}
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
                    {question.answer}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {loading && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Loading...
          </Typography>
        </Box>
      )}
    </Container>
  );
} 