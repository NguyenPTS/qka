"use client";

import { useState, useEffect } from "react";
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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Alert as MuiAlert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface Question {
  _id: string;
  question: string;
  keyword: string[];
  answer: string;
}

export default function Home() {
  const [tab, setTab] = useState(0);

  // --- SEARCH STATE & LOGIC ---
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
    setSelectedKeywords([]);
    setQuestions([]);
    try {
      const response = await fetch(
        `/api/questions/keyword?question=${encodeURIComponent(question)}`
      );
      const data = await response.json();
      if (response.ok) {
        setKeyword(data);
      } else {
        setError(data.error || "Failed to fetch keywords");
      }
    } catch (error) {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordToggle = async (keyword: string) => {
    setLoading(true);
    setError("");
    try {
      const newSelectedKeywords = selectedKeywords.includes(keyword)
        ? selectedKeywords.filter((k) => k !== keyword)
        : [...selectedKeywords, keyword];
      setSelectedKeywords(newSelectedKeywords);
      if (newSelectedKeywords.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }
      const keywordsParam = newSelectedKeywords
        .map((k) => encodeURIComponent(k))
        .join(",");
      const response = await fetch(
        `/api/questions/search?keywords=${keywordsParam}`
      );
      const data = await response.json();
      if (response.ok) {
        setQuestions(data);
      } else {
        setError(data.error || "Failed to fetch questions");
      }
    } catch (error) {
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

  // --- CRUD STATE & LOGIC ---
  const [crudQuestions, setCrudQuestions] = useState<Question[]>([]);
  const [crudTotal, setCrudTotal] = useState(0);
  const [crudPage, setCrudPage] = useState(1);
  const crudPageSize = 10;
  const [form, setForm] = useState({ question: "", keyword: "", answer: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const fetchCrudQuestions = async (page = 1) => {
    const res = await fetch(`/api/questions/all?page=${page}&pageSize=${crudPageSize}`);
    const data = await res.json();
    setCrudQuestions(data.data);
    setCrudTotal(data.total);
  };
  useEffect(() => {
    if (tab === 1) fetchCrudQuestions(crudPage);
  }, [tab, crudPage]);

  const handleCrudChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCrudTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCrudSubmit = async () => {
    if (editingId) {
      await fetch(`/api/questions/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          keyword: form.keyword.split(",").map((k) => k.trim())
        }),
      });
      setSuccessMsg("Cập nhật câu hỏi thành công!");
    } else {
      await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          keyword: form.keyword.split(",").map((k) => k.trim())
        }),
      });
      setSuccessMsg("Thêm câu hỏi thành công!");
    }
    setForm({ question: "", keyword: "", answer: "" });
    setEditingId(null);
    fetchCrudQuestions(crudPage);
  };

  const handleCrudEdit = (q: Question) => {
    setForm({
      question: q.question,
      keyword: Array.isArray(q.keyword) ? q.keyword.join(", ") : q.keyword,
      answer: q.answer,
    });
    setEditingId(q._id);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditingId(null);
    setForm({ question: "", keyword: "", answer: "" });
  };

  const handleCrudDelete = async (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await fetch(`/api/questions/${deleteId}`, { method: "DELETE" });
      fetchCrudQuestions(crudPage);
      setDeleteId(null);
      setDeleteOpen(false);
      setSuccessMsg("Xóa câu hỏi thành công!");
    }
  };

  const cancelDelete = () => {
    setDeleteId(null);
    setDeleteOpen(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Tìm kiếm câu hỏi" />
        <Tab label="Quản lý câu hỏi" />
      </Tabs>
      {tab === 0 && (
        <>
          {/* --- SEARCH UI --- */}
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            align="center"
            sx={{ fontSize: "1.5rem" }}
          >
            Question Search
          </Typography>
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
              sx={{ mb: 2, "& .MuiInputBase-input": { fontSize: "0.875rem" }, "& .MuiInputLabel-root": { fontSize: "0.875rem" } }}
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
          {error && (
            <Alert severity="error" sx={{ mb: 2, "& .MuiAlert-message": { fontSize: "0.875rem" } }}>{error}</Alert>
          )}
          {hasSearched && !loading && keyword.length === 0 && (
            <Alert severity="info" sx={{ mb: 2, "& .MuiAlert-message": { fontSize: "0.875rem" } }}>
              No keywords found for your question. Please try a different question.
            </Alert>
          )}
          {keyword.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: "1rem" }}>
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
                    sx={{ fontSize: "0.75rem" }}
                  />
                ))}
              </Stack>
            </Paper>
          )}
          {selectedKeywords.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: "1rem" }}>
                Selected Keywords:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {selectedKeywords.map((kw) => (
                  <Chip
                    key={kw}
                    label={kw}
                    onDelete={() => handleKeywordToggle(kw)}
                    color="primary"
                    sx={{ fontSize: "0.75rem" }}
                  />
                ))}
              </Stack>
            </Paper>
          )}
          {selectedKeywords.length > 0 && !loading && questions.length === 0 && (
            <Alert severity="info" sx={{ "& .MuiAlert-message": { fontSize: "0.875rem" } }}>
              No questions found for the selected keywords: <strong>{selectedKeywords.join(", ")}</strong>
            </Alert>
          )}
          {questions.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: "1rem" }}>
                Questions and Answers ({questions.length} results)
              </Typography>
              <Stack spacing={2}>
                {questions?.map((question) => (
                  <Card key={question._id}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontSize: "1rem" }}>
                        {question.question}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ fontSize: "0.75rem" }}>
                          Keywords: {" "}
                        </Typography>
                        {question.keyword.map((k, i) => (
                          <Chip
                            key={i}
                            label={k}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5, fontSize: "0.75rem" }}
                            onClick={() =>
                              !selectedKeywords.includes(k) && handleKeywordToggle(k)
                            }
                            color={selectedKeywords.includes(k) ? "primary" : "default"}
                          />
                        ))}
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body1" sx={{ fontSize: "0.875rem" }}>
                        {question.answer}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
          {loading && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography color="text.secondary" sx={{ fontSize: "0.875rem" }}>
                Loading...
              </Typography>
            </Box>
          )}
        </>
      )}
      {tab === 1 && (
        <Box className="p-6 bg-gradient-to-br from-blue-50 to-white min-h-screen">
          {/* FORM NHẬP LIỆU */}
          <Paper className="max-w-xl mx-auto p-8 mb-8 rounded-2xl shadow-lg" elevation={4}>
            <Typography className="text-center text-2xl font-bold mb-6 text-blue-700">
              Thêm câu hỏi mới
            </Typography>
            <Stack spacing={3}>
              <TextField
                label="Question"
                name="question"
                value={form.question}
                onChange={handleCrudChange}
                fullWidth
                disabled={editingId !== null}
                InputProps={{ className: 'rounded-lg bg-white' }}
              />
              <TextField
                label="Keyword (cách nhau bởi dấu phẩy)"
                name="keyword"
                value={form.keyword}
                onChange={handleCrudChange}
                fullWidth
                disabled={editingId !== null}
                InputProps={{ className: 'rounded-lg bg-white' }}
              />
              <TextField
                label="Answer"
                name="answer"
                value={form.answer}
                onChange={handleCrudTextAreaChange}
                fullWidth
                multiline
                minRows={2}
                disabled={editingId !== null}
                InputProps={{ className: 'rounded-lg bg-white' }}
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={async () => { await handleCrudSubmit(); }}
                disabled={editingId !== null}
                className="!bg-blue-600 !text-white !rounded-lg !py-3 !text-lg hover:!bg-blue-700 shadow-md"
              >
                Thêm
              </Button>
            </Stack>
          </Paper>
          {/* BẢNG DANH SÁCH */}
          <TableContainer component={Paper} className="mt-8 rounded-2xl shadow-xl max-w-5xl mx-auto">
            <Table size="small">
              <TableHead>
                <TableRow className="bg-blue-100">
                  <TableCell className="font-bold text-blue-700 text-base py-3">Question</TableCell>
                  <TableCell className="font-bold text-blue-700 text-base py-3">Keyword</TableCell>
                  <TableCell className="font-bold text-blue-700 text-base py-3">Answer</TableCell>
                  <TableCell className="font-bold text-blue-700 text-base py-3 text-center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {crudQuestions?.map((q) => (
                  <TableRow key={q._id} className="hover:bg-blue-50 transition">
                    <TableCell className="align-top py-3">{q.question}</TableCell>
                    <TableCell className="align-top py-3">{Array.isArray(q.keyword) ? q.keyword.join(", ") : q.keyword}</TableCell>
                    <TableCell className="align-top py-3">{q.answer}</TableCell>
                    <TableCell className="align-top py-3 text-center">
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        className="mr-2 !rounded-full !border-2 !border-yellow-400 hover:!bg-yellow-100 hover:!border-yellow-500"
                        onClick={() => handleCrudEdit(q)}
                        startIcon={<EditIcon />}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        className="!rounded-full !border-2 !border-red-400 hover:!bg-red-100 hover:!border-red-500"
                        onClick={() => handleCrudDelete(q._id)}
                        startIcon={<DeleteIcon />}
                      >
                        Xoá
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {/* PHÂN TRANG */}
          <Box className="flex justify-center items-center mt-8 gap-6">
            <Button
              variant="outlined"
              size="large"
              className="!rounded-full !w-12 !h-12 !text-lg !border-blue-400 hover:!bg-blue-100"
              disabled={crudPage === 1}
              onClick={() => setCrudPage((p) => Math.max(1, p - 1))}
            >
              &lt;
            </Button>
            <span className="text-lg font-semibold text-blue-700">Trang {crudPage} / {Math.ceil(crudTotal / crudPageSize) || 1}</span>
            <Button
              variant="outlined"
              size="large"
              className="!rounded-full !w-12 !h-12 !text-lg !border-blue-400 hover:!bg-blue-100"
              disabled={crudPage >= Math.ceil(crudTotal / crudPageSize)}
              onClick={() => setCrudPage((p) => p + 1)}
            >
              &gt;
            </Button>
          </Box>
          {/* SNACKBAR THÔNG BÁO */}
          <Snackbar
            open={!!successMsg}
            autoHideDuration={2500}
            onClose={() => setSuccessMsg("")}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <MuiAlert onClose={() => setSuccessMsg("")} severity="success" sx={{ width: '100%' }}>
              {successMsg}
            </MuiAlert>
          </Snackbar>
          {/* DIALOG XÁC NHẬN XOÁ */}
          <Dialog open={deleteOpen} onClose={cancelDelete}>
            <DialogTitle className="text-xl font-bold text-red-600">Xác nhận xoá</DialogTitle>
            <DialogContent>
              <DialogContentText className="text-base">Bạn có chắc chắn muốn xoá câu hỏi này không?</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={cancelDelete} className="!rounded-lg">Huỷ</Button>
              <Button onClick={confirmDelete} color="error" variant="contained" className="!rounded-lg">Xoá</Button>
            </DialogActions>
          </Dialog>
          {/* DIALOG SỬA */}
          <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
            <DialogTitle className="text-xl font-bold text-blue-700">Cập nhật câu hỏi</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField
                  label="Question"
                  name="question"
                  value={form.question}
                  onChange={handleCrudChange}
                  fullWidth
                  InputProps={{ className: 'rounded-lg bg-white' }}
                />
                <TextField
                  label="Keyword (cách nhau bởi dấu phẩy)"
                  name="keyword"
                  value={form.keyword}
                  onChange={handleCrudChange}
                  fullWidth
                  InputProps={{ className: 'rounded-lg bg-white' }}
                />
                <TextField
                  label="Answer"
                  name="answer"
                  value={form.answer}
                  onChange={handleCrudTextAreaChange}
                  fullWidth
                  multiline
                  minRows={2}
                  InputProps={{ className: 'rounded-lg bg-white' }}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEditClose} className="!rounded-lg">Huỷ</Button>
              <Button variant="contained" onClick={async () => {
                await handleCrudSubmit();
                setEditOpen(false);
              }} className="!rounded-lg">Xác nhận</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Container>
  );
}
