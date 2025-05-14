"use client";

import { useState, useEffect, useCallback } from "react";
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
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";

interface Question {
  _id: string;
  question: string;
  keyword: string[];
  answer: string;
}

interface CrudTableProps {
  crudQuestions: Question[];
  handleCrudEdit: (q: Question) => void;
  handleCrudDelete: (id: string) => void;
}

const CrudTable = React.memo(function CrudTable({ crudQuestions, handleCrudEdit, handleCrudDelete }: CrudTableProps) {
  return (
    <TableContainer sx={{mt: 5}}
    component={Paper} className="mt-10 rounded-2xl shadow-xl max-w-5xl mt-1">
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
          {crudQuestions?.map((q: Question) => (
            <TableRow key={q._id} className="hover:bg-blue-50 transition">
              <TableCell className="align-top py-3">{q.question}</TableCell>
              <TableCell className="align-top py-3">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(Array.isArray(q.keyword) ? q.keyword : [q.keyword]).map((kw, idx) => (
                    <Chip
                      key={idx}
                      label={kw}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        borderRadius: 1,
                        borderWidth: 2,
                        borderColor: '#1976d2',
                        color: '#1976d2',
                        background: '#e3f0fd'
                      }}
                    />
                  ))}
                </Box>
              </TableCell>
              <TableCell className="align-top py-3">
                <Box
                  sx={{
                    maxHeight: 200,
                    overflowY: "auto",
                    background: "#f9fafb",
                    borderRadius: 1,
                    p: 1,
                    fontSize: "0.95rem",
                    whiteSpace: "pre-line"
                  }}
                  className="custom-scrollbar"
                >
                  {q.answer}
                </Box>
              </TableCell>
              <TableCell className="align-top py-3 text-center">
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  className="mr-2 !rounded-md !py-1 !px-3 !text-sm transition-transform duration-100 active:scale-95"
                  sx={{
                    borderColor: '#FFD600',
                    color: '#FFD600',
                    backgroundColor: '#FFFDE7',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#FFECB3',
                      borderColor: '#FFB300',
                      color: '#FFB300',
                    },//test
                  }}
                  onClick={() => handleCrudEdit(q)}
                  startIcon={<EditIcon />}
                >
                  Sửa
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  className="!rounded-md !py-1 !px-3 !text-sm hover:!bg-red-100 hover:!border-red-500 transition-transform duration-100 active:scale-95"
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
  );
});

export default function Home() {
  const [tab, setTab] = useState(0);
  const [prevTab, setPrevTab] = useState(0);

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
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pendingSortBy, setPendingSortBy] = useState<'createdAt' | 'updatedAt'>(sortBy);
  const [pendingSortOrder, setPendingSortOrder] = useState<'asc' | 'desc'>(sortOrder);
  const [isLocked, setIsLocked] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchCrudQuestions = async (page = 1, sortByParam = sortBy, sortOrderParam = sortOrder) => {
    const res = await fetch(`/api/questions/all?page=${page}&pageSize=${crudPageSize}&sortBy=${sortByParam}&sort=${sortOrderParam}`);
    const data = await res.json();
    setCrudQuestions(data.data);
    setCrudTotal(data.total);
  };
  useEffect(() => {
    if (tab === 1) fetchCrudQuestions(crudPage, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [tab, crudPage, sortBy, sortOrder]);

  const handleCrudChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [e.target.name]: e.target.value })), []);
  const handleCrudTextAreaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, [e.target.name]: e.target.value })), []);

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
    fetchCrudQuestions(crudPage, sortBy, sortOrder);
  };

  const handleCrudEdit = useCallback((q: Question) => {
    setForm({
      question: q.question,
      keyword: Array.isArray(q.keyword) ? q.keyword.join(", ") : q.keyword,
      answer: q.answer,
    });
    setEditingId(q._id);
    setEditOpen(true);
  }, []);

  const handleEditClose = () => {
    setEditOpen(false);
    setEditingId(null);
    setForm({ question: "", keyword: "", answer: "" });
  };

  const handleCrudDelete = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteId) {
      await fetch(`/api/questions/${deleteId}`, { method: "DELETE" });
      fetchCrudQuestions(crudPage, sortBy, sortOrder);
      setDeleteId(null);
      setDeleteOpen(false);
      setSuccessMsg("Xóa câu hỏi thành công!");
    }
  }, [deleteId, crudPage, sortBy, sortOrder]);

  const cancelDelete = useCallback(() => {
    setDeleteId(null);
    setDeleteOpen(false);
  }, []);

  const handleTabChange = (_: any, value: number) => {
    setPrevTab(tab);
    setTab(value);
    if (value === 1 && isLocked) {
      setShowPasswordDialog(true);
    }
  };

  useEffect(() => {
    if (tab === 1 && isLocked && !showPasswordDialog) {
      setShowPasswordDialog(true);
    }
  }, [tab, isLocked, showPasswordDialog]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
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
            Tìm kiếm câu hỏi
          </Typography>
          <Paper sx={{ p: 3, mb: 3 }}>
            <TextField
              fullWidth
              label="Vui lòng nhập câu hỏi"
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
                      <Box
                        sx={{
                          maxHeight: 120,
                          overflowY: "auto",
                          background: "#f9fafb",
                          borderRadius: 2,
                          p: 1,
                          fontSize: "0.95rem"
                        }}
                        className="custom-scrollbar"
                      >
                        {question.answer}
                      </Box>
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
      {tab === 1 && isLocked && (
        <Dialog open={showPasswordDialog} onClose={() => {}}>
          <DialogTitle>Nhập mật khẩu để truy cập</DialogTitle>
          <DialogContent>
            <TextField
              type="password"
              label="Nhập mật khẩu"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              autoFocus
              fullWidth
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setShowPasswordDialog(false);
                setTab(prevTab);
                setPasswordInput("");
                setPasswordError("");
              }}
              variant="outlined"
              color="inherit"
            >
              Quay lại
            </Button>
            <Button
              onClick={() => {
                if (passwordInput === "ChiPhuong") {
                  setIsLocked(false);
                  setShowPasswordDialog(false); //test
                  setPasswordInput("");
                  setPasswordError("");
                } else {
                  setPasswordError("Mật khẩu không đúng!");
                }
              }}
              variant="contained"
              color="primary"
            >
              Xác nhận
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {tab === 1 && !isLocked && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setIsLocked(true)}
            >
              Khoá lại
            </Button>
          </Box>
          <Paper className="max-w-md mx-auto p-8 mb-10 rounded-2xl shadow-lg" elevation={4} sx={{ pb: 3 }}>
            <Typography 
            className="text-center text-2xl font-bold text-blue-700 mt-6" 
            sx={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#1976d2',
              margin: '10px 0',
            }}
            >
              Thêm câu hỏi mới
            </Typography>
            <Stack spacing={3}>
              <TextField
                label="Question"
                name="question"
                value={form.question}
                onChange={handleCrudChange}
                InputProps={{ className: 'rounded-lg bg-white', sx: { paddingLeft: 2 } }}
                className="shadow-sm"
                sx={{
                  width: "100%",
                  '& .MuiInputBase-root': {
                    fontSize: '0.95rem',
                    margin: '0 10px',
                    borderRadius: '8px',
                    minHeight: '36px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#b6c2d9',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    fontSize: '0.95rem',
                  },
                  '& .MuiInputLabel-root': {
                    paddingLeft: '20px',
                    fontWeight: 600,
                    fontSize: '0.80rem',
                  }
                }}
              />
              {/* Keyword */}
              <TextField
                label="Keyword (cách nhau bởi dấu phẩy)"
                name="keyword"
                value={form.keyword}
                onChange={handleCrudChange}
                // InputProps={{ className: 'rounded-lg bg-white', sx: { paddingLeft: 2 } }}
                className="shadow-sm"
                sx={{
                  width: "100%",
                  '& .MuiInputBase-root': {
                    fontSize: '0.95rem',
                    margin: '0 10px',
                    borderRadius: '8px',
                    minHeight: '36px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#b6c2d9',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    fontSize: '0.95rem',
                  },
                  '& .MuiInputLabel-root': {
                    paddingLeft: '20px',
                    fontWeight: 600,
                    fontSize: '0.80rem',
                  }
                }}
              />
              <TextField
                label="Answer"
                name="answer"
                value={form.answer}
                onChange={handleCrudTextAreaChange}
                required
                multiline
                minRows={2}
                InputProps={{ className: 'rounded-lg bg-white', sx: { paddingLeft: 2 } }}
                className="shadow-sm"
                sx={{
                  width: "100%",
                  '& .MuiInputBase-root': {
                    fontSize: '0.95rem',
                    margin: '0 10px',
                    
                    borderRadius: '8px',
                    minHeight: '36px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#b6c2d9',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    fontSize: 'rem',
                  },
                  '& .MuiInputLabel-root': {
                    paddingLeft: '20px',
                    fontWeight: 600,
                    fontSize: '0.80rem',
                  }
                }}
              />
              <Stack
                spacing={2}
                direction="row"
                justifyContent="flex-end"
                sx={{ pr: 2 }}
              >
                <Button
                  variant="outlined"
                  color="inherit"
                  size="medium"
                  onClick={() => setForm({ question: '', keyword: '', answer: '' })}
                  disabled={editingId !== null}
                  className="!rounded-md !py-1 !px-6 !text-base hover:!bg-gray-200 transition-transform duration-100 active:scale-95 "
                  sx={{ px: 3, py: 1 }}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={async () => { await handleCrudSubmit(); }}
                  disabled={editingId !== null}
                  className="!bg-blue-600 !text-white !rounded-md !py-1 !px-6 !text-base hover:!bg-blue-700 shadow-md transition-transform duration-100 active:scale-95"
                  sx={{ px: 3, py: 1 }}
                >
                  THÊM
                </Button>
              </Stack>
            </Stack>
          </Paper>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, border: '1px solid #e3e8ef', borderRadius: 3, background: '#f8fafc', boxShadow: 1 }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="sort-by-label">Sắp xếp theo</InputLabel>
                <Select
                  labelId="sort-by-label"
                  value={pendingSortBy}
                  label="Sắp xếp theo"
                  onChange={(e) => setPendingSortBy(e.target.value as 'createdAt' | 'updatedAt')}
                >
                  <MenuItem value="createdAt">Ngày tạo</MenuItem>
                  <MenuItem value="updatedAt">Ngày cập nhật</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="sort-order-label">Thứ tự</InputLabel>
                <Select
                  labelId="sort-order-label"
                  value={pendingSortOrder}
                  label="Thứ tự"
                  onChange={(e) => setPendingSortOrder(e.target.value as 'asc' | 'desc')}
                >
                  <MenuItem value="desc">Mới nhất</MenuItem>
                  <MenuItem value="asc">Cũ nhất</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setSortBy(pendingSortBy);
                  setSortOrder(pendingSortOrder);
                }}
                sx={{ minWidth: 100 }}
              >
                Áp dụng
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => {
                  setPendingSortBy('createdAt');
                  setPendingSortOrder('desc');
                  setSortBy('createdAt');
                  setSortOrder('desc');
                }}
                sx={{ minWidth: 100 }}
              >
                Clear
              </Button>
            </Box>
          </Box>
          <CrudTable crudQuestions={crudQuestions} handleCrudEdit={handleCrudEdit} handleCrudDelete={handleCrudDelete} />
          <Box 
          className="flex justify-center items-center mt-8 gap-6"
          sx={{
            marginTop: '10px',
          }}
          >
            <Button
              variant="outlined"
              size="medium"
              className=" !w-5 !h-5 !text-base !border-blue-400 hover:!bg-blue-100 transition-transform duration-100 active:scale-95"
              disabled={crudPage === 1}
              onClick={() => setCrudPage((p) => Math.max(1, p - 1))}
            
            >
              &lt;
            </Button>
            <span className="text-lg font-semibold text-blue-700"> Trang {crudPage} / {Math.ceil(crudTotal / crudPageSize) || 1}</span>
            <Button
              variant="outlined"
              size="medium"
              className=" !w-10 !h-10 !text-base !border-blue-400 hover:!bg-blue-100 transition-transform duration-100 active:scale-95"
              disabled={crudPage >= Math.ceil(crudTotal / crudPageSize)}
              onClick={() => setCrudPage((p) => p + 1)}
            >
              &gt;
            </Button>
          </Box>
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
          <Dialog open={deleteOpen} onClose={cancelDelete}>
            <DialogTitle className="text-xl font-bold text-red-600">Xác nhận xoá</DialogTitle>
            <DialogContent>
              <DialogContentText className="text-base">Bạn có chắc chắn muốn xoá câu hỏi này không?</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={cancelDelete} className="!rounded-md !py-1 !px-4 !text-base transition-transform duration-100 active:scale-95">Huỷ</Button>
              <Button onClick={confirmDelete} color="error" variant="contained" className="!rounded-md !py-1 !px-4 !text-base transition-transform duration-100 active:scale-95">Xoá</Button>
            </DialogActions>
          </Dialog>
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
                  // InputProps={{ className: 'rounded-lg bg-white' }}
                />
                <TextField
                  label="Keyword (cách nhau bởi dấu phẩy)"
                  name="keyword"
                  value={form.keyword}
                  onChange={handleCrudChange}
                  fullWidth
                  // InputProps={{ className: 'rounded-lg bg-white' }}
                />
                <TextField
                  label="Answer"
                  name="answer"
                  value={form.answer}
                  onChange={handleCrudTextAreaChange}
                  fullWidth
                  multiline
                  minRows={2}
                  // InputProps={{ className: 'rounded-lg bg-white' }}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEditClose} className="!rounded-md !py-1 !px-4 !text-base transition-transform duration-100 active:scale-95">Huỷ</Button>
              <Button variant="contained" onClick={async () => {
                await handleCrudSubmit();
                setEditOpen(false);
              }} className="!rounded-md !py-1 !px-4 !text-base transition-transform duration-100 active:scale-95">Xác nhận</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  );
}
